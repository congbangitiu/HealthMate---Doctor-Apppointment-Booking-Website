import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';

vi.mock('../../Models/UserSchema.js', () => ({
    default: {
        findById: vi.fn(),
    },
}));

vi.mock('../../Models/DoctorSchema.js', () => ({
    default: {
        findById: vi.fn(),
    },
}));

import User from '../../Models/UserSchema.js';
import Doctor from '../../Models/DoctorSchema.js';
import { authenticate, restrict } from '../../auth/verifyToken.js';

const createResponse = () => {
    const res = {};
    res.status = vi.fn(() => res);
    res.json = vi.fn(() => res);
    return res;
};

describe('authenticate', () => {
    beforeEach(() => {
        process.env.JWT_SECRET_KEY = 'unit-test-secret';
    });

    it.each([
        ['the authorization header is missing', undefined],
        ['the basic authentication is used', 'Basic abc'],
    ])('BE-A01: returns 401 when %s', async (_description, authorization) => {
        const req = { headers: {} };
        if (authorization !== undefined) req.headers.authorization = authorization;
        const res = createResponse();
        const next = vi.fn();

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'No token, authorization is denied',
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('BE-A02: attaches userId and userRole when the access token is valid', async () => {
        const token = jwt.sign(
            { id: 'patient-test-id', role: 'patient' },
            process.env.JWT_SECRET_KEY,
            { expiresIn: '1h' },
        );
        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = createResponse();
        const next = vi.fn();

        await authenticate(req, res, next);

        expect(req.userId).toBe('patient-test-id');
        expect(req.userRole).toBe('patient');
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    it('BE-A03: returns 401 with a specific message when the token has expired', async () => {
        const token = jwt.sign(
            { id: 'patient-test-id', role: 'patient' },
            process.env.JWT_SECRET_KEY,
            { expiresIn: -1 },
        );
        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = createResponse();
        const next = vi.fn();

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Token is expired' });
        expect(next).not.toHaveBeenCalled();
    });

    it.each([
        ['has an invalid signature', () => jwt.sign({ id: 'patient-test-id', role: 'patient' }, 'wrong-secret')],
        ['is malformed', () => 'not-a-jwt'],
        ['is empty after the Bearer scheme', () => ''],
    ])('BE-A04: returns 401 when the token %s', async (_description, createToken) => {
        const req = { headers: { authorization: `Bearer ${createToken()}` } };
        const res = createResponse();
        const next = vi.fn();

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Invalid token',
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('BE-A05: rejects a password reset token used as an access token', async () => {
        const resetToken = jwt.sign(
            { email: 'patient@example.test', model: 'User', resetId: 'reset-id' },
            `${process.env.JWT_SECRET_KEY}-reset-password`,
            { expiresIn: '10m' },
        );
        const req = { headers: { authorization: `Bearer ${resetToken}` } };
        const res = createResponse();
        const next = vi.fn();

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Invalid token',
        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe('restrict', () => {
    beforeEach(() => {
        User.findById.mockReset();
        Doctor.findById.mockReset();
    });

    it('BE-A06: allows a patient to continue when the role is permitted', async () => {
        User.findById.mockResolvedValue({ _id: 'patient-id', role: 'patient' });
        const req = { userId: 'patient-id' };
        const res = createResponse();
        const next = vi.fn();

        await restrict(['patient'])(req, res, next);

        expect(User.findById).toHaveBeenCalledWith('patient-id');
        expect(Doctor.findById).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('BE-A07: finds the doctor and continues when no patient has the given id', async () => {
        User.findById.mockResolvedValue(null);
        Doctor.findById.mockResolvedValue({ _id: 'doctor-id', role: 'doctor' });
        const req = { userId: 'doctor-id' };
        const res = createResponse();
        const next = vi.fn();

        await restrict(['doctor'])(req, res, next);

        expect(User.findById).toHaveBeenCalledWith('doctor-id');
        expect(Doctor.findById).toHaveBeenCalledWith('doctor-id');
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('BE-A08: rejects an account whose role is not permitted', async () => {
        User.findById.mockResolvedValue({ _id: 'patient-id', role: 'patient' });
        const req = { userId: 'patient-id' };
        const res = createResponse();
        const next = vi.fn();

        await restrict(['doctor', 'admin'])(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'You are not authorized',
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('BE-A09: rejects cleanly when the account no longer exists', async () => {
        User.findById.mockResolvedValue(null);
        Doctor.findById.mockResolvedValue(null);
        const req = { userId: 'deleted-account-id' };
        const res = createResponse();
        const next = vi.fn();

        await restrict(['patient', 'doctor'])(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'You are not authorized',
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('BE-A10: forwards database query errors to the error middleware', async () => {
        const databaseError = new Error('database unavailable');
        User.findById.mockRejectedValue(databaseError);
        const req = { userId: 'patient-id' };
        const res = createResponse();
        const next = vi.fn();

        await restrict(['patient'])(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(databaseError);
        expect(Doctor.findById).not.toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });
});
