import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    Booking: { findById: vi.fn() },
    Doctor: { findById: vi.fn() },
    populate: vi.fn(),
    to: vi.fn(),
    emit: vi.fn(),
}));

vi.mock('../../Models/BookingSchema.js', () => ({ default: mocks.Booking }));
vi.mock('../../Models/DoctorSchema.js', () => ({ default: mocks.Doctor }));
vi.mock('../../Models/UserSchema.js', () => ({ default: {} }));
vi.mock('../../utils/mailTransporter.js', () => ({ default: { sendMail: vi.fn() } }));
vi.mock('stripe', () => ({ default: vi.fn(function StripeMock() {}) }));

import { updateAppointmentStatus } from '../../Controllers/bookingController.js';

const now = new Date('2026-10-21T10:00:00+07:00');
const slot = { day: '2026-10-22', startingTime: '08:00', endingTime: '08:30' };
let appointment;
let doctor;

const response = () => {
    const res = {};
    res.status = vi.fn(() => res);
    res.json = vi.fn(() => res);
    return res;
};
const request = (status = 'cancelled') => ({
    params: { id: 'booking-id' }, body: { status },
    userId: 'patient-id', userRole: 'patient', io: { to: mocks.to },
});

beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    doctor = { _id: 'doctor-id', timeSlots: [], save: vi.fn().mockResolvedValue(undefined) };
    appointment = {
        _id: 'booking-id', doctor: { _id: 'doctor-id' },
        user: { _id: 'patient-id', fullname: 'Test Patient', photo: 'patient.jpg' },
        timeSlot: { ...slot }, status: 'pending', statusHistory: [],
        save: vi.fn().mockResolvedValue(undefined),
    };
    mocks.Booking.findById.mockReturnValue({ populate: mocks.populate });
    mocks.populate.mockImplementation((path) => path === 'doctor' ? { populate: mocks.populate } : Promise.resolve(appointment));
    mocks.Doctor.findById.mockImplementation(async () => doctor);
    mocks.to.mockReturnValue({ emit: mocks.emit });
});

describe('updateAppointmentStatus', () => {
    it('BE-C01: returns 404 without doctor changes when the booking does not exist', async () => {
        appointment = null;
        const res = response();
        await updateAppointmentStatus(request(), res);
        expect(mocks.Booking.findById).toHaveBeenCalledWith('booking-id');
        expect(mocks.populate.mock.calls).toEqual([['doctor'], ['user']]);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Appointment not found' });
        expect(mocks.Doctor.findById).not.toHaveBeenCalled();
        expect(doctor.save).not.toHaveBeenCalled();
        expect(mocks.emit).not.toHaveBeenCalled();
    });

    it.each(['done', 'pending'])('BE-C02: records status %s and its timestamp without restoring a slot', async (status) => {
        appointment.statusHistory.push({ status: 'pending', timestamp: new Date(now.getTime() - 1000) });
        const res = response();
        await updateAppointmentStatus(request(status), res);
        expect(appointment.status).toBe(status);
        expect(appointment.statusHistory).toHaveLength(2);
        expect(appointment.statusHistory[1]).toEqual({ status, timestamp: now });
        expect(appointment.save).toHaveBeenCalledTimes(1);
        expect(mocks.Doctor.findById).not.toHaveBeenCalled();
        expect(doctor.timeSlots).toEqual([]);
        expect(mocks.emit).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Appointment status updated successfully', data: appointment });
    });

    it('BE-C03: restores the selected slot and notifies the doctor when cancelling', async () => {
        const otherSlot = { ...slot, startingTime: '09:00', endingTime: '09:30' };
        doctor.timeSlots = [otherSlot];
        const res = response();
        await updateAppointmentStatus(request(), res);
        expect(mocks.Doctor.findById).toHaveBeenCalledExactlyOnceWith('doctor-id');
        expect(doctor.timeSlots).toEqual([otherSlot, slot]);
        expect(doctor.save).toHaveBeenCalledTimes(1);
        expect(appointment.save).toHaveBeenCalledTimes(1);
        expect(appointment.status).toBe('cancelled');
        expect(appointment.statusHistory).toEqual([{ status: 'cancelled', timestamp: now }]);
        expect(mocks.to).toHaveBeenCalledExactlyOnceWith('doctor-id');
        expect(mocks.emit).toHaveBeenCalledExactlyOnceWith('cancelled-notification', {
            appointmentId: 'booking-id', user: { id: 'patient-id', fullname: 'Test Patient', photo: 'patient.jpg' },
            timeSlot: slot, status: 'cancelled', createdAt: now.toISOString(),
        });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('BE-C04: returns 404 without saving or emitting when the doctor no longer exists', async () => {
        doctor = null;
        const res = response();
        await updateAppointmentStatus(request(), res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Doctor not found' });
        expect(appointment.save).not.toHaveBeenCalled();
        expect(mocks.emit).not.toHaveBeenCalled();
    });

    it.each(['booking lookup', 'doctor lookup', 'doctor save', 'appointment save'])(
        'BE-C05: returns 500 when %s fails', async (stage) => {
            const error = new Error('database unavailable');
            if (stage === 'booking lookup') mocks.populate.mockImplementation(() => { throw error; });
            if (stage === 'doctor lookup') mocks.Doctor.findById.mockRejectedValue(error);
            if (stage === 'doctor save') doctor.save.mockRejectedValue(error);
            if (stage === 'appointment save') appointment.save.mockRejectedValue(error);
            const res = response();
            await updateAppointmentStatus(request(), res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Server error', error: 'database unavailable' });
            if (stage !== 'appointment save') {
                expect(mocks.emit).not.toHaveBeenCalled();
                expect(appointment.save).not.toHaveBeenCalled();
            } else {
                // The slot was already saved and the notification emitted; this is not rollback.
                expect(doctor.save).toHaveBeenCalledTimes(1);
                expect(mocks.emit).toHaveBeenCalledTimes(1);
            }
        },
    );

    it('BE-C06 [KNOWN BUG]: does not restore a duplicate slot when cancellation is repeated', async () => {
        await updateAppointmentStatus(request(), response());
        await updateAppointmentStatus(request(), response());
        expect(doctor.timeSlots.filter((item) => item.day === slot.day && item.startingTime === slot.startingTime && item.endingTime === slot.endingTime)).toHaveLength(1);
    });

    it('BE-C07 [KNOWN BUG]: returns a client error for an invalid status rejected by the real schema', async () => {
        const { default: Booking } = await vi.importActual('../../Models/BookingSchema.js');
        const invalid = new Booking({
            doctor: '507f1f77bcf86cd799439011', user: '507f1f77bcf86cd799439012',
            ticketPrice: '25', status: 'unknown', timeSlot: slot,
        });
        const validationError = invalid.validateSync();
        expect(validationError.errors.status).toBeDefined();
        appointment.save.mockRejectedValue(validationError);
        const res = response();
        await updateAppointmentStatus(request('unknown'), res);
        expect(res.status.mock.calls[0][0]).toBeGreaterThanOrEqual(400);
        expect(res.status.mock.calls[0][0]).toBeLessThan(500);
        expect(doctor.save).not.toHaveBeenCalled();
    });

    it.todo('BE-C07: enforce agreed transitions such as done to pending after the transition policy is confirmed');

    it('BE-C08: prevents an unrelated patient from changing another patient booking', async () => {
        const req = request('done');
        req.userId = 'unrelated-patient-id';
        const res = response();
        await updateAppointmentStatus(req, res);
        expect(res.status.mock.calls[0][0]).toBeGreaterThanOrEqual(400);
        expect(res.status.mock.calls[0][0]).toBeLessThan(500);
        expect(appointment.save).not.toHaveBeenCalled();
    });

    it.todo('BE-C08: enforce ownership through the actual authenticated Express route (HTTP integration)');

    it.each(['doctor', 'admin'])('BE-C08: preserves status updates by the authorized %s', async (role) => {
        const req = request('done');
        req.userRole = role;
        req.userId = role === 'doctor' ? 'doctor-id' : 'admin-id';
        const res = response();
        await updateAppointmentStatus(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(appointment.save).toHaveBeenCalledTimes(1);
    });

    it('BE-C08: denies an unrelated doctor without changing status or history', async () => {
        const req = request('done');
        req.userRole = 'doctor';
        req.userId = 'unrelated-doctor-id';
        const res = response();
        await updateAppointmentStatus(req, res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(appointment.status).toBe('pending');
        expect(appointment.statusHistory).toEqual([]);
        expect(appointment.save).not.toHaveBeenCalled();
        expect(mocks.emit).not.toHaveBeenCalled();
    });

    it('BE-C08: requires authentication before looking up the booking', async () => {
        const req = request();
        delete req.userId;
        const res = response();
        await updateAppointmentStatus(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(mocks.Booking.findById).not.toHaveBeenCalled();
    });

    it('BE-C08: checks the matching actor role rather than accepting an id from the other reference', async () => {
        const req = request('done');
        req.userId = 'doctor-id';
        req.userRole = 'patient';
        const res = response();
        await updateAppointmentStatus(req, res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(appointment.save).not.toHaveBeenCalled();
        expect(appointment.status).toBe('pending');
    });

    it('BE-C09 [LIMITATION]: returns 500 after restoring the slot if socket emission fails', async () => {
        mocks.emit.mockImplementation(() => { throw new Error('socket unavailable'); });
        const res = response();
        await updateAppointmentStatus(request(), res);
        expect(doctor.save).toHaveBeenCalledTimes(1);
        expect(appointment.save).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
    });
});
