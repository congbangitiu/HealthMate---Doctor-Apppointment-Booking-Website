import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';

const mocks = vi.hoisted(() => {
    const userSave = vi.fn();
    const doctorSave = vi.fn();

    const User = vi.fn(function UserModel(data) {
        Object.assign(this, data);
        this.save = userSave;
    });
    User.findOne = vi.fn();

    const Doctor = vi.fn(function DoctorModel(data) {
        Object.assign(this, data);
        this.save = doctorSave;
    });
    Doctor.findOne = vi.fn();

    return {
        User,
        Doctor,
        userSave,
        doctorSave,
        otpFindOne: vi.fn(),
        otpDeleteOne: vi.fn(),
        passwordResetFindOne: vi.fn(),
        bcryptCompare: vi.fn(),
        bcryptGenSalt: vi.fn(),
        bcryptHash: vi.fn(),
        sendMail: vi.fn(),
    };
});

vi.mock('../../Models/UserSchema.js', () => ({ default: mocks.User }));
vi.mock('../../Models/DoctorSchema.js', () => ({ default: mocks.Doctor }));
vi.mock('../../Models/OtpSchema.js', () => ({
    default: {
        findOne: mocks.otpFindOne,
        deleteOne: mocks.otpDeleteOne,
    },
}));
vi.mock('../../Models/PasswordResetSchema.js', () => ({
    default: {
        findOne: mocks.passwordResetFindOne,
    },
}));
vi.mock('bcryptjs', () => ({
    default: {
        compare: mocks.bcryptCompare,
        genSalt: mocks.bcryptGenSalt,
        hash: mocks.bcryptHash,
    },
}));
vi.mock('twilio', () => ({ default: vi.fn() }));
vi.mock('../../utils/mailTransporter.js', () => ({
    default: { sendMail: mocks.sendMail },
}));

import { login, registerAndVerifyOTP } from '../../Controllers/authController.js';

const createResponse = () => {
    const res = {};
    res.status = vi.fn(() => res);
    res.json = vi.fn(() => res);
    return res;
};

const createAccountDocument = ({
    id,
    role,
    email,
    password = 'stored-password-hash',
    confirmedPassword = 'stored-confirmation-hash',
}) => ({
    _id: id,
    role,
    password,
    _doc: {
        _id: id,
        fullname: role === 'doctor' ? 'Test Doctor' : 'Test Patient',
        email,
        password,
        confirmedPassword,
        role,
        appointment: ['private-appointment-field'],
        photo: 'avatar.jpg',
    },
});

const validRegistrationBody = (overrides = {}) => ({
    fullname: 'Test Patient',
    username: 'testpatient',
    phone: '0901234567',
    email: 'patient@example.test',
    password: 'Password123',
    confirmedPassword: 'Password123',
    role: 'patient',
    photo: 'avatar.jpg',
    gender: 'other',
    otp: '123456',
    ...overrides,
});

describe('login', () => {
    beforeEach(() => {
        process.env.JWT_SECRET_KEY = 'unit-test-secret';
        mocks.User.findOne.mockReset();
        mocks.Doctor.findOne.mockReset();
        mocks.bcryptCompare.mockReset();
    });

    it('BE-L01: logs in a patient and issues a verifiable access token', async () => {
        const patient = createAccountDocument({
            id: 'patient-id',
            role: 'patient',
            email: 'patient@example.test',
        });
        mocks.User.findOne.mockResolvedValue(patient);
        mocks.Doctor.findOne.mockResolvedValue(null);
        mocks.bcryptCompare.mockResolvedValue(true);
        const res = createResponse();

        await login({ body: { email: patient._doc.email, password: 'Password123' } }, res);

        expect(mocks.User.findOne).toHaveBeenCalledWith({ email: patient._doc.email });
        expect(mocks.Doctor.findOne).toHaveBeenCalledWith({ email: patient._doc.email });
        expect(mocks.bcryptCompare).toHaveBeenCalledWith('Password123', 'stored-password-hash');
        expect(res.status).toHaveBeenCalledWith(200);

        const responseBody = res.json.mock.calls[0][0];
        expect(jwt.verify(responseBody.token, process.env.JWT_SECRET_KEY)).toMatchObject({
            id: 'patient-id',
            role: 'patient',
        });
        expect(responseBody).toMatchObject({
            status: true,
            message: 'Login successfully',
            role: 'patient',
            data: {
                _id: 'patient-id',
                email: 'patient@example.test',
            },
        });
    });

    it('BE-L02: logs in a doctor from the Doctor collection', async () => {
        const doctor = createAccountDocument({
            id: 'doctor-id',
            role: 'doctor',
            email: 'doctor@example.test',
        });
        mocks.User.findOne.mockResolvedValue(null);
        mocks.Doctor.findOne.mockResolvedValue(doctor);
        mocks.bcryptCompare.mockResolvedValue(true);
        const res = createResponse();

        await login({ body: { email: doctor._doc.email, password: 'Password123' } }, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const responseBody = res.json.mock.calls[0][0];
        expect(responseBody.role).toBe('doctor');
        expect(responseBody.data.email).toBe('doctor@example.test');
        expect(jwt.verify(responseBody.token, process.env.JWT_SECRET_KEY)).toMatchObject({
            id: 'doctor-id',
            role: 'doctor',
        });
    });

    it('BE-L03: returns 404 when neither account collection contains the email', async () => {
        mocks.User.findOne.mockResolvedValue(null);
        mocks.Doctor.findOne.mockResolvedValue(null);
        const res = createResponse();

        await login({ body: { email: 'missing@example.test', password: 'Password123' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
        expect(mocks.bcryptCompare).not.toHaveBeenCalled();
    });

    it('BE-L04: returns 400 when the password is incorrect', async () => {
        const patient = createAccountDocument({
            id: 'patient-id',
            role: 'patient',
            email: 'patient@example.test',
        });
        mocks.User.findOne.mockResolvedValue(patient);
        mocks.Doctor.findOne.mockResolvedValue(null);
        mocks.bcryptCompare.mockResolvedValue(false);
        const res = createResponse();

        await login({ body: { email: patient._doc.email, password: 'WrongPassword123' } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            status: false,
            message: 'Password is not correct. Try input again !!!',
        });
    });

    it.each([
        ['an account query fails', 'query'],
        ['password comparison fails', 'bcrypt'],
    ])('BE-L05: returns 500 when %s', async (_description, failurePoint) => {
        const patient = createAccountDocument({
            id: 'patient-id',
            role: 'patient',
            email: 'patient@example.test',
        });

        if (failurePoint === 'query') {
            mocks.User.findOne.mockRejectedValue(new Error('database unavailable'));
        } else {
            mocks.User.findOne.mockResolvedValue(patient);
            mocks.Doctor.findOne.mockResolvedValue(null);
            mocks.bcryptCompare.mockRejectedValue(new Error('bcrypt unavailable'));
        }

        const res = createResponse();
        await login({ body: { email: patient._doc.email, password: 'Password123' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ status: false, message: 'Login failed' });
    });

    it('BE-L06: never exposes password hashes or private appointment fields', async () => {
        const patient = createAccountDocument({
            id: 'patient-id',
            role: 'patient',
            email: 'patient@example.test',
        });
        mocks.User.findOne.mockResolvedValue(patient);
        mocks.Doctor.findOne.mockResolvedValue(null);
        mocks.bcryptCompare.mockResolvedValue(true);
        const res = createResponse();

        await login({ body: { email: patient._doc.email, password: 'Password123' } }, res);

        const { data } = res.json.mock.calls[0][0];
        expect(data).not.toHaveProperty('password');
        expect(data).not.toHaveProperty('confirmedPassword');
        expect(data).not.toHaveProperty('appointment');
        expect(data).not.toHaveProperty('role');
    });
});

describe('registerAndVerifyOTP', () => {
    beforeEach(() => {
        vi.useRealTimers();
        mocks.User.mockClear();
        mocks.Doctor.mockClear();
        mocks.User.findOne.mockReset();
        mocks.Doctor.findOne.mockReset();
        mocks.userSave.mockReset();
        mocks.doctorSave.mockReset();
        mocks.otpFindOne.mockReset();
        mocks.otpDeleteOne.mockReset();
        mocks.bcryptGenSalt.mockReset();
        mocks.bcryptHash.mockReset();

        mocks.bcryptGenSalt.mockResolvedValue('unit-test-salt');
        mocks.bcryptHash.mockResolvedValue('hashed-password');
    });

    it.each([
        ['email is missing', { email: '' }],
        ['OTP is missing', { otp: '' }],
    ])('BE-R01: returns 400 when %s', async (_description, overrides) => {
        const res = createResponse();

        await registerAndVerifyOTP({ body: validRegistrationBody(overrides) }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Please provide both email and OTP!' });
        expect(mocks.User.findOne).not.toHaveBeenCalled();
        expect(mocks.Doctor.findOne).not.toHaveBeenCalled();
        expect(mocks.otpFindOne).not.toHaveBeenCalled();
    });

    it.each([
        ['patient', mocks.User, mocks.userSave],
        ['doctor', mocks.Doctor, mocks.doctorSave],
    ])('BE-R02: rejects an existing %s account', async (role, Model, saveMock) => {
        Model.findOne.mockResolvedValue({ _id: `${role}-id`, role });
        const res = createResponse();

        await registerAndVerifyOTP(
            { body: validRegistrationBody({ role, email: `${role}@example.test` }) },
            res,
        );

        expect(Model.findOne).toHaveBeenCalledWith({ email: `${role}@example.test` });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'User already exists' });
        expect(saveMock).not.toHaveBeenCalled();
        expect(mocks.otpFindOne).not.toHaveBeenCalled();
    });

    it('BE-R03: rejects registration when the OTP record does not exist', async () => {
        mocks.User.findOne.mockResolvedValue(null);
        mocks.otpFindOne.mockResolvedValue(null);
        const res = createResponse();

        await registerAndVerifyOTP({ body: validRegistrationBody() }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'OTP expired or not found for this email!' });
        expect(mocks.bcryptHash).not.toHaveBeenCalled();
        expect(mocks.userSave).not.toHaveBeenCalled();
    });

    it('BE-R04: rejects registration when the OTP does not match', async () => {
        mocks.User.findOne.mockResolvedValue(null);
        mocks.otpFindOne.mockResolvedValue({ otp: '654321', createdAt: new Date() });
        const res = createResponse();

        await registerAndVerifyOTP({ body: validRegistrationBody() }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid OTP!' });
        expect(mocks.bcryptHash).not.toHaveBeenCalled();
        expect(mocks.userSave).not.toHaveBeenCalled();
    });

    it('BE-R05: rejects registration when the passwords do not match', async () => {
        mocks.User.findOne.mockResolvedValue(null);
        mocks.otpFindOne.mockResolvedValue({ otp: '123456', createdAt: new Date() });
        const res = createResponse();

        await registerAndVerifyOTP(
            { body: validRegistrationBody({ confirmedPassword: 'DifferentPassword123' }) },
            res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Passwords do not match!' });
        expect(mocks.bcryptHash).not.toHaveBeenCalled();
        expect(mocks.userSave).not.toHaveBeenCalled();
    });

    it.each([
        ['patient', mocks.User, mocks.userSave],
        ['doctor', mocks.Doctor, mocks.doctorSave],
    ])('BE-R06: creates a %s account and consumes the OTP', async (role, Model, saveMock) => {
        Model.findOne.mockResolvedValue(null);
        mocks.otpFindOne.mockResolvedValue({ otp: '123456', createdAt: new Date() });
        saveMock.mockResolvedValue(undefined);
        mocks.otpDeleteOne.mockResolvedValue({ deletedCount: 1 });
        const email = `${role}@example.test`;
        const res = createResponse();

        await registerAndVerifyOTP(
            { body: validRegistrationBody({ role, email, fullname: `Test ${role}` }) },
            res,
        );

        expect(mocks.bcryptGenSalt).toHaveBeenCalledWith(10);
        expect(mocks.bcryptHash).toHaveBeenCalledWith('Password123', 'unit-test-salt');
        expect(Model).toHaveBeenCalledWith(
            expect.objectContaining({
                email,
                role,
                password: 'hashed-password',
                confirmedPassword: 'hashed-password',
            }),
        );
        expect(saveMock).toHaveBeenCalledTimes(1);
        expect(mocks.otpDeleteOne).toHaveBeenCalledWith({ email });
        expect(saveMock.mock.invocationCallOrder[0]).toBeLessThan(
            mocks.otpDeleteOne.mock.invocationCallOrder[0],
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Account created successfully!',
        });
    });

    it('BE-R07: returns 500 and preserves the OTP when account saving fails', async () => {
        mocks.User.findOne.mockResolvedValue(null);
        mocks.otpFindOne.mockResolvedValue({ otp: '123456', createdAt: new Date() });
        mocks.userSave.mockRejectedValue(new Error('database unavailable'));
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const res = createResponse();

        await registerAndVerifyOTP({ body: validRegistrationBody() }, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Internal server error. Try again!',
        });
        expect(mocks.otpDeleteOne).not.toHaveBeenCalled();
        consoleError.mockRestore();
    });

    it.each(['admin', 'owner', 'unknown'])('BE-R08: rejects the unsupported role %s', async (role) => {
        const res = createResponse();

        await registerAndVerifyOTP({ body: validRegistrationBody({ role }) }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid account role' });
        expect(mocks.User.findOne).not.toHaveBeenCalled();
        expect(mocks.Doctor.findOne).not.toHaveBeenCalled();
        expect(mocks.otpFindOne).not.toHaveBeenCalled();
        expect(mocks.User).not.toHaveBeenCalled();
        expect(mocks.Doctor).not.toHaveBeenCalled();
    });

    it('BE-R09: rejects and removes an OTP record that has reached its two-minute lifetime', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-10-20T10:00:00+07:00'));
        mocks.User.findOne.mockResolvedValue(null);
        mocks.otpFindOne.mockResolvedValue({
            otp: '123456',
            createdAt: new Date('2026-10-20T09:58:00+07:00'),
        });
        mocks.otpDeleteOne.mockResolvedValue({ deletedCount: 1 });
        const res = createResponse();

        await registerAndVerifyOTP({ body: validRegistrationBody() }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'OTP expired or not found for this email!' });
        expect(mocks.otpDeleteOne).toHaveBeenCalledWith({ email: 'patient@example.test' });
        expect(mocks.bcryptHash).not.toHaveBeenCalled();
        expect(mocks.userSave).not.toHaveBeenCalled();
    });
});
