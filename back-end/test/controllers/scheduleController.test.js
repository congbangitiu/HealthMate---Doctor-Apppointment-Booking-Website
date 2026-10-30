import { beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';

const mocks = vi.hoisted(() => ({
    Booking: { findById: vi.fn(), findOne: vi.fn(), findOneAndUpdate: vi.fn(), find: vi.fn(), updateMany: vi.fn() },
    Doctor: { findById: vi.fn(), findOneAndUpdate: vi.fn(), updateOne: vi.fn() },
}));
vi.mock('../../Models/BookingSchema.js', () => ({ default: mocks.Booking }));
vi.mock('../../Models/DoctorSchema.js', () => ({ default: mocks.Doctor }));
import { getCalendarAvailability, rescheduleAppointment, getScheduleNotifications, markScheduleNotificationsRead } from '../../Controllers/scheduleController.js';

const bookingId = '507f1f77bcf86cd799439011';
const doctorId = '507f1f77bcf86cd799439012';
const patientId = '507f1f77bcf86cd799439013';
const from = { day: '2026-10-24', startingTime: '08:00', endingTime: '08:30' };
const to = { ...from, startingTime: '09:00', endingTime: '09:30' };
let booking;
let session;
let req;
const response = () => {
    const res = {};
    res.status = vi.fn(() => res);
    res.json = vi.fn(() => res);
    return res;
};
beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-23T10:00:00+07:00'));
    booking = {
        _id: bookingId,
        doctor: { _id: doctorId },
        user: { _id: patientId },
        timeSlot: from,
        status: 'pending',
        scheduleVersion: 0,
    };
    session = { withTransaction: vi.fn(async (work) => work()), endSession: vi.fn() };
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(session);
    mocks.Booking.findById.mockReturnValue({ session: vi.fn(async () => booking) });
    mocks.Booking.findOne.mockReturnValue({ session: vi.fn(async () => null) });
    mocks.Booking.findOneAndUpdate.mockResolvedValue({ ...booking, timeSlot: to, scheduleVersion: 1 });
    mocks.Doctor.findOneAndUpdate.mockResolvedValue({ _id: doctorId, fullname: 'Doctor A' });
    mocks.Doctor.updateOne.mockResolvedValue({ modifiedCount: 1 });
    req = {
        params: { id: bookingId },
        userId: doctorId,
        userRole: 'doctor',
        body: { timeSlot: to, expectedVersion: 0, reason: 'Patient requested a later time' },
        io: { emit: vi.fn() },
    };
    req.io.in = vi.fn(() => ({ emit: req.io.emit }));
    req.io.to = vi.fn(() => ({ emit: req.io.emit }));
});

describe('reschedule authorization and validation', () => {
    it.each(['patient', 'admin', undefined])('rejects role %s before accessing the database', async (role) => {
        req.userRole = role;
        const res = response();
        await rescheduleAppointment(req, res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(mongoose.startSession).not.toHaveBeenCalled();
    });
    it('rejects a doctor attempting to edit another doctor’s booking', async () => {
        booking.doctor = { _id: patientId };
        const res = response();
        await rescheduleAppointment(req, res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(mocks.Doctor.findOneAndUpdate).not.toHaveBeenCalled();
        expect(session.endSession).toHaveBeenCalled();
    });
    it.each([
        { reason: '' },
        { expectedVersion: -1 },
        { expectedVersion: undefined },
        { timeSlot: { ...to, day: '2026-02-30' } },
        { timeSlot: { ...to, day: '2026-10-23', startingTime: '09:00' } },
    ])('rejects malformed or elapsed slots and missing edit versions: %o', async (body) => {
        req.body = { ...req.body, ...body };
        const res = response();
        await rescheduleAppointment(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(mocks.Doctor.findOneAndUpdate).not.toHaveBeenCalled();
    });
    it.each([
        { status: 'done' },
        { status: 'cancelled' },
        { isReExamination: true },
        { timeSlot: { ...from, day: '2026-10-22' } },
    ])('preserves non-editable appointments: %o', async (fields) => {
        Object.assign(booking, fields);
        const res = response();
        await rescheduleAppointment(req, res);
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ success: false, code: 'NOT_EDITABLE' });
        expect(mocks.Doctor.findOneAndUpdate).not.toHaveBeenCalled();
    });
    it('rejects stale versions before claiming a slot', async () => {
        booking.scheduleVersion = 2;
        const res = response();
        await rescheduleAppointment(req, res);
        expect(res.json).toHaveBeenCalledWith({ success: false, code: 'STALE_APPOINTMENT' });
        expect(mocks.Doctor.findOneAndUpdate).not.toHaveBeenCalled();
    });
});

describe('transactional rescheduling', () => {
    it('claims the target, records the server-side actor, and returns the old slot in the same transaction', async () => {
        const res = response();
        await rescheduleAppointment(req, res);
        expect(session.withTransaction).toHaveBeenCalledTimes(1);
        expect(mocks.Doctor.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: doctorId, timeSlots: { $elemMatch: to } },
            { $pull: { timeSlots: to } },
            { new: true, session },
        );
        const [filter, update, options] = mocks.Booking.findOneAndUpdate.mock.calls[0];
        expect(filter).toMatchObject({ _id: bookingId, status: 'pending' });
        expect(update.$inc).toEqual({ scheduleVersion: 1 });
        expect(update.$push.scheduleHistory).toMatchObject({
            from,
            to,
            actorId: doctorId,
            actorName: 'Doctor A',
            reason: req.body.reason,
            patientUnread: true,
        });
        expect(options.session).toBe(session);
        expect(mocks.Doctor.updateOne).toHaveBeenCalledWith(
            { _id: doctorId },
            { $addToSet: { timeSlots: from } },
            { session },
        );
        expect(req.io.emit).toHaveBeenCalledWith('appointments-changed');
        expect(req.io.to).toHaveBeenCalledWith(patientId);
        expect(req.io.emit).toHaveBeenCalledWith('reschedule-notification', expect.objectContaining({
            id: `reschedule-${bookingId}-${update.$push.scheduleHistory._id}`,
            appointmentId: bookingId,
            doctor: expect.objectContaining({ fullname: 'Doctor A' }),
            from, timeSlot: to, reason: req.body.reason,
        }));
        expect(req.io.in).toHaveBeenCalledWith([`calendar:doctor:${doctorId}`, `calendar:patient:${patientId}`]);
        expect(session.endSession).toHaveBeenCalled();
    });
    it('checks overlaps against both the doctor and patient, including other doctors', async () => {
        mocks.Booking.findOne.mockReturnValue({ session: vi.fn(async () => ({ _id: 'overlap' })) });
        const res = response();
        await rescheduleAppointment(req, res);
        expect(mocks.Booking.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                $or: [{ doctor: doctorId }, { user: patientId }],
                'timeSlot.startingTime': { $lt: '09:30' },
                'timeSlot.endingTime': { $gt: '09:00' },
            }),
        );
        expect(res.status).toHaveBeenCalledWith(409);
        expect(mocks.Doctor.findOneAndUpdate).not.toHaveBeenCalled();
    });
    it('does not update the booking when another request already claimed the target slot', async () => {
        mocks.Doctor.findOneAndUpdate.mockResolvedValue(null);
        const res = response();
        await rescheduleAppointment(req, res);
        expect(res.json).toHaveBeenCalledWith({ success: false, code: 'SLOT_UNAVAILABLE' });
        expect(mocks.Booking.findOneAndUpdate).not.toHaveBeenCalled();
        expect(req.io.emit).not.toHaveBeenCalled();
    });
    it('propagates a failed booking write out of the transaction and sends no successful invalidation', async () => {
        mocks.Booking.findOneAndUpdate.mockRejectedValue(new Error('write failed'));
        const res = response();
        await rescheduleAppointment(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(req.io.emit).not.toHaveBeenCalled();
        expect(mocks.Doctor.updateOne).not.toHaveBeenCalled();
        expect(session.endSession).toHaveBeenCalled();
    });
    it('fails explicitly on standalone MongoDB without attempting nontransactional writes', async () => {
        session.withTransaction.mockRejectedValue(
            Object.assign(new Error('Transaction numbers are only allowed on a replica set member'), { code: 20 }),
        );
        const res = response();
        await rescheduleAppointment(req, res);
        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({ success: false, code: 'TRANSACTIONS_REQUIRED' });
        expect(mocks.Doctor.findOneAndUpdate).not.toHaveBeenCalled();
    });
});

describe('patient schedule notifications', () => {
    it.each(['doctor', 'admin', undefined])('does not expose patient notifications to %s', async (role) => {
        req.userRole = role;
        const res = response();
        await getScheduleNotifications(req, res);
        await markScheduleNotificationsRead(req, res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(mocks.Booking.find).not.toHaveBeenCalled();
        expect(mocks.Booking.updateMany).not.toHaveBeenCalled();
    });

    it('loads only the signed-in patient history, sorts newest first and counts unread changes', async () => {
        req.userId = patientId;
        req.userRole = 'patient';
        const entries = Array.from({ length: 8 }, (_, index) => ({
            _id: `history-${index}`, from, to, timestamp: new Date(2026, 9, index + 1),
            patientUnread: index > 1, actorName: 'Doctor A',
        }));
        mocks.Booking.find.mockResolvedValue([{ ...booking, scheduleHistory: entries }]);
        const res = response();
        await getScheduleNotifications(req, res);
        expect(mocks.Booking.find).toHaveBeenCalledWith({ user: patientId, 'scheduleHistory.0': { $exists: true } });
        const body = res.json.mock.calls[0][0];
        expect(body.unreadCount).toBe(6);
        expect(body.data).toHaveLength(6);
        expect(body.data[0].id).toBe(`reschedule-${bookingId}-history-7`);
    });

    it('marks only this patient history as read without touching later changes', async () => {
        req.userId = patientId;
        req.userRole = 'patient';
        const res = response();
        await markScheduleNotificationsRead(req, res);
        expect(mocks.Booking.updateMany).toHaveBeenCalledWith(
            { user: patientId, 'scheduleHistory.patientUnread': true },
            { $set: { 'scheduleHistory.$[entry].patientUnread': false } },
            { arrayFilters: [{ 'entry.patientUnread': true, 'entry.timestamp': { $lte: new Date() } }] },
        );
        expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('keeps the committed reschedule successful if the realtime transport fails', async () => {
        req.io.to.mockImplementation(() => { throw new Error('offline'); });
        const res = response();
        await rescheduleAppointment(req, res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('uses the last displayed change as the read cutoff and rejects invalid cutoffs', async () => {
        req.userRole = 'patient';
        req.userId = patientId;
        req.body = { before: '2026-10-22T00:00:00Z' };
        await markScheduleNotificationsRead(req, response());
        expect(mocks.Booking.updateMany.mock.calls[0][2].arrayFilters[0]['entry.timestamp'].$lte)
            .toEqual(new Date(req.body.before));
        mocks.Booking.updateMany.mockClear();
        for (const before of ['invalid', '2099-01-01T00:00:00Z']) {
            req.body = { before };
            const res = response();
            await markScheduleNotificationsRead(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        }
        expect(mocks.Booking.updateMany).not.toHaveBeenCalled();
    });
});

describe('calendar availability', () => {
    it('removes elapsed and overlapping booked slots while retaining genuinely free slots', async () => {
        mocks.Doctor.findById.mockReturnValue({
            select: vi.fn(async () => ({ timeSlots: [from, to, { ...to, day: '2026-10-22' }] })),
        });
        mocks.Booking.find.mockResolvedValue([{ timeSlot: { ...from, startingTime: '08:15', endingTime: '08:45' } }]);
        const res = response();
        await getCalendarAvailability(req, res);
        expect(res.json).toHaveBeenCalledWith({ data: [to] });
    });
});
