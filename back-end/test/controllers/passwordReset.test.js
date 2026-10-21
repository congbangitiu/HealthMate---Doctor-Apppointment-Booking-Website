import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';

const mocks = vi.hoisted(() => ({
    User: { findOne: vi.fn(), schema: { path: vi.fn() } },
    Doctor: { findOne: vi.fn(), schema: { path: vi.fn() } },
    PasswordReset: {
        findOne: vi.fn(),
        findOneAndUpdate: vi.fn(),
        findById: vi.fn(),
        deleteOne: vi.fn(),
    },
    bcrypt: { compare: vi.fn(), genSalt: vi.fn(), hash: vi.fn() },
    sendMail: vi.fn(),
}));

vi.mock('../../Models/UserSchema.js', () => ({ default: mocks.User }));
vi.mock('../../Models/DoctorSchema.js', () => ({ default: mocks.Doctor }));
vi.mock('../../Models/PasswordResetSchema.js', () => ({ default: mocks.PasswordReset }));
vi.mock('../../Models/OtpSchema.js', () => ({ default: {} }));
vi.mock('bcryptjs', () => ({ default: mocks.bcrypt }));
vi.mock('twilio', () => ({ default: vi.fn() }));
vi.mock('../../utils/mailTransporter.js', () => ({ default: { sendMail: mocks.sendMail } }));

import { forgotPassword, verifyForgotPasswordOTP, resetPassword } from '../../Controllers/authController.js';

const email = 'patient@example.test';
const resetId = 'reset-request-id';
const now = new Date('2026-10-21T10:00:00+07:00');
const resetSecret = `${process.env.JWT_SECRET_KEY}-reset-password`;

const createResponse = () => {
    const res = {};
    res.status = vi.fn(() => res);
    res.json = vi.fn(() => res);
    return res;
};

const createResetRequest = (overrides = {}) => ({
    _id: resetId,
    email,
    model: 'User',
    otp: 'hashed-otp',
    attempts: 0,
    createdAt: now,
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
});

const createAccount = () => ({
    email,
    fullname: 'Test Patient',
    password: 'old-password-hash',
    save: vi.fn().mockResolvedValue(undefined),
});

const signResetToken = (payload = {}, options = {}) => jwt.sign(
    { email, model: 'User', resetId, ...payload },
    resetSecret,
    { expiresIn: '10m', ...options },
);

const resetBody = (overrides = {}) => ({
    resetToken: signResetToken(),
    newPassword: 'NewPass123',
    confirmedPassword: 'NewPass123',
    ...overrides,
});

beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.User.findOne.mockResolvedValue(null);
    mocks.Doctor.findOne.mockResolvedValue(null);
    mocks.User.schema.path.mockReturnValue({});
    mocks.Doctor.schema.path.mockReturnValue(undefined);
    mocks.PasswordReset.findOne.mockResolvedValue(null);
    mocks.PasswordReset.findOneAndUpdate.mockResolvedValue({});
    mocks.PasswordReset.findById.mockResolvedValue(createResetRequest());
    mocks.PasswordReset.deleteOne.mockResolvedValue({ deletedCount: 1 });
    mocks.bcrypt.compare.mockResolvedValue(false);
    mocks.bcrypt.genSalt.mockResolvedValue('test-salt');
    mocks.bcrypt.hash.mockResolvedValue('new-password-hash');
    mocks.sendMail.mockResolvedValue({});
});

describe('forgotPassword', () => {
    it('BE-F01: rejects a missing email before accessing the database', async () => {
        const res = createResponse();
        await forgotPassword({ body: {} }, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(mocks.User.findOne).not.toHaveBeenCalled();
        expect(mocks.PasswordReset.findOneAndUpdate).not.toHaveBeenCalled();
        expect(mocks.sendMail).not.toHaveBeenCalled();
    });

    it('BE-F02: rejects an email absent from both account collections', async () => {
        const res = createResponse();
        await forgotPassword({ body: { email } }, res);
        expect(mocks.User.findOne).toHaveBeenCalledWith({ email });
        expect(mocks.Doctor.findOne).toHaveBeenCalledWith({ email });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(mocks.sendMail).not.toHaveBeenCalled();
    });

    it('BE-F03: creates a Doctor reset request when no User account exists', async () => {
        mocks.Doctor.findOne.mockResolvedValue(createAccount());
        const res = createResponse();
        await forgotPassword({ body: { email } }, res);
        expect(mocks.PasswordReset.findOneAndUpdate).toHaveBeenCalledWith(
            { email }, expect.objectContaining({ email, model: 'Doctor' }), { upsert: true, new: true },
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(mocks.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: email }));
    });

    it.each([
        [59000, 1],
        [59999, 1],
        [0, 60],
    ])('BE-F04: enforces the cooldown at %i milliseconds with retryAfter %i', async (age, retryAfter) => {
        mocks.User.findOne.mockResolvedValue(createAccount());
        mocks.PasswordReset.findOne.mockResolvedValue(createResetRequest({ createdAt: new Date(now.getTime() - age) }));
        const res = createResponse();
        await forgotPassword({ body: { email } }, res);
        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, retryAfter }));
        expect(mocks.bcrypt.hash).not.toHaveBeenCalled();
        expect(mocks.PasswordReset.findOneAndUpdate).not.toHaveBeenCalled();
        expect(mocks.sendMail).not.toHaveBeenCalled();
    });

    it('BE-F05: allows resending at exactly sixty seconds and resets attempts and creation time', async () => {
        mocks.User.findOne.mockResolvedValue(createAccount());
        mocks.PasswordReset.findOne.mockResolvedValue(createResetRequest({ createdAt: new Date(now.getTime() - 60000), attempts: 4 }));
        const res = createResponse();
        await forgotPassword({ body: { email } }, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(mocks.PasswordReset.findOneAndUpdate).toHaveBeenCalledWith(
            { email }, expect.objectContaining({ attempts: 0, createdAt: now }), { upsert: true, new: true },
        );
    });

    it.each([[0, '100000'], [0.999999, '999999']])(
        'BE-F06: hashes a six-digit OTP for random value %s and sends it only by email',
        async (random, otp) => {
            vi.spyOn(Math, 'random').mockReturnValue(random);
            mocks.User.findOne.mockResolvedValue(createAccount());
            mocks.bcrypt.hash.mockResolvedValue('hashed-otp');
            const res = createResponse();
            await forgotPassword({ body: { email } }, res);
            expect(mocks.bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(mocks.bcrypt.hash).toHaveBeenCalledWith(otp, 'test-salt');
            expect(mocks.PasswordReset.findOneAndUpdate).toHaveBeenCalledWith(
                { email }, { email, model: 'User', otp: 'hashed-otp', attempts: 0, createdAt: now }, { upsert: true, new: true },
            );
            expect(mocks.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: email, html: expect.stringContaining(otp.split('').join(' ')) }));
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'OTP sent successfully to your email!' });
            expect(mocks.Doctor.findOne).not.toHaveBeenCalled();
            expect(mocks.PasswordReset.findOneAndUpdate.mock.invocationCallOrder[0]).toBeLessThan(mocks.sendMail.mock.invocationCallOrder[0]);
        },
    );

    it.each(['User lookup', 'Doctor lookup', 'reset lookup', 'salt', 'hash', 'upsert', 'mail'])(
        'BE-F07: returns 500 without success when %s fails', async (stage) => {
            mocks.User.findOne.mockResolvedValue(stage === 'Doctor lookup' ? null : createAccount());
            const dependency = {
                'User lookup': mocks.User.findOne,
                'Doctor lookup': mocks.Doctor.findOne,
                'reset lookup': mocks.PasswordReset.findOne,
                salt: mocks.bcrypt.genSalt,
                hash: mocks.bcrypt.hash,
                upsert: mocks.PasswordReset.findOneAndUpdate,
                mail: mocks.sendMail,
            }[stage];
            dependency.mockRejectedValue(new Error('dependency unavailable'));
            const res = createResponse();
            await forgotPassword({ body: { email } }, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to send OTP. Please try again!' });
            if (stage !== 'mail') expect(mocks.sendMail).not.toHaveBeenCalled();
        },
    );
});

describe('verifyForgotPasswordOTP', () => {
    it.each([{ otp: '123456' }, { email }, { email, otp: '' }])(
        'BE-V01: rejects incomplete input %j without querying the reset request', async (body) => {
            const res = createResponse();
            await verifyForgotPasswordOTP({ body }, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(mocks.PasswordReset.findOne).not.toHaveBeenCalled();
            expect(mocks.bcrypt.compare).not.toHaveBeenCalled();
        },
    );

    it('BE-V01: rejects an absent reset request without issuing a token', async () => {
        const res = createResponse();
        await verifyForgotPasswordOTP({ body: { email, otp: '123456' } }, res);
        expect(mocks.PasswordReset.findOne).toHaveBeenCalledWith({ email });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0]).not.toHaveProperty('resetToken');
        expect(mocks.bcrypt.compare).not.toHaveBeenCalled();
    });

    it.each([0, 1, 3])('BE-V02: increments attempts from %i and reports the remaining count', async (attempts) => {
        const request = createResetRequest({ attempts });
        mocks.PasswordReset.findOne.mockResolvedValue(request);
        const res = createResponse();
        await verifyForgotPasswordOTP({ body: { email, otp: '000000' } }, res);
        expect(request.attempts).toBe(attempts + 1);
        expect(request.save).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ attemptsLeft: 4 - attempts }));
        expect(mocks.PasswordReset.deleteOne).not.toHaveBeenCalled();
    });

    it('BE-V03: deletes the reset request on the fifth incorrect attempt', async () => {
        const request = createResetRequest({ attempts: 4 });
        mocks.PasswordReset.findOne.mockResolvedValue(request);
        const res = createResponse();
        await verifyForgotPasswordOTP({ body: { email, otp: '000000' } }, res);
        expect(mocks.PasswordReset.deleteOne).toHaveBeenCalledWith({ _id: resetId });
        expect(request.save).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Too many incorrect attempts. Please request a new OTP!' });
    });

    it.each(['User', 'Doctor'])('BE-V04: issues a ten-minute reset JWT for %s using the separate reset secret', async (model) => {
        const request = createResetRequest({ model });
        mocks.PasswordReset.findOne.mockResolvedValue(request);
        mocks.bcrypt.compare.mockResolvedValue(true);
        const res = createResponse();
        await verifyForgotPasswordOTP({ body: { email, otp: '123456' } }, res);
        expect(mocks.bcrypt.compare).toHaveBeenCalledWith('123456', 'hashed-otp');
        expect(res.status).toHaveBeenCalledWith(200);
        const token = res.json.mock.calls[0][0].resetToken;
        const payload = jwt.verify(token, resetSecret);
        expect(payload).toMatchObject({ email, model, resetId });
        expect(payload.exp - payload.iat).toBe(600);
        expect(() => jwt.verify(token, process.env.JWT_SECRET_KEY)).toThrow();
        expect(request.save).not.toHaveBeenCalled();
        expect(mocks.PasswordReset.deleteOne).not.toHaveBeenCalled();
    });

    // Confirmed regression: the controller relies on TTL cleanup instead of checking age.
    it('BE-V05 [KNOWN BUG]: rejects an expired OTP even while its record remains in MongoDB', async () => {
        mocks.PasswordReset.findOne.mockResolvedValue(createResetRequest({ createdAt: new Date(now.getTime() - 601000) }));
        mocks.bcrypt.compare.mockResolvedValue(true);
        const res = createResponse();
        await verifyForgotPasswordOTP({ body: { email, otp: '123456' } }, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0]).not.toHaveProperty('resetToken');
    });

    it.each(['lookup', 'compare', 'attempt save', 'attempt deletion'])(
        'BE-V06: returns 500 without a token when %s fails', async (stage) => {
            const request = createResetRequest({ attempts: stage === 'attempt deletion' ? 4 : 0 });
            mocks.PasswordReset.findOne.mockResolvedValue(request);
            const dependency = {
                lookup: mocks.PasswordReset.findOne,
                compare: mocks.bcrypt.compare,
                'attempt save': request.save,
                'attempt deletion': mocks.PasswordReset.deleteOne,
            }[stage];
            dependency.mockRejectedValue(new Error('dependency unavailable'));
            const res = createResponse();
            await verifyForgotPasswordOTP({ body: { email, otp: '000000' } }, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json.mock.calls[0][0]).not.toHaveProperty('resetToken');
        },
    );
});

describe('resetPassword', () => {
    it.each(['resetToken', 'newPassword', 'confirmedPassword'])(
        'BE-P01: rejects a missing %s without querying the database', async (field) => {
            const res = createResponse();
            await resetPassword({ body: resetBody({ [field]: '' }) }, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(mocks.PasswordReset.findById).not.toHaveBeenCalled();
        },
    );

    it('BE-P02: rejects mismatching passwords before accessing the reset request', async () => {
        const res = createResponse();
        await resetPassword({ body: resetBody({ confirmedPassword: 'OtherPass123' }) }, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(mocks.PasswordReset.findById).not.toHaveBeenCalled();
    });

    it.each(['Abc1234', 'abcdefgh', '12345678'])('BE-P03: rejects weak password %s', async (password) => {
        const res = createResponse();
        await resetPassword({ body: resetBody({ newPassword: password, confirmedPassword: password }) }, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(mocks.PasswordReset.findById).not.toHaveBeenCalled();
        expect(mocks.bcrypt.hash).not.toHaveBeenCalled();
    });

    it('BE-P04: accepts the exact eight-character password boundary', async () => {
        mocks.User.findOne.mockResolvedValue(createAccount());
        const res = createResponse();
        await resetPassword({ body: resetBody({ newPassword: 'Abcd1234', confirmedPassword: 'Abcd1234' }) }, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it.each(['malformed', 'wrong signature', 'expired', 'access token'])(
        'BE-P05: rejects token type "%s" before querying reset records', async (kind) => {
            const token = {
                malformed: 'not-a-token',
                'wrong signature': jwt.sign({ email, resetId }, 'wrong-secret'),
                expired: signResetToken({}, { expiresIn: -1 }),
                'access token': jwt.sign({ id: 'patient-id', role: 'patient' }, process.env.JWT_SECRET_KEY),
            }[kind];
            const res = createResponse();
            await resetPassword({ body: resetBody({ resetToken: token }) }, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(mocks.PasswordReset.findById).not.toHaveBeenCalled();
            expect(mocks.User.findOne).not.toHaveBeenCalled();
            expect(mocks.PasswordReset.deleteOne).not.toHaveBeenCalled();
        },
    );

    it.each(['absent', 'different email'])('BE-P06: rejects a reset record that is %s', async (kind) => {
        mocks.PasswordReset.findById.mockResolvedValue(kind === 'absent' ? null : createResetRequest({ email: 'other@example.test' }));
        const res = createResponse();
        await resetPassword({ body: resetBody() }, res);
        expect(mocks.PasswordReset.findById).toHaveBeenCalledWith(resetId);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(mocks.User.findOne).not.toHaveBeenCalled();
        expect(mocks.PasswordReset.deleteOne).not.toHaveBeenCalled();
    });

    it('BE-P07: returns 404 when the account no longer exists', async () => {
        const res = createResponse();
        await resetPassword({ body: resetBody() }, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(mocks.bcrypt.hash).not.toHaveBeenCalled();
        expect(mocks.PasswordReset.deleteOne).not.toHaveBeenCalled();
    });

    it('BE-P08: rejects reusing the current password without saving or consuming the request', async () => {
        const account = createAccount();
        mocks.User.findOne.mockResolvedValue(account);
        mocks.bcrypt.compare.mockResolvedValue(true);
        const res = createResponse();
        await resetPassword({ body: resetBody() }, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(account.save).not.toHaveBeenCalled();
        expect(account.password).toBe('old-password-hash');
        expect(mocks.PasswordReset.deleteOne).not.toHaveBeenCalled();
    });

    it.each([['BE-P09', 'User'], ['BE-P10', 'Doctor']])(
        '%s: saves the new hash to %s and consumes the request after saving', async (_id, model) => {
            const account = createAccount();
            mocks[model].findOne.mockResolvedValue(account);
            mocks.PasswordReset.findById.mockResolvedValue(createResetRequest({ model }));
            const res = createResponse();
            await resetPassword({ body: resetBody({ resetToken: signResetToken({ model }) }) }, res);
            expect(mocks[model].findOne).toHaveBeenCalledWith({ email });
            expect(mocks[model === 'User' ? 'Doctor' : 'User'].findOne).not.toHaveBeenCalled();
            expect(mocks.bcrypt.compare).toHaveBeenCalledWith('NewPass123', 'old-password-hash');
            expect(mocks.bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(mocks.bcrypt.hash).toHaveBeenCalledWith('NewPass123', 'test-salt');
            expect(account.password).toBe('new-password-hash');
            if (model === 'User') expect(account.confirmedPassword).toBe('new-password-hash');
            else expect(account).not.toHaveProperty('confirmedPassword');
            expect(account.save).toHaveBeenCalledTimes(1);
            expect(mocks.PasswordReset.deleteOne).toHaveBeenCalledWith({ _id: resetId });
            expect(account.save.mock.invocationCallOrder[0]).toBeLessThan(mocks.PasswordReset.deleteOne.mock.invocationCallOrder[0]);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Your password has been reset successfully!' });
        },
    );

    it.each(['request lookup', 'account lookup', 'compare', 'salt', 'hash', 'account save'])(
        'BE-P11: preserves the reset request when %s fails', async (stage) => {
            const account = createAccount();
            mocks.User.findOne.mockResolvedValue(account);
            const dependency = {
                'request lookup': mocks.PasswordReset.findById,
                'account lookup': mocks.User.findOne,
                compare: mocks.bcrypt.compare,
                salt: mocks.bcrypt.genSalt,
                hash: mocks.bcrypt.hash,
                'account save': account.save,
            }[stage];
            dependency.mockRejectedValue(new Error('dependency unavailable'));
            const res = createResponse();
            await resetPassword({ body: resetBody() }, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(mocks.PasswordReset.deleteOne).not.toHaveBeenCalled();
            if (stage !== 'account save') expect(account.save).not.toHaveBeenCalled();
        },
    );

    it('BE-P12: rejects a second use after the reset request has been deleted', async () => {
        const account = createAccount();
        mocks.User.findOne.mockResolvedValue(account);
        mocks.PasswordReset.findById.mockResolvedValueOnce(createResetRequest()).mockResolvedValueOnce(null);
        const body = resetBody();
        const first = createResponse();
        const second = createResponse();
        await resetPassword({ body }, first);
        await resetPassword({ body }, second);
        expect(first.status).toHaveBeenCalledWith(200);
        expect(second.status).toHaveBeenCalledWith(401);
        expect(account.save).toHaveBeenCalledTimes(1);
        expect(mocks.PasswordReset.deleteOne).toHaveBeenCalledTimes(1);
    });

    it.todo('BE-P13: only one concurrent reset succeeds for the same request (MongoDB integration)');

    it('BE-P14 [LIMITATION]: reports 500 after the password was saved if reset-request deletion fails', async () => {
        const account = createAccount();
        mocks.User.findOne.mockResolvedValue(account);
        mocks.PasswordReset.deleteOne.mockRejectedValue(new Error('delete unavailable'));
        const res = createResponse();
        await resetPassword({ body: resetBody() }, res);
        expect(account.save).toHaveBeenCalledTimes(1);
        expect(account.password).toBe('new-password-hash');
        expect(res.status).toHaveBeenCalledWith(500);
        // This characterizes current behavior; it does not establish atomicity or rollback.
    });
});
