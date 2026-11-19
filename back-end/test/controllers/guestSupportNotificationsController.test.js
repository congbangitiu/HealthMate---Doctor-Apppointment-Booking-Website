import { beforeEach, describe, expect, it, vi } from 'vitest';
import SupportRequest from '../../Models/SupportRequestSchema.js';
import User from '../../Models/UserSchema.js';
import { getSupportAccess } from '../../utils/supportAccess.js';
import {
    getGuestSupportNotifications,
    readGuestSupportNotification,
} from '../../Controllers/guestSupportNotificationsController.js';
vi.mock('../../Models/SupportRequestSchema.js', () => ({ default: { updateOne: vi.fn() } }));
vi.mock('../../Models/UserSchema.js', () => ({ default: { find: vi.fn() } }));
vi.mock('../../utils/supportAccess.js', () => ({
    getSupportAccess: vi.fn(),
    supportCredentials: (req) => ({ requestId: req.params.id, guestToken: req.headers['x-support-token'] }),
    supportError: (code, status = 403) => Object.assign(new Error(code), { code, status }),
}));
const row = {
    _id: 'request-a',
    senderRole: 'guest',
    guestAccessHash: 'private-hash',
    fullname: 'Guest A',
    email: 'private',
    history: [{ note: 'private-note' }],
    message: 'Help\n  with booking',
    category: 'technical',
    status: 'resolved',
    createdAt: '2026-11-15T10:00:00Z',
    ownerNotificationId: 'status:a',
    ownerNotificationAt: '2026-11-15T11:00:00Z',
    ownerNotificationKind: 'status',
    ownerNotificationActorId: 'admin',
    ownerNotificationStatus: 'resolved',
    ownerNotificationRead: false,
};
let io;
const call = async (handler, body = {}, headers = {}) => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    await handler({ body, headers, params: { id: 'request-a' }, io }, res);
    return res;
};
beforeEach(() => {
    io = { to: vi.fn().mockReturnThis(), emit: vi.fn() };
    User.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([{ _id: 'admin', fullname: 'Admin One', photo: '/admin.png' }]),
        }),
    });
    SupportRequest.updateOne.mockResolvedValue({ modifiedCount: 1 });
    getSupportAccess.mockImplementation(async ({ requestId, guestToken }) => {
        if (requestId !== 'request-a' || guestToken !== 'secret-a')
            throw Object.assign(new Error('forbidden'), { status: 403 });
        return { request: row, account: { role: 'guest' } };
    });
});
describe('guest support notifications', () => {
    it('restores only capability-proven requests and returns safe summaries with the admin avatar', async () => {
        const res = await call(getGuestSupportNotifications, {
            requests: [
                { requestId: 'request-a', guestToken: 'secret-a' },
                { requestId: 'request-b', guestToken: 'secret-a' },
                { requestId: 'request-a', guestToken: 'secret-a' },
            ],
        });
        const body = res.json.mock.calls[0][0];
        expect(body.unreadCount).toBe(1);
        expect(body.data).toHaveLength(1);
        expect(body.data[0]).toMatchObject({
            requestId: 'request-a',
            type: 'support-update',
            actorName: 'Admin One',
            photo: '/admin.png',
            isRead: false,
        });
        expect(body.requests).toEqual([
            expect.objectContaining({ _id: 'request-a', preview: 'Help with booking', status: 'resolved' }),
        ]);
        const serialized = JSON.stringify(body);
        for (const secret of ['private-hash', 'private-note', 'secret-a', 'guestAccessHash'])
            expect(serialized).not.toContain(secret);
    });
    it('does not reveal anything with only a request ID or another guest token', async () => {
        const res = await call(getGuestSupportNotifications, {
            requests: [{ requestId: 'request-a' }, { requestId: 'request-a', guestToken: 'secret-b' }],
        });
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: [],
            requests: [],
            unreadCount: 0,
            unavailableRequestIds: ['request-a'],
        });
    });
    it('does not treat a verified signed-in identity as a guest capability', async () => {
        getSupportAccess.mockResolvedValue({ request: row, account: { role: 'admin' } });
        const res = await call(getGuestSupportNotifications, {
            requests: [{ requestId: 'request-a', guestToken: 'secret-a' }],
        });
        expect(res.json.mock.calls[0][0].requests).toEqual([]);
    });
    it.each([{}, { requests: Array(101).fill({}) }])('rejects malformed or oversized batches', async (body) => {
        const res = await call(getGuestSupportNotifications, body);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(getSupportAccess).not.toHaveBeenCalled();
    });
    it('preserves an error rather than claiming success if the database is unavailable', async () => {
        getSupportAccess.mockRejectedValue(new Error('database unavailable'));
        const res = await call(getGuestSupportNotifications, { requests: [{ requestId: 'request-a' }] });
        expect(res.status).toHaveBeenCalledWith(500);
    });
    it('checks the token and exact notification version before marking read and emits only to this guest', async () => {
        await call(readGuestSupportNotification, { notificationId: 'status:old' }, { 'x-support-token': 'secret-a' });
        expect(getSupportAccess).toHaveBeenCalledWith({ requestId: 'request-a', guestToken: 'secret-a' });
        expect(SupportRequest.updateOne).toHaveBeenCalledWith(
            {
                _id: 'request-a',
                senderRole: 'guest',
                guestAccessHash: 'private-hash',
                ownerNotificationId: 'status:old',
                ownerNotificationRead: false,
            },
            { $set: { ownerNotificationRead: true } },
            { timestamps: false },
        );
        expect(io.to).toHaveBeenCalledWith('support:guest:request-a');
    });
    it('does not clear another guest notification with a wrong token', async () => {
        const res = await call(
            readGuestSupportNotification,
            { notificationId: 'status:a' },
            { 'x-support-token': 'secret-b' },
        );
        expect(res.status).toHaveBeenCalledWith(403);
        expect(SupportRequest.updateOne).not.toHaveBeenCalled();
    });
});
