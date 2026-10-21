import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
    const save = vi.fn();
    return {
        save,
        Booking: vi.fn(function BookingModel(data) {
            Object.assign(this, data);
            this.save = save;
        }),
        Doctor: { findById: vi.fn(), updateOne: vi.fn() },
        User: { findById: vi.fn() },
        sendMail: vi.fn(),
        to: vi.fn(),
        emit: vi.fn(),
    };
});

vi.mock('../../Models/BookingSchema.js', () => ({ default: mocks.Booking }));
vi.mock('../../Models/DoctorSchema.js', () => ({ default: mocks.Doctor }));
vi.mock('../../Models/UserSchema.js', () => ({ default: mocks.User }));
vi.mock('../../utils/mailTransporter.js', () => ({ default: { sendMail: mocks.sendMail } }));
vi.mock('stripe', () => ({ default: vi.fn(function StripeMock() {}) }));

import { createBooking } from '../../Controllers/bookingController.js';

const now = new Date('2026-10-21T10:00:00+07:00');
const slot = { day: '2026-10-22', startingTime: '08:00', endingTime: '08:30' };
let doctor;
let user;
let savedBooking;

const createResponse = () => {
    const res = {};
    res.status = vi.fn(() => res);
    res.json = vi.fn(() => res);
    return res;
};

const createRequest = (overrides = {}) => ({
    userId: 'patient-id',
    userRole: 'patient',
    body: {
        doctorId: 'doctor-id',
        userId: 'patient-id',
        timeSlot: { ...slot },
        ticketPrice: 25,
        paymentMethod: 'cash',
        ...overrides,
    },
    io: { to: mocks.to },
});

const expectNoBookingEffects = () => {
    expect(mocks.Booking).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.Doctor.updateOne).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
    expect(mocks.to).not.toHaveBeenCalled();
    expect(mocks.emit).not.toHaveBeenCalled();
};

beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    doctor = {
        _id: 'doctor-id', fullname: 'Test Doctor', ticketPrice: 25,
        timeSlots: [{ ...slot }],
    };
    user = { _id: 'patient-id', fullname: 'Test Patient', email: 'patient@example.test', photo: 'patient.jpg' };
    savedBooking = { _id: 'booking-id', createdAt: now };
    mocks.Doctor.findById.mockResolvedValue(doctor);
    mocks.User.findById.mockResolvedValue(user);
    mocks.save.mockResolvedValue(savedBooking);
    mocks.Doctor.updateOne.mockResolvedValue({ acknowledged: true, matchedCount: 1, modifiedCount: 1 });
    mocks.sendMail.mockResolvedValue({});
    mocks.to.mockReturnValue({ emit: mocks.emit });
});

describe('createBooking', () => {
    it('BE-B01: returns 404 without side effects when the doctor does not exist', async () => {
        mocks.Doctor.findById.mockResolvedValue(null);
        const res = createResponse();
        await createBooking(createRequest(), res);
        expect(mocks.Doctor.findById).toHaveBeenCalledWith('doctor-id');
        expect(mocks.User.findById).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Doctor not found' });
        expectNoBookingEffects();
    });

    it('BE-B02: returns 404 without side effects when the patient does not exist', async () => {
        mocks.User.findById.mockResolvedValue(null);
        const res = createResponse();
        await createBooking(createRequest(), res);
        expect(mocks.User.findById).toHaveBeenCalledWith('patient-id');
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User not found' });
        expectNoBookingEffects();
    });

    it.each([
        ['day', '2026-10-23'],
        ['startingTime', '09:00'],
        ['endingTime', '09:30'],
    ])('BE-B03: rejects a slot whose %s does not match availability', async (field, value) => {
        const res = createResponse();
        await createBooking(createRequest({ timeSlot: { ...slot, [field]: value } }), res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Selected time slot is no longer available' });
        expectNoBookingEffects();
    });

    it('BE-B03: rejects a request when the doctor has no available slots', async () => {
        doctor.timeSlots = [];
        const res = createResponse();
        await createBooking(createRequest(), res);
        expect(res.status).toHaveBeenCalledWith(400);
        expectNoBookingEffects();
    });

    it('BE-B04: creates an unpaid cash booking and removes exactly its selected slot', async () => {
        const res = createResponse();
        await createBooking(createRequest({ isPaid: true, unread: false }), res);
        expect(mocks.Booking).toHaveBeenCalledExactlyOnceWith({
            doctor: 'doctor-id', user: 'patient-id', timeSlot: slot,
            ticketPrice: 25, paymentMethod: 'cash', isPaid: false, unread: true,
        });
        expect(mocks.save).toHaveBeenCalledTimes(1);
        expect(mocks.Doctor.updateOne).toHaveBeenCalledTimes(2);
        expect(mocks.Doctor.updateOne).toHaveBeenNthCalledWith(1, { _id: 'doctor-id' }, { $pull: { timeSlots: slot } });
        expect(mocks.Doctor.updateOne).toHaveBeenNthCalledWith(2, { _id: 'doctor-id' }, { $inc: { totalPatients: 1 } });
        expect(mocks.save.mock.invocationCallOrder[0]).toBeLessThan(mocks.Doctor.updateOne.mock.invocationCallOrder[0]);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Booking created successfully', booking: savedBooking });
    });

    it('BE-B05: emails the patient and notifies only the selected doctor with the saved booking details', async () => {
        const res = createResponse();
        await createBooking(createRequest(), res);
        expect(mocks.sendMail).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
            to: user.email, subject: 'HealthMate - Booking Confirmation',
            html: expect.stringContaining('Test Patient'),
        }));
        const html = mocks.sendMail.mock.calls[0][0].html;
        expect(html).toContain('Test Doctor');
        expect(html).toContain('$25');
        expect(html).toContain('CASH');
        expect(html).toContain('Unpaid');
        expect(mocks.to).toHaveBeenCalledExactlyOnceWith('doctor-id');
        expect(mocks.emit).toHaveBeenCalledExactlyOnceWith('booking-notification', {
            bookingId: 'booking-id',
            user: { id: user._id, fullname: user.fullname, photo: user.photo },
            timeSlot: slot, ticketPrice: 25, paymentMethod: 'cash',
            isPaid: false, unread: true, status: 'pending', createdAt: now,
        });
        expect(mocks.Doctor.updateOne.mock.invocationCallOrder[1]).toBeLessThan(mocks.sendMail.mock.invocationCallOrder[0]);
        expect(mocks.sendMail.mock.invocationCallOrder[0]).toBeLessThan(mocks.emit.mock.invocationCallOrder[0]);
    });

    it('BE-B06: does not remove slots, increment counts or notify anyone when saving fails', async () => {
        mocks.save.mockRejectedValue(new Error('save unavailable'));
        const res = createResponse();
        await createBooking(createRequest(), res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Error creating booking', error: 'save unavailable' });
        expect(mocks.Doctor.updateOne).not.toHaveBeenCalled();
        expect(mocks.sendMail).not.toHaveBeenCalled();
        expect(mocks.emit).not.toHaveBeenCalled();
    });

    it.each(['doctor', 'patient'])('BE-B06: returns 500 without writes if the %s lookup fails', async (account) => {
        const dependency = account === 'doctor' ? mocks.Doctor.findById : mocks.User.findById;
        dependency.mockRejectedValue(new Error('lookup unavailable'));
        const res = createResponse();
        await createBooking(createRequest(), res);
        expect(res.status).toHaveBeenCalledWith(500);
        expectNoBookingEffects();
    });

    it('BE-B07: still confirms the saved booking and emits a notification if email delivery fails', async () => {
        mocks.sendMail.mockRejectedValue(new Error('email unavailable'));
        const res = createResponse();
        await createBooking(createRequest(), res);
        expect(mocks.save).toHaveBeenCalledTimes(1);
        expect(mocks.Doctor.updateOne).toHaveBeenCalledTimes(2);
        expect(mocks.emit).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(console.error).toHaveBeenCalledWith('Error sending email:', expect.any(Error));
    });

    // These expectations describe the guide's desired safeguards, not the current implementation.
    // Each is confirmed as an ordinary failing test before being marked as an expected failure.
    it.fails.each([
        ['missing body', undefined],
        ['null body', null],
        ['missing timeSlot', { doctorId: 'doctor-id', userId: 'patient-id', ticketPrice: 25, paymentMethod: 'cash' }],
    ])('BE-B08 [KNOWN BUG]: rejects %s with a client error and no writes', async (_label, body) => {
        const req = createRequest();
        req.body = body;
        const res = createResponse();
        await createBooking(req, res);
        expect(res.status.mock.calls[0][0]).toBeGreaterThanOrEqual(400);
        expect(res.status.mock.calls[0][0]).toBeLessThan(500);
        expectNoBookingEffects();
    });

    it.fails('BE-B09 [KNOWN BUG]: rejects a manipulated price or uses the server-side doctor price', async () => {
        const res = createResponse();
        await createBooking(createRequest({ ticketPrice: 1 }), res);
        const status = res.status.mock.calls[0][0];
        if (status >= 400 && status < 500) {
            expectNoBookingEffects();
        } else {
            expect(status).toBe(201);
            expect(mocks.Booking).toHaveBeenCalledWith(expect.objectContaining({ ticketPrice: doctor.ticketPrice }));
        }
    });

    it.fails('BE-B10 [KNOWN BUG]: rejects booking for a different patient than the authenticated caller', async () => {
        user._id = 'other-patient-id';
        const req = createRequest({ userId: 'other-patient-id' });
        const res = createResponse();
        await createBooking(req, res);
        expect(res.status.mock.calls[0][0]).toBeGreaterThanOrEqual(400);
        expect(res.status.mock.calls[0][0]).toBeLessThan(500);
        expectNoBookingEffects();
    });

    it.fails('BE-B11 [KNOWN BUG]: rejects a past slot even if it remains in the availability list', async () => {
        const pastSlot = { ...slot, day: '2026-10-20' };
        doctor.timeSlots = [pastSlot];
        const res = createResponse();
        await createBooking(createRequest({ timeSlot: pastSlot }), res);
        expect(res.status.mock.calls[0][0]).toBeGreaterThanOrEqual(400);
        expect(res.status.mock.calls[0][0]).toBeLessThan(500);
        expectNoBookingEffects();
    });

    it.todo('BE-B12: only one concurrent request can reserve a given slot (MongoDB integration)');

    it.each([1, 2])('BE-B13 [LIMITATION]: returns 500 after the booking was saved when doctor update %i fails', async (update) => {
        if (update === 2) mocks.Doctor.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });
        mocks.Doctor.updateOne.mockRejectedValueOnce(new Error('doctor update unavailable'));
        const res = createResponse();
        await createBooking(createRequest(), res);
        expect(mocks.save).toHaveBeenCalledTimes(1);
        expect(mocks.Doctor.updateOne).toHaveBeenCalledTimes(update);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(mocks.sendMail).not.toHaveBeenCalled();
        expect(mocks.emit).not.toHaveBeenCalled();
        // A failed response does not prove the saved booking was rolled back.
    });

    it.todo('BE-B13: atomically rolls back booking, slot removal and patient count on failure (MongoDB integration)');

    it('BE-B14 [LIMITATION]: returns 500 after database writes and email if WebSocket emission fails', async () => {
        mocks.emit.mockImplementation(() => { throw new Error('socket unavailable'); });
        const res = createResponse();
        await createBooking(createRequest(), res);
        expect(mocks.save).toHaveBeenCalledTimes(1);
        expect(mocks.Doctor.updateOne).toHaveBeenCalledTimes(2);
        expect(mocks.sendMail).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});
