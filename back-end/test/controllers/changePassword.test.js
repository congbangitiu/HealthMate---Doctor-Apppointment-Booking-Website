import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    User: { findById: vi.fn() }, Doctor: { findById: vi.fn() },
    bcrypt: { compare: vi.fn(), genSalt: vi.fn(), hash: vi.fn() },
}));
vi.mock('../../Models/UserSchema.js', () => ({ default: mocks.User }));
vi.mock('../../Models/DoctorSchema.js', () => ({ default: mocks.Doctor }));
vi.mock('../../Models/BookingSchema.js', () => ({ default: {} }));
vi.mock('../../Models/PrescriptionSchema.js', () => ({ default: {} }));
vi.mock('../../utils/cloudinaryConfig.js', () => ({ default: {} }));
vi.mock('bcryptjs', () => ({ default: mocks.bcrypt }));

import { changePassword as changePatientPassword } from '../../Controllers/userController.js';
import { changePassword as changeDoctorPassword } from '../../Controllers/doctorController.js';

const { default: actualBcrypt } = await vi.importActual('bcryptjs');
const { default: actualUser } = await vi.importActual('../../Models/UserSchema.js');
const response = () => {
    const res = {};
    res.status = vi.fn(() => res);
    res.json = vi.fn(() => res);
    return res;
};
const request = (overrides = {}) => ({
    userId: 'account-id', params: { id: 'different-body-untrusted-id' },
    body: { oldPassword: 'OldPass123', newPassword: 'NewPass123', confirmedNewPassword: 'NewPass123', ...overrides },
});
const makeAccount = () => ({
    _id: 'account-id', password: 'old-password-hash', confirmedPassword: 'old-password-hash',
    save: vi.fn().mockResolvedValue(undefined),
});
let account;

for (const config of [
    { name: 'User controller', handler: changePatientPassword, model: mocks.User },
    { name: 'Doctor controller', handler: changeDoctorPassword, model: mocks.Doctor },
]) {
    describe(`${config.name} changePassword`, () => {
        beforeEach(() => {
            vi.resetAllMocks();
            vi.spyOn(console, 'log').mockImplementation(() => {});
            vi.spyOn(console, 'error').mockImplementation(() => {});
            account = makeAccount();
            mocks.User.findById.mockResolvedValue(null);
            mocks.Doctor.findById.mockResolvedValue(null);
            config.model.findById.mockResolvedValue(account);
            mocks.bcrypt.compare.mockResolvedValue(true);
            mocks.bcrypt.genSalt.mockResolvedValue('test-salt');
            mocks.bcrypt.hash.mockResolvedValue('new-password-hash');
        });

        it('BE-D01: returns 404 without hashing when no account exists', async () => {
            config.model.findById.mockResolvedValue(null);
            const res = response();
            await config.handler(request(), res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(mocks.bcrypt.compare).not.toHaveBeenCalled();
            expect(mocks.bcrypt.hash).not.toHaveBeenCalled();
            expect(account.save).not.toHaveBeenCalled();
        });

        it('BE-D02: rejects an incorrect old password without changing or saving the account', async () => {
            mocks.bcrypt.compare.mockResolvedValue(false);
            const res = response();
            await config.handler(request(), res);
            expect(mocks.bcrypt.compare).toHaveBeenCalledWith('OldPass123', 'old-password-hash');
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'The old password is incorrect !!!' });
            expect(account.password).toBe('old-password-hash');
            expect(mocks.bcrypt.hash).not.toHaveBeenCalled();
            expect(account.save).not.toHaveBeenCalled();
        });

        it('BE-D03: rejects mismatching confirmation without hashing or saving', async () => {
            const res = response();
            await config.handler(request({ confirmedNewPassword: 'OtherPass123' }), res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'The new password and confirm new password do not match !!!' });
            expect(account.password).toBe('old-password-hash');
            expect(mocks.bcrypt.hash).not.toHaveBeenCalled();
            expect(account.save).not.toHaveBeenCalled();
        });

        it('BE-D04: hashes and saves the new password using the authenticated account id', async () => {
            const res = response();
            await config.handler(request(), res);
            expect(mocks.User.findById).toHaveBeenCalledWith('account-id');
            expect(config.model.findById).toHaveBeenCalledWith('account-id');
            expect(mocks.bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(mocks.bcrypt.hash).toHaveBeenCalledWith('NewPass123', 'test-salt');
            expect(account.password).toBe('new-password-hash');
            expect(account.save).toHaveBeenCalledTimes(1);
            expect(mocks.bcrypt.hash.mock.invocationCallOrder[0]).toBeLessThan(account.save.mock.invocationCallOrder[0]);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Password changed successfully' });
        });

        it('BE-D04: produces a hash verifiable with real bcrypt', async () => {
            vi.useRealTimers();
            account.password = await actualBcrypt.hash('OldPass123', 10);
            mocks.bcrypt.compare.mockImplementation(actualBcrypt.compare);
            mocks.bcrypt.genSalt.mockImplementation(actualBcrypt.genSalt);
            mocks.bcrypt.hash.mockImplementation(actualBcrypt.hash);
            const res = response();
            await config.handler(request(), res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(account.password).not.toBe('NewPass123');
            expect(await actualBcrypt.compare('NewPass123', account.password)).toBe(true);
            expect(await actualBcrypt.compare('OldPass123', account.password)).toBe(false);
        });

        it.each(['User lookup', 'compare', 'salt', 'hash', 'save'])(
            'BE-D05: returns 500 when %s fails', async (stage) => {
                const dependency = {
                    'User lookup': mocks.User.findById, compare: mocks.bcrypt.compare,
                    salt: mocks.bcrypt.genSalt, hash: mocks.bcrypt.hash, save: account.save,
                }[stage];
                dependency.mockRejectedValue(new Error('dependency unavailable'));
                const res = response();
                await config.handler(request(), res);
                expect(res.status).toHaveBeenCalledWith(500);
                expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Server error' });
                if (stage !== 'save') expect(account.save).not.toHaveBeenCalled();
                if (stage === 'save') expect(account.password).toBe('new-password-hash');
                // A rejected save does not establish whether a real database write was rolled back.
            },
        );

        if (config.model === mocks.User) {
            it.fails('BE-D08 [KNOWN BUG]: keeps confirmedPassword consistent with the saved password hash', async () => {
                expect(actualUser.schema.path('confirmedPassword')).toBeDefined();
                const res = response();
                await config.handler(request(), res);
                expect(res.status).toHaveBeenCalledWith(200);
                expect(account.confirmedPassword).toBe(account.password);
            });
        } else {
            it('BE-D05: returns 500 when the fallback Doctor lookup fails', async () => {
                mocks.Doctor.findById.mockRejectedValue(new Error('database unavailable'));
                const res = response();
                await config.handler(request(), res);
                expect(res.status).toHaveBeenCalledWith(500);
                expect(account.save).not.toHaveBeenCalled();
            });

            it('BE-D06: uses the Doctor record only after the User lookup returns null', async () => {
                delete account.confirmedPassword;
                const res = response();
                await config.handler(request(), res);
                expect(mocks.User.findById).toHaveBeenCalledWith('account-id');
                expect(mocks.Doctor.findById).toHaveBeenCalledWith('account-id');
                expect(mocks.User.findById.mock.invocationCallOrder[0]).toBeLessThan(mocks.Doctor.findById.mock.invocationCallOrder[0]);
                expect(account).not.toHaveProperty('confirmedPassword');
                expect(account.password).toBe('new-password-hash');
                expect(res.status).toHaveBeenCalledWith(200);
            });

            it('BE-D06 [CURRENT BEHAVIOR]: uses a User account first and skips the Doctor lookup when found', async () => {
                const patient = makeAccount();
                mocks.User.findById.mockResolvedValue(patient);
                const res = response();
                await config.handler(request(), res);
                expect(patient.save).toHaveBeenCalledTimes(1);
                expect(account.save).not.toHaveBeenCalled();
                expect(mocks.Doctor.findById).not.toHaveBeenCalled();
                expect(res.status).toHaveBeenCalledWith(200);
            });

            it.fails('BE-D08 [KNOWN BUG]: synchronizes confirmedPassword when the Doctor controller uses a User record', async () => {
                const patient = makeAccount();
                mocks.User.findById.mockResolvedValue(patient);
                await config.handler(request(), response());
                expect(patient.confirmedPassword).toBe(patient.password);
            });
        }

        it.todo('BE-D07: reject weak or unchanged passwords after the password policy is agreed');
    });
}
