import { beforeEach, describe, expect, it, vi } from 'vitest';
import SupportRequest from '../../Models/SupportRequestSchema.js';
import User from '../../Models/UserSchema.js';
import { listSupportRequests, getSupportRequest, readSupportRequest, updateSupportRequest } from '../../Controllers/supportManagementController.js';

vi.mock('../../Models/SupportRequestSchema.js', () => ({
    default: { find: vi.fn(), countDocuments: vi.fn(), findById: vi.fn(), findByIdAndUpdate: vi.fn(), findOneAndUpdate: vi.fn() },
    supportStatuses: ['new', 'in-progress', 'resolved', 'spam'],
}));
vi.mock('../../Models/UserSchema.js', () => ({ default: { findById: vi.fn() } }));
const requestId = '507f1f77bcf86cd799439011', adminId = '507f1f77bcf86cd799439012';
const document = { _id: requestId, status: 'new', __v: 0, readBy: [], history: [], assignee: null, submissionIp: 'hidden-hash' };
let query;
const call = async (handler, changes = {}) => {
    const req = { params: { id: requestId }, userId: adminId, query: {}, body: {}, ...changes };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    await handler(req, res);
    return res;
};
beforeEach(() => {
    query = { select: vi.fn().mockReturnThis(), sort: vi.fn().mockReturnThis(), skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(), lean: vi.fn().mockResolvedValue([document]) };
    SupportRequest.find.mockReturnValue(query);
    SupportRequest.countDocuments.mockResolvedValue(1);
    SupportRequest.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue(document) });
    SupportRequest.findByIdAndUpdate.mockReturnValue({ lean: vi.fn().mockResolvedValue({ ...document, readBy: [adminId] }) });
    SupportRequest.findOneAndUpdate.mockReturnValue({ lean: vi.fn().mockResolvedValue({ ...document, __v: 1 }) });
    User.findById.mockReturnValue({ select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue({ fullname: 'Admin One' }) }) });
});
describe('support management', () => {
    it('saves an owner notification atomically with a status change and emits only to its owner room', async () => {
        const owned = { ...document, senderRole: 'doctor', senderId: adminId, category: 'technical' };
        SupportRequest.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue(owned) });
        SupportRequest.findOneAndUpdate.mockImplementation((filter, update) => ({ lean: vi.fn().mockResolvedValue({ ...owned, ...update.$set }) }));
        const io = { to: vi.fn().mockReturnThis(), emit: vi.fn() };
        await call(updateSupportRequest, { body: { version: 0, status: 'resolved' }, io });
        const changes = SupportRequest.findOneAndUpdate.mock.calls[0][1].$set;
        expect(changes).toMatchObject({ status: 'resolved', ownerNotificationRead: false, ownerNotificationKind: 'status', ownerNotificationStatus: 'resolved' });
        expect(io.to).toHaveBeenCalledWith('support:owner:doctor:' + adminId);
        expect(io.emit).toHaveBeenCalledWith('owner-support-notification', expect.objectContaining({ type: 'support-update', supportStatus: 'resolved' }));
    });
    it('does not notify the sender about an internal note', async () => {
        const io = { to: vi.fn().mockReturnThis(), emit: vi.fn() };
        await call(updateSupportRequest, { body: { version: 0, note: 'Internal only' }, io });
        expect(SupportRequest.findOneAndUpdate.mock.calls[0][1].$set.ownerNotificationId).toBeUndefined();
        expect(io.emit.mock.calls.some(([event]) => event === 'owner-support-notification')).toBe(false);
    });
    it('paginates and combines status, escaped search and inclusive Vietnam date filters', async () => {
        const res = await call(listSupportRequests, { query: { q: 'a+b', status: 'new', from: '2026-10-01', to: '2026-10-31', page: '2', limit: '10' } });
        const filter = SupportRequest.find.mock.calls[0][0];
        expect(filter.status).toBe('new');
        expect(filter.$or[0].fullname.test('a+b')).toBe(true);
        expect(filter.$or[0].fullname.test('aaab')).toBe(false);
        expect(filter.createdAt.$gte.toISOString()).toBe('2026-09-30T17:00:00.000Z');
        expect(filter.createdAt.$lt.toISOString()).toBe('2026-10-31T17:00:00.000Z');
        expect(query.skip).toHaveBeenCalledWith(10);
        const data = res.json.mock.calls[0][0].data[0];
        expect(data.submissionIp).toBeUndefined();
        expect(data.readBy).toBeUndefined();
        expect(data.isRead).toBe(false);
    });
    it('supports exact full request ID lookup', async () => {
        await call(listSupportRequests, { query: { q: requestId } });
        expect(SupportRequest.find.mock.calls[0][0].$or).toContainEqual({ _id: requestId });
    });
    it.each([{ from: '2026-02-30' }, { from: '2026-10-31', to: '2026-10-01' },
        { status: 'invalid' }, { limit: '10000' }, { page: '-1' }])('rejects malformed filters', async (filters) => {
        const res = await call(listSupportRequests, { query: filters });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(SupportRequest.find).not.toHaveBeenCalled();
    });
    it('marks read per admin without resolving or changing the version', async () => {
        const res = await call(readSupportRequest);
        expect(SupportRequest.findByIdAndUpdate).toHaveBeenCalledWith(requestId,
            { $addToSet: { readBy: adminId } }, { new: true, timestamps: false });
        expect(res.json.mock.calls[0][0].data).toMatchObject({ status: 'new', __v: 0, isRead: true });
    });
    it('returns not found for a removed request', async () => {
        SupportRequest.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
        const res = await call(getSupportRequest);
        expect(res.status).toHaveBeenCalledWith(404);
    });
    it('rejects an invalid ID before querying the database', async () => {
        const res = await call(getSupportRequest, { params: { id: 'bad' } });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(SupportRequest.findById).not.toHaveBeenCalled();
    });
    it('atomically saves status and an internal note with server-owned actor information', async () => {
        await call(updateSupportRequest, { body: { version: 0, status: 'resolved', note: ' Fixed ', actorName: 'Forged' } });
        const [filter, update] = SupportRequest.findOneAndUpdate.mock.calls[0];
        expect(filter).toEqual({ _id: requestId, __v: 0 });
        expect(update.$set).toEqual({ status: 'resolved' });
        expect(update.$inc).toEqual({ __v: 1 });
        expect(update.$push.history.$each).toEqual([
            expect.objectContaining({ type: 'status', from: 'new', to: 'resolved', actorId: adminId, actorName: 'Admin One' }),
            expect.objectContaining({ type: 'note', note: 'Fixed', actorName: 'Admin One' }),
        ]);
    });
    it('allows claiming an unassigned request', async () => {
        await call(updateSupportRequest, { body: { version: 0, assignment: 'claim' } });
        expect(SupportRequest.findOneAndUpdate.mock.calls[0][1].$set.assignee).toEqual({ id: adminId, fullname: 'Admin One' });
    });
    it('prevents taking or releasing another admin assignment', async () => {
        SupportRequest.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue({ ...document, assignee: { id: 'another-admin' } }) });
        const res = await call(updateSupportRequest, { body: { version: 0, assignment: 'release' } });
        expect(res.json).toHaveBeenCalledWith({ success: false, code: 'alreadyAssigned' });
        expect(SupportRequest.findOneAndUpdate).not.toHaveBeenCalled();
    });
    it('rejects stale versions and races without overwriting another admin', async () => {
        let res = await call(updateSupportRequest, { body: { version: 1, status: 'resolved' } });
        expect(res.status).toHaveBeenCalledWith(409);
        expect(SupportRequest.findOneAndUpdate).not.toHaveBeenCalled();
        SupportRequest.findOneAndUpdate.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
        res = await call(updateSupportRequest, { body: { version: 0, status: 'resolved' } });
        expect(res.status).toHaveBeenCalledWith(409);
    });
    it.each([{ version: 0, status: 'done' }, { version: 0, note: ' ' }, { version: 0, note: 'a'.repeat(2001) },
        { status: 'resolved' }, { version: 0 }, { version: 0, assignment: 'other-admin' }])('rejects invalid updates', async (body) => {
        const res = await call(updateSupportRequest, { body });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(SupportRequest.findOneAndUpdate).not.toHaveBeenCalled();
    });
});
