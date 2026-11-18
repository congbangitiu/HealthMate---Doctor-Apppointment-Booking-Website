import GuestSupportSession from '../../Models/GuestSupportSessionSchema.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import User from '../../Models/UserSchema.js';
import Doctor from '../../Models/DoctorSchema.js';
import SupportRequest from '../../Models/SupportRequestSchema.js';
import {
    getSupportAccount,
    getSupportAccess,
    hashGuestToken,
    publicSupportRequest,
} from '../../utils/supportAccess.js';

vi.mock('../../Models/GuestSupportSessionSchema.js', () => ({ default: { findOne: vi.fn() } }));
vi.mock('../../Models/UserSchema.js', () => ({ default: { findById: vi.fn() } }));
vi.mock('../../Models/DoctorSchema.js', () => ({ default: { findById: vi.fn() } }));
vi.mock('../../Models/SupportRequestSchema.js', () => ({ default: { findById: vi.fn() } }));
const id = '507f1f77bcf86cd799439011',
    other = '507f1f77bcf86cd799439012';
const query = (value) => ({ select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(value) }) });
const token = (role = 'patient', accountId = id) =>
    jwt.sign({ id: accountId, role }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
beforeEach(() => {
    GuestSupportSession.findOne.mockReturnValue(query(null));
    User.findById.mockReturnValue(query({ _id: id, fullname: 'Owner', role: 'patient' }));
    Doctor.findById.mockReturnValue(query({ _id: id, fullname: 'Doctor', role: 'doctor' }));
    SupportRequest.findById.mockReturnValue(query({ _id: other, senderId: id, senderRole: 'patient' }));
});
describe('support conversation access', () => {
    it('allows only the owning patient or a database-confirmed admin', async () => {
        expect((await getSupportAccess({ requestId: other, token: token() })).account.role).toBe('patient');
        User.findById.mockReturnValue(query({ _id: id, fullname: 'Admin', role: 'admin' }));
        expect((await getSupportAccess({ requestId: other, token: token('admin') })).account.role).toBe('admin');
    });
    it('checks doctor ownership against the doctor collection', async () => {
        SupportRequest.findById.mockReturnValue(query({ _id: other, senderId: id, senderRole: 'doctor' }));
        expect((await getSupportAccess({ requestId: other, token: token('doctor') })).account.role).toBe('doctor');
    });
    it('does not trust a token role that disagrees with the database', async () => {
        await expect(getSupportAccount(token('admin'))).rejects.toMatchObject({ code: 'forbidden' });
    });
    it('rejects expired, malformed and missing tokens', async () => {
        for (const value of [
            undefined,
            'bad',
            jwt.sign({ id, role: 'patient' }, process.env.JWT_SECRET_KEY, { expiresIn: -1 }),
        ]) {
            await expect(getSupportAccount(value)).rejects.toMatchObject({ code: 'forbidden' });
        }
    });
    it('rejects another account even if it knows the request ID', async () => {
        User.findById.mockReturnValue(query({ _id: other, fullname: 'Other', role: 'patient' }));
        await expect(getSupportAccess({ requestId: other, token: token('patient', other) })).rejects.toMatchObject({
            code: 'forbidden',
        });
    });
    it('binds a guest token to its exact request and stores only a hash', async () => {
        const guestToken = 'a'.repeat(64);
        SupportRequest.findById.mockReturnValue(
            query({ _id: other, senderRole: 'guest', fullname: 'Guest', guestAccessHash: hashGuestToken(guestToken) }),
        );
        expect(hashGuestToken(guestToken)).not.toBe(guestToken);
        expect((await getSupportAccess({ requestId: other, guestToken })).account.role).toBe('guest');
        await expect(getSupportAccess({ requestId: other, guestToken: 'b'.repeat(64) })).rejects.toMatchObject({
            code: 'forbidden',
        });
    });
    it('keeps two independent guests isolated even when both know the other request ID', async () => {
        const tokens = { [id]: 'a'.repeat(64), [other]: 'b'.repeat(64) };
        SupportRequest.findById.mockImplementation((requestId) => query({ _id: requestId, senderRole: 'guest', fullname: 'Guest', guestAccessHash: hashGuestToken(tokens[requestId]) }));
        expect((await getSupportAccess({ requestId: id, guestToken: tokens[id] })).account.role).toBe('guest');
        expect((await getSupportAccess({ requestId: other, guestToken: tokens[other] })).account.role).toBe('guest');
        await expect(getSupportAccess({ requestId: other, guestToken: tokens[id] })).rejects.toMatchObject({ code: 'forbidden' });
        await expect(getSupportAccess({ requestId: id, guestToken: tokens[other] })).rejects.toMatchObject({ code: 'forbidden' });
    });
    it('accepts a recovered guest session only when it includes this request and has not expired', async () => {
        const guestToken = 'c'.repeat(64);
        SupportRequest.findById.mockReturnValue(query({ _id: other, senderRole: 'guest', fullname: 'Recovered guest' }));
        GuestSupportSession.findOne.mockReturnValue(query({ expiresAt: new Date(Date.now() + 60000) }));
        const access = await getSupportAccess({ requestId: other, guestToken });
        expect(access.account).toMatchObject({ role: 'guest', id: null, expiresAt: expect.any(Number) });
        expect(GuestSupportSession.findOne).toHaveBeenCalledWith({ tokenHash: hashGuestToken(guestToken), requestIds: other, expiresAt: { $gt: expect.any(Date) } });
        GuestSupportSession.findOne.mockReturnValue(query(null));
        await expect(getSupportAccess({ requestId: other, guestToken })).rejects.toMatchObject({ code: 'forbidden' });
    });
    it('never exposes internal notes, email or guest access hashes to chat participants', () => {
        const value = publicSupportRequest({
            _id: id,
            message: 'Issue',
            history: [{ note: 'private' }],
            email: 'private@example.com',
            guestAccessHash: 'secret',
        });
        expect(value.history).toBeUndefined();
        expect(value.email).toBeUndefined();
        expect(value.guestAccessHash).toBeUndefined();
    });
});
