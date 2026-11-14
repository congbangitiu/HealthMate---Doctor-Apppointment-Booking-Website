import { beforeEach, describe, expect, it, vi } from 'vitest';
import SupportRequest from '../../Models/SupportRequestSchema.js';
import { getSupportNotifications } from '../../Controllers/supportNotificationsController.js';

vi.mock('../../Models/SupportRequestSchema.js', () => ({ default: { find: vi.fn(), countDocuments: vi.fn() } }));
const id = '507f1f77bcf86cd799439011';
beforeEach(() => {
    const chain = {
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi
            .fn()
            .mockResolvedValue([
                {
                    _id: id,
                    fullname: 'Sender',
                    category: 'technical',
                    createdAt: new Date(),
                    readBy: ['admin-1'],
                    history: [{ note: 'Internal' }],
                    guestAccessHash: 'private',
                },
            ]),
    };
    SupportRequest.find.mockReturnValue(chain);
    SupportRequest.countDocuments.mockResolvedValue(7);
});
describe('durable admin support feed', () => {
    it('returns per-admin read state and a full unread count independent of the latest feed limit', async () => {
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
        await getSupportNotifications({ userId: 'admin-1' }, res);
        expect(SupportRequest.countDocuments).toHaveBeenCalledWith({ readBy: { $ne: 'admin-1' } });
        expect(res.json.mock.calls[0][0]).toMatchObject({ unreadCount: 7, data: [{ requestId: id, isRead: true }] });
        expect(res.json.mock.calls[0][0].data[0].history).toBeUndefined();
        expect(res.json.mock.calls[0][0].data[0].guestAccessHash).toBeUndefined();
    });
});
