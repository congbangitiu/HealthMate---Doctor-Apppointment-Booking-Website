import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
    const makeModel = () => {
        const save = vi.fn();
        const Model = vi.fn(function RecordModel(data) {
            Object.assign(this, data);
            this.createdAt = new Date();
            this.save = save;
        });
        Model.findOne = vi.fn();
        Model.findOneAndUpdate = vi.fn();
        return { Model, save };
    };
    return {
        prescription: makeModel(), examination: makeModel(),
        Booking: { findById: vi.fn() }, populate: vi.fn(), to: vi.fn(), emit: vi.fn(),
    };
});
vi.mock('../../Models/PrescriptionSchema.js', () => ({ default: mocks.prescription.Model }));
vi.mock('../../Models/ExaminationSchema.js', () => ({ default: mocks.examination.Model }));
vi.mock('../../Models/BookingSchema.js', () => ({ default: mocks.Booking }));

import { createPrescription, getPrescriptionByAppointmentId, updatePrescriptionByAppointmentId } from '../../Controllers/prescriptionController.js';
import { createExamination, getExaminationByAppointmentId, updateExaminationByAppointmentId } from '../../Controllers/examinationController.js';

// Load real schemas during collection, outside fake clocks and individual test timeouts.
const [actualPrescription, actualExamination] = await Promise.all([
    vi.importActual('../../Models/PrescriptionSchema.js'),
    vi.importActual('../../Models/ExaminationSchema.js'),
]);
const actualSchemas = { prescription: actualPrescription.default, examination: actualExamination.default };

const now = new Date('2026-10-21T10:00:00+07:00');
const appointmentId = '507f1f77bcf86cd799439011';
const otherId = '507f1f77bcf86cd799439012';
const slot = { day: '2026-10-22', startingTime: '08:00', endingTime: '08:30' };
let booking;
const response = () => {
    const res = {};
    res.status = vi.fn(() => res);
    res.json = vi.fn(() => res);
    return res;
};
const cases = [
    {
        name: 'Prescription', key: 'prescription', create: createPrescription,
        get: getPrescriptionByAppointmentId, update: updatePrescriptionByAppointmentId,
        body: { appointment: appointmentId, diseaseName: 'Test diagnosis', medications: [], doctorAdvice: 'Test advice' },
        missingField: 'diseaseName',
    },
    {
        name: 'Examination', key: 'examination', create: createExamination,
        get: getExaminationByAppointmentId, update: updateExaminationByAppointmentId,
        body: { appointment: appointmentId, chiefComplaint: 'Test complaint', clinicalIndications: 'Test indications', conclusion: 'Test conclusion', ultrasoundRequest: ['Liver'] },
        missingField: 'chiefComplaint',
    },
];
const request = (body) => ({
    params: { appointmentId }, body: { ...body }, userId: 'doctor-id', userRole: 'doctor', io: { to: mocks.to },
});

beforeEach(() => {
    vi.clearAllMocks();
    for (const { Model, save } of [mocks.prescription, mocks.examination]) {
        Model.findOne.mockReset().mockResolvedValue(null);
        Model.findOneAndUpdate.mockReset().mockResolvedValue(null);
        save.mockReset().mockResolvedValue(undefined);
    }
    mocks.Booking.findById.mockReset();
    mocks.populate.mockReset();
    mocks.to.mockReset().mockReturnValue({ emit: mocks.emit });
    mocks.emit.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    booking = {
        _id: appointmentId, doctor: { _id: 'doctor-id', fullname: 'Test Doctor', photo: 'doctor.jpg' },
        user: { _id: 'patient-id' }, timeSlot: { ...slot },
    };
    // Supports both await findById (examination create) and findById().populate (other paths).
    mocks.Booking.findById.mockImplementation(() => {
        const query = Promise.resolve(booking);
        query.populate = mocks.populate;
        return query;
    });
    mocks.populate.mockImplementation(async () => booking);
});

for (const config of cases) {
    describe(`${config.name} records`, () => {
        const { Model, save } = mocks[config.key];

        it(`${config.key === 'prescription' ? 'BE-M01' : 'BE-M04'}: creates a record for the requested appointment`, async () => {
            const res = response();
            await config.create(request(config.body), res);
            expect(mocks.Booking.findById).toHaveBeenCalledWith(appointmentId);
            expect(Model).toHaveBeenCalledExactlyOnceWith(config.key === 'prescription'
                ? { ...config.body, actionHistory: [{ action: 'create', timestamp: now }] }
                : config.body);
            expect(save).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: expect.objectContaining(config.body) }));
            if (config.key === 'prescription') {
                expect(mocks.to).toHaveBeenCalledExactlyOnceWith('patient-id');
                expect(mocks.emit).toHaveBeenCalledExactlyOnceWith('prescription-notification', {
                    appointmentId, doctor: { id: 'doctor-id', fullname: 'Test Doctor', photo: 'doctor.jpg' },
                    timeSlot: slot, actionHistory: [{ action: 'create', timestamp: now }], createdAt: now,
                });
            } else {
                expect(mocks.emit).not.toHaveBeenCalled();
                expect(mocks.Booking.findById.mock.invocationCallOrder[0]).toBeLessThan(save.mock.invocationCallOrder[0]);
            }
        });

        it(`${config.key === 'prescription' ? 'BE-M02' : 'BE-M03'}: does not save a record when the appointment does not exist`, async () => {
            booking = null;
            const res = response();
            await config.create(request(config.body), res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(save).not.toHaveBeenCalled();
            expect(mocks.emit).not.toHaveBeenCalled();
        });

        it('BE-M05: returns 400 without emitting when saving fails real schema validation', async () => {
            const ActualModel = actualSchemas[config.key];
            const data = { ...config.body };
            delete data[config.missingField];
            const validationError = new ActualModel(data).validateSync();
            expect(validationError.errors[config.missingField]).toBeDefined();
            save.mockRejectedValue(validationError);
            const res = response();
            await config.create(request(data), res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
            expect(mocks.emit).not.toHaveBeenCalled();
        });

        it.each(['found', 'absent', 'query error'])('BE-M06: handles a lookup that is %s', async (outcome) => {
            const record = { _id: 'record-id', ...config.body };
            if (outcome === 'found') Model.findOne.mockResolvedValue(record);
            if (outcome === 'query error') Model.findOne.mockRejectedValue(new Error('database unavailable'));
            const res = response();
            await config.get(request(config.body), res);
            expect(Model.findOne).toHaveBeenCalledExactlyOnceWith({ appointment: appointmentId });
            expect(res.status).toHaveBeenCalledWith({ found: 200, absent: 404, 'query error': 500 }[outcome]);
            if (outcome === 'found') expect(res.json).toHaveBeenCalledWith({ success: true, data: record });
            expect(save).not.toHaveBeenCalled();
            expect(mocks.emit).not.toHaveBeenCalled();
        });

        it('BE-M07: updates the matching appointment with validators and a history push', async () => {
            const updated = { _id: 'record-id', ...config.body, actionHistory: [{ action: 'update', timestamp: now }], updatedAt: now };
            Model.findOneAndUpdate.mockResolvedValue(updated);
            const res = response();
            await config.update(request(config.body), res);
            expect(Model.findOneAndUpdate).toHaveBeenCalledExactlyOnceWith(
                { appointment: appointmentId },
                { $set: config.body, $push: { actionHistory: { action: 'update', timestamp: now } } },
                { new: true, runValidators: true },
            );
            expect(mocks.Booking.findById).toHaveBeenCalledWith(appointmentId);
            expect(mocks.populate).toHaveBeenCalledWith('user doctor');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: updated }));
            if (config.key === 'prescription') {
                expect(mocks.to).toHaveBeenCalledWith('patient-id');
                expect(mocks.emit).toHaveBeenCalledWith('prescription-notification', expect.objectContaining({ appointmentId, actionHistory: updated.actionHistory, createdAt: now }));
            } else expect(mocks.emit).not.toHaveBeenCalled();
        });

        it('BE-M08: checks appointment ownership before returning 404 for a missing record', async () => {
            const res = response();
            await config.update(request(config.body), res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(mocks.Booking.findById).toHaveBeenCalledWith(appointmentId);
            expect(mocks.emit).not.toHaveBeenCalled();
        });

        it('BE-M09: returns 500 without emitting when the update query fails', async () => {
            Model.findOneAndUpdate.mockRejectedValue(new Error('database unavailable'));
            const res = response();
            await config.update(request(config.body), res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(mocks.Booking.findById).toHaveBeenCalledWith(appointmentId);
            expect(mocks.emit).not.toHaveBeenCalled();
        });

        it('BE-M10: rejects a conflicting body appointment before updating the record', async () => {
            Model.findOneAndUpdate.mockResolvedValue({ _id: 'record-id', appointment: otherId });
            const res = response();
            await config.update(request({ ...config.body, appointment: otherId }), res);
            expect(res.status.mock.calls[0][0]).toBeGreaterThanOrEqual(400);
            expect(res.status.mock.calls[0][0]).toBeLessThan(500);
            expect(Model.findOneAndUpdate).not.toHaveBeenCalled();
            expect(mocks.emit).not.toHaveBeenCalled();
        });

        it('BE-M10: uses the authorized params appointment when body appointment is absent', async () => {
            Model.findOneAndUpdate.mockResolvedValue({ _id: 'record-id', appointment: appointmentId });
            const body = { ...config.body };
            delete body.appointment;
            const res = response();
            await config.update(request(body), res);
            expect(Model.findOneAndUpdate).toHaveBeenCalledWith({ appointment: appointmentId }, expect.any(Object), expect.any(Object));
            expect(mocks.Booking.findById).toHaveBeenCalledWith(appointmentId);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it.each(['create', 'update'])('BE-M11: rejects an unrelated doctor attempting to %s another doctor record', async (operation) => {
            Model.findOneAndUpdate.mockResolvedValue({ _id: 'record-id', ...config.body });
            const req = request(config.body);
            req.userId = 'unrelated-doctor-id';
            const res = response();
            await config[operation](req, res);
            expect(res.status.mock.calls[0][0]).toBeGreaterThanOrEqual(400);
            expect(res.status.mock.calls[0][0]).toBeLessThan(500);
            expect(save).not.toHaveBeenCalled();
            expect(Model.findOneAndUpdate).not.toHaveBeenCalled();
            expect(mocks.emit).not.toHaveBeenCalled();
        });

        it.each(['missing booking', 'populate error'])('BE-M12: prevents writes when checking ownership encounters a %s', async (outcome) => {
            Model.findOneAndUpdate.mockResolvedValue({ _id: 'record-id', ...config.body });
            if (outcome === 'missing booking') booking = null;
            else mocks.populate.mockRejectedValue(new Error('populate unavailable'));
            const res = response();
            await config.update(request(config.body), res);
            expect(Model.findOneAndUpdate).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(outcome === 'missing booking' ? 404 : 500);
            expect(mocks.emit).not.toHaveBeenCalled();
        });

        it.each(['create', 'update'])('BE-M11: rejects unauthenticated %s before querying or writing', async (operation) => {
            const req = request(config.body);
            delete req.userId;
            const res = response();
            await config[operation](req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(mocks.Booking.findById).not.toHaveBeenCalled();
            expect(Model).not.toHaveBeenCalled();
            expect(save).not.toHaveBeenCalled();
            expect(Model.findOneAndUpdate).not.toHaveBeenCalled();
        });

        it.each(['patient', 'admin'])('BE-M11: rejects record writes by role %s even with a matching id', async (role) => {
            const req = request(config.body);
            req.userRole = role;
            const res = response();
            await config.create(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(Model).not.toHaveBeenCalled();
            expect(save).not.toHaveBeenCalled();
        });

        it.todo('BE-M11: enforces roles and appointment ownership through the actual Express routes (integration)');
        it.todo('BE-M07: verifies actual update validators and persisted history with MongoDB instead of query mocks');
    });
}

describe('Examination schema history', () => {
    it('BE-M13: defines actionHistory so update history can be persisted', () => {
        const Examination = actualSchemas.examination;
        expect(Examination.schema.path('actionHistory')).toBeDefined();
    });

    const examinationBody = cases.find(({ key }) => key === 'examination').body;

    it('BE-M13: accepts an existing examination without history and defaults to an empty array', () => {
        const record = new actualSchemas.examination(examinationBody);
        expect(record.validateSync()).toBeUndefined();
        expect(record.toObject().actionHistory).toEqual([]);
    });

    it('BE-M13: serializes appended history without dropping earlier entries or adding subdocument ids', () => {
        const createdAt = new Date(now.getTime() - 60000);
        const record = new actualSchemas.examination({
            ...examinationBody, actionHistory: [{ action: 'create', timestamp: createdAt }],
        });
        record.actionHistory.push({ action: 'update', timestamp: now });
        expect(record.validateSync()).toBeUndefined();
        expect(record.toObject().actionHistory).toEqual([
            { action: 'create', timestamp: createdAt },
            { action: 'update', timestamp: now },
        ]);
    });

    it('BE-M13: defaults a new history timestamp to the current time', () => {
        // The schema captures Date.now during import, before fake timers are installed.
        vi.useRealTimers();
        const before = Date.now();
        const record = new actualSchemas.examination({ ...examinationBody, actionHistory: [{ action: 'update' }] });
        const after = Date.now();
        expect(record.validateSync()).toBeUndefined();
        expect(record.actionHistory[0].timestamp).toBeInstanceOf(Date);
        expect(record.actionHistory[0].timestamp.getTime()).toBeGreaterThanOrEqual(before);
        expect(record.actionHistory[0].timestamp.getTime()).toBeLessThanOrEqual(after);
    });

    it.each([
        [{ action: 'delete', timestamp: now }, 'actionHistory.0.action'],
        [{ action: 'update', timestamp: 'invalid-date' }, 'actionHistory.0.timestamp'],
    ])('BE-M13: rejects invalid history entry %j at %s', (entry, errorPath) => {
        const record = new actualSchemas.examination({ ...examinationBody, actionHistory: [entry] });
        expect(record.validateSync().errors[errorPath]).toBeDefined();
    });
});
