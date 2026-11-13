import { beforeEach, describe, expect, it, vi } from 'vitest';
import SupportRequest from '../../Models/SupportRequestSchema.js';
import { getSupportAccount } from '../../utils/supportAccess.js';
import { getOwnerSupportNotifications, readOwnerSupportNotification } from '../../Controllers/ownerSupportNotificationsController.js';
vi.mock('../../Models/SupportRequestSchema.js', () => ({ default: { find: vi.fn(), countDocuments: vi.fn(), updateOne: vi.fn() } }));
vi.mock('../../utils/supportAccess.js', () => ({
    getSupportAccount: vi.fn(), supportCredentials: (req) => ({ token: req.headers.authorization }),
    supportError: (code) => Object.assign(new Error(code), { code, status: 403 }),
}));
const id = '507f1f77bcf86cd799439011';
const call = async (handler, body = {}) => {
    const res = { json: vi.fn().mockReturnThis(), status: vi.fn().mockReturnThis() };
    await handler({ headers: { authorization: 'token' }, body, io: { to: vi.fn().mockReturnThis(), emit: vi.fn() } }, res);
    return res;
};
beforeEach(() => {
    getSupportAccount.mockResolvedValue({ id: 'owner', role: 'patient' });
    const chain = { select: vi.fn().mockReturnThis(), sort: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), lean: vi.fn().mockResolvedValue([
        { _id: id, category: 'technical', ownerNotificationId: 'status:1', ownerNotificationKind: 'status', ownerNotificationStatus: 'resolved', ownerNotificationRead: false, history: [{ note: 'private' }] },
    ]) };
    SupportRequest.find.mockReturnValue(chain);
    SupportRequest.countDocuments.mockResolvedValue(2);
    SupportRequest.updateOne.mockResolvedValue({ modifiedCount: 1 });
});
describe('signed-in sender support notifications', () => {
    it.each(['patient', 'doctor'])('restores only the authenticated %s feed and unread count', async (role) => {
        getSupportAccount.mockResolvedValue({ id: 'owner', role });
        const res = await call(getOwnerSupportNotifications);
        expect(SupportRequest.find).toHaveBeenCalledWith(expect.objectContaining({ senderId: 'owner', senderRole: role }));
        expect(SupportRequest.countDocuments).toHaveBeenCalledWith(expect.objectContaining({ senderId: 'owner', ownerNotificationRead: false }));
        expect(res.json.mock.calls[0][0]).toMatchObject({ unreadCount: 2, data: [{ type: 'support-update', isRead: false, supportStatus: 'resolved' }] });
        expect(res.json.mock.calls[0][0].data[0].history).toBeUndefined();
    });
    it('matches ownership and exact notification ID so stale reads cannot clear a new update', async () => {
        await call(readOwnerSupportNotification, { requestId: id, notificationId: 'status:old', senderId: 'victim' });
        expect(SupportRequest.updateOne).toHaveBeenCalledWith({ _id: id, senderId: 'owner', senderRole: 'patient', ownerNotificationId: 'status:old', ownerNotificationRead: false },
            { $set: { ownerNotificationRead: true } }, { timestamps: false });
    });
    it('rejects unauthenticated requests before querying', async () => {
        getSupportAccount.mockRejectedValue(Object.assign(new Error('forbidden'), { status: 401 }));
        const res = await call(getOwnerSupportNotifications);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(SupportRequest.find).not.toHaveBeenCalled();
    });
});
