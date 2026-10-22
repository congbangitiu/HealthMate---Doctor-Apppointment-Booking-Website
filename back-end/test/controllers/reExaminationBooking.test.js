import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
    const childSave = vi.fn();
    const Booking = vi.fn(function BookingModel(data) {
        Object.assign(this, data);
        this.save = childSave;
    });
    Booking.findById = vi.fn();
    Booking.findOne = vi.fn();
    return {
        Booking, childSave,
        Doctor: { findById: vi.fn(), updateOne: vi.fn() },
        User: { findById: vi.fn() }, sendMail: vi.fn(), to: vi.fn(), emit: vi.fn(),
    };
});
vi.mock('../../Models/BookingSchema.js', () => ({ default: mocks.Booking }));
vi.mock('../../Models/DoctorSchema.js', () => ({ default: mocks.Doctor }));
vi.mock('../../Models/UserSchema.js', () => ({ default: mocks.User }));
vi.mock('../../utils/mailTransporter.js', () => ({ default: { sendMail: mocks.sendMail } }));
vi.mock('stripe', () => ({ default: vi.fn(function StripeMock() {}) }));

import { createReExaminationBooking, updateNextAppointmentTimeSlot } from '../../Controllers/bookingController.js';

const now = new Date('2026-10-21T10:00:00+07:00');
const slot = { day: '2026-10-22', startingTime: '08:00', endingTime: '08:30' };
const pdf = { url: 'https://example.test/record.pdf', publicId: 'record-pdf' };
let parent;
let child;
let doctor;
let user;
let savedChild;

const response = () => {
    const res = {};
    res.status = vi.fn(() => res);
    res.json = vi.fn(() => res);
    return res;
};
const createRequest = (overrides = {}) => ({
    userId: 'doctor-id', userRole: 'doctor', io: { to: mocks.to },
    body: { doctorId: 'doctor-id', userId: 'patient-id', currentBookingId: 'parent-id', timeSlot: { ...slot }, ...overrides },
});
const updateRequest = (nextAppointmentTimeSlot = slot) => ({
    params: { id: 'parent-id' }, body: { nextAppointmentTimeSlot }, userId: 'doctor-id', userRole: 'doctor',
});
const expectNoCreation = () => {
    expect(mocks.Booking).not.toHaveBeenCalled();
    expect(mocks.childSave).not.toHaveBeenCalled();
    expect(mocks.Doctor.updateOne).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
    expect(mocks.emit).not.toHaveBeenCalled();
};

beforeEach(() => {
    vi.clearAllMocks();
    for (const mock of [mocks.Booking.findById, mocks.Booking.findOne, mocks.childSave,
        mocks.Doctor.findById, mocks.Doctor.updateOne, mocks.User.findById, mocks.sendMail, mocks.to, mocks.emit]) mock.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    parent = {
        _id: 'parent-id', doctor: 'doctor-id', user: 'patient-id',
        nextAppointment: { timeSlot: { ...slot, day: '2026-10-23' }, pdfInfo: { ...pdf } },
        save: vi.fn().mockImplementation(async () => parent),
    };
    child = { _id: 'child-id', timeSlot: { ...slot, day: '2026-10-23' }, save: vi.fn().mockResolvedValue(undefined) };
    doctor = { _id: 'doctor-id', fullname: 'Test Doctor', photo: 'doctor.jpg' };
    user = { _id: 'patient-id', fullname: 'Test Patient', email: 'patient@example.test' };
    savedChild = { _id: 'child-id', createdAt: now };
    mocks.Booking.findById.mockImplementation(async () => parent);
    mocks.Booking.findOne.mockImplementation(async () => child);
    mocks.childSave.mockResolvedValue(savedChild);
    mocks.Doctor.findById.mockImplementation(async () => doctor);
    mocks.User.findById.mockImplementation(async () => user);
    mocks.Doctor.updateOne.mockResolvedValue({ modifiedCount: 1 });
    mocks.sendMail.mockResolvedValue({});
    mocks.to.mockReturnValue({ emit: mocks.emit });
});

describe('createReExaminationBooking', () => {
    it.each([
        ['doctor', 'Doctor not found'], ['patient', 'User not found'], ['parent', 'Current booking not found'],
    ])('BE-N01: returns 404 without saving when the %s does not exist', async (kind, message) => {
        const originalParent = parent;
        if (kind === 'doctor') doctor = null;
        if (kind === 'patient') user = null;
        if (kind === 'parent') parent = null;
        const res = response();
        await createReExaminationBooking(createRequest(), res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ success: false, message });
        expect(originalParent.save).not.toHaveBeenCalled();
        expectNoCreation();
    });

    it('BE-N02: links the parent to a free paid follow-up booking', async () => {
        const res = response();
        await createReExaminationBooking(createRequest({ ticketPrice: '999', isPaid: false }), res);
        expect(mocks.Doctor.findById).toHaveBeenCalledWith('doctor-id');
        expect(mocks.User.findById).toHaveBeenCalledWith('patient-id');
        expect(mocks.Booking.findById).toHaveBeenCalledWith('parent-id');
        expect(parent.nextAppointment).toEqual({ timeSlot: slot });
        expect(parent.save).toHaveBeenCalledTimes(1);
        expect(mocks.Booking).toHaveBeenCalledExactlyOnceWith({
            doctor: 'doctor-id', user: 'patient-id', ticketPrice: '0', paymentMethod: 'free', isPaid: true,
            timeSlot: slot, unread: true, isReExamination: true, parentBooking: 'parent-id',
        });
        expect(parent.save.mock.invocationCallOrder[0]).toBeLessThan(mocks.childSave.mock.invocationCallOrder[0]);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Re-examination booking created successfully', booking: savedChild });
    });

    it('BE-N03: increments the count, emails the patient and emits to the patient room', async () => {
        await createReExaminationBooking(createRequest(), response());
        expect(mocks.Doctor.updateOne).toHaveBeenCalledExactlyOnceWith({ _id: 'doctor-id' }, { $inc: { totalPatients: 1 } });
        expect(mocks.sendMail).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
            to: user.email, subject: 'HealthMate - Re-Examination Appointment Confirmation',
            html: expect.stringContaining('Free (Re-examination)'),
        }));
        expect(mocks.to).toHaveBeenCalledExactlyOnceWith('patient-id');
        expect(mocks.emit).toHaveBeenCalledExactlyOnceWith('re-examination-notification', {
            bookingId: 'child-id', doctor: { id: doctor._id, fullname: doctor.fullname, photo: doctor.photo },
            timeSlot: slot, createdAt: now, type: 're-examination', status: 'scheduled', isReExamination: true,
        });
    });

    it.each(['doctor', 'patient'])('BE-N04: rejects a parent belonging to a different %s', async (field) => {
        parent[field === 'patient' ? 'user' : 'doctor'] = 'unrelated-id';
        const res = response();
        await createReExaminationBooking(createRequest(), res);
        expect(res.status.mock.calls[0][0]).toBeGreaterThanOrEqual(400);
        expect(res.status.mock.calls[0][0]).toBeLessThan(500);
        expect(parent.save).not.toHaveBeenCalled();
        expectNoCreation();
    });

    it('BE-N04: rejects a forged body doctorId even when the parent belongs to that doctor', async () => {
        const req = createRequest();
        req.userId = 'another-doctor-id';
        const res = response();
        await createReExaminationBooking(req, res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(parent.save).not.toHaveBeenCalled();
        expectNoCreation();
    });

    it('BE-N04: rejects unauthenticated creation before querying the parent', async () => {
        const req = createRequest();
        delete req.userId;
        const res = response();
        await createReExaminationBooking(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(mocks.Booking.findById).not.toHaveBeenCalled();
        expectNoCreation();
    });

    it.each(['doctor lookup', 'patient lookup', 'parent lookup', 'parent save'])(
        'BE-N10: creates no child when %s fails', async (stage) => {
            const dependency = {
                'doctor lookup': mocks.Doctor.findById, 'patient lookup': mocks.User.findById,
                'parent lookup': mocks.Booking.findById, 'parent save': parent.save,
            }[stage];
            dependency.mockRejectedValue(new Error('database unavailable'));
            const res = response();
            await createReExaminationBooking(createRequest(), res);
            expect(res.status).toHaveBeenCalledWith(500);
            expectNoCreation();
        },
    );

    it.each(['child save', 'count update', 'socket'])(
        'BE-N10 [LIMITATION]: reports 500 after the parent was saved when %s fails', async (stage) => {
            const error = new Error('dependency unavailable');
            if (stage === 'child save') mocks.childSave.mockRejectedValue(error);
            if (stage === 'count update') mocks.Doctor.updateOne.mockRejectedValue(error);
            if (stage === 'socket') mocks.emit.mockImplementation(() => { throw error; });
            const res = response();
            await createReExaminationBooking(createRequest(), res);
            expect(parent.save).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(500);
            if (stage !== 'socket') expect(mocks.sendMail).not.toHaveBeenCalled();
        },
    );

    it('BE-N03: still confirms the saved follow-up if email delivery fails', async () => {
        mocks.sendMail.mockRejectedValue(new Error('mail unavailable'));
        const res = response();
        await createReExaminationBooking(createRequest(), res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(mocks.emit).toHaveBeenCalledTimes(1);
    });
});

describe('updateNextAppointmentTimeSlot', () => {
    it('BE-N05: returns 404 without saving when the parent does not exist', async () => {
        parent = null;
        const res = response();
        await updateNextAppointmentTimeSlot(updateRequest(), res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(child.save).not.toHaveBeenCalled();
        expect(mocks.Booking.findOne).not.toHaveBeenCalled();
    });

    it.each([
        ['missing day', { ...slot, day: '' }, 'Invalid time slot: day, startingTime, and endingTime are required'],
        ['missing start', { ...slot, startingTime: '' }, 'Invalid time slot: day, startingTime, and endingTime are required'],
        ['missing end', { ...slot, endingTime: '' }, 'Invalid time slot: day, startingTime, and endingTime are required'],
        ['equal times', { ...slot, endingTime: '08:00' }, 'Starting time must be earlier than ending time'],
        ['reversed times', { ...slot, endingTime: '07:30' }, 'Starting time must be earlier than ending time'],
        ['past date', { ...slot, day: '2026-10-20' }, 'Date must be in the future'],
    ])('BE-N06 [CURRENT BEHAVIOR]: rejects %s with 500 and no saves', async (_label, invalidSlot, message) => {
        const previous = parent.nextAppointment;
        const res = response();
        await updateNextAppointmentTimeSlot(updateRequest(invalidSlot), res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Error updating booking', error: message });
        expect(parent.nextAppointment).toBe(previous);
        expect(parent.save).not.toHaveBeenCalled();
        expect(child.save).not.toHaveBeenCalled();
    });

    it('BE-N06 [KNOWN BUG]: classifies an invalid time range as a client error', async () => {
        const res = response();
        await updateNextAppointmentTimeSlot(updateRequest({ ...slot, endingTime: slot.startingTime }), res);
        expect(res.status.mock.calls[0][0]).toBeGreaterThanOrEqual(400);
        expect(res.status.mock.calls[0][0]).toBeLessThan(500);
    });

    it('BE-N07: updates both slots while preserving the parent PDF metadata', async () => {
        const res = response();
        await updateNextAppointmentTimeSlot(updateRequest(), res);
        expect(mocks.Booking.findOne).toHaveBeenCalledExactlyOnceWith({ parentBooking: 'parent-id', isReExamination: true });
        expect(parent.nextAppointment).toEqual({ timeSlot: slot, pdfInfo: pdf });
        expect(child.timeSlot).toEqual(slot);
        expect(child.save).toHaveBeenCalledTimes(1);
        expect(parent.save).toHaveBeenCalledTimes(1);
        expect(child.save.mock.invocationCallOrder[0]).toBeLessThan(parent.save.mock.invocationCallOrder[0]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Booking updated successfully', data: parent });
    });

    it('BE-N08: saves the parent without crashing when no follow-up booking exists', async () => {
        child = null;
        parent.nextAppointment.pdfInfo = undefined;
        const res = response();
        await updateNextAppointmentTimeSlot(updateRequest(), res);
        expect(parent.nextAppointment).toEqual({ timeSlot: slot, pdfInfo: null });
        expect(parent.save).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('BE-N09 [CURRENT BEHAVIOR]: saves unchanged when the parent has no nextAppointment', async () => {
        delete parent.nextAppointment;
        const res = response();
        await updateNextAppointmentTimeSlot(updateRequest(), res);
        expect(parent).not.toHaveProperty('nextAppointment');
        expect(mocks.Booking.findOne).not.toHaveBeenCalled();
        expect(child.save).not.toHaveBeenCalled();
        expect(parent.save).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it.todo('BE-N09: define whether a missing nextAppointment should be created or rejected');

    it.each(['parent lookup', 'child lookup', 'child save', 'parent save'])(
        'BE-N10 [LIMITATION]: reports a %s failure without proving rollback', async (stage) => {
            const dependency = {
                'parent lookup': mocks.Booking.findById, 'child lookup': mocks.Booking.findOne,
                'child save': child.save, 'parent save': parent.save,
            }[stage];
            dependency.mockRejectedValue(new Error('database unavailable'));
            const res = response();
            await updateNextAppointmentTimeSlot(updateRequest(), res);
            expect(res.status).toHaveBeenCalledWith(500);
            if (stage === 'parent save') expect(child.save).toHaveBeenCalledTimes(1);
            else expect(parent.save).not.toHaveBeenCalled();
        },
    );

    it.todo('BE-N10: keeps parent and child changes atomic when a database write fails (MongoDB integration)');
});
