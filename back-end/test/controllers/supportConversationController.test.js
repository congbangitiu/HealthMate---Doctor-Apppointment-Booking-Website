import { beforeEach, describe, expect, it, vi } from 'vitest';
import SupportRequest from '../../Models/SupportRequestSchema.js';
import SupportMessage from '../../Models/SupportMessageSchema.js';
import { getSupportAccess, getSupportAccount } from '../../utils/supportAccess.js';
import { getSupportConversation, sendSupportMessage, ownSupportRequests } from '../../Controllers/supportConversationController.js';

vi.mock('../../Models/SupportRequestSchema.js', () => ({ default: { findByIdAndUpdate: vi.fn(), find: vi.fn() } }));
vi.mock('../../Models/SupportMessageSchema.js', () => ({
    default: { find: vi.fn(), findOne: vi.fn(), create: vi.fn(), countDocuments: vi.fn() },
}));
vi.mock('../../utils/supportAccess.js', () => ({
    getSupportAccess: vi.fn(),
    getSupportAccount: vi.fn(),
    supportCredentials: (req) => ({ requestId: req.params.id }),
    publicSupportRequest: (request) => ({ _id: request._id, message: request.message }),
}));
const id = '507f1f77bcf86cd799439011',
    messageId = '507f1f77bcf86cd799439012';
const request = {
    _id: id,
    fullname: 'Patient',
    message: 'Original issue',
    category: 'technical',
    createdAt: new Date(),
};
const message = {
    _id: messageId,
    request: id,
    senderKey: 'patient:owner',
    senderRole: 'patient',
    senderId: 'owner',
    senderName: 'Patient',
    content: 'More details',
    createdAt: new Date(),
};
let io;
const call = async (handler, overrides = {}) => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    await handler(
        {
            params: { id },
            headers: {},
            query: {},
            body: { content: 'More details', clientId: 'nonce-1234567890123456' },
            io,
            ...overrides,
        },
        res,
    );
    return res;
};
beforeEach(() => {
    io = { to: vi.fn().mockReturnThis(), emit: vi.fn() };
    getSupportAccess.mockResolvedValue({
        request,
        account: { id: 'owner', role: 'patient', fullname: 'Patient' },
        senderKey: 'patient:owner',
    });
    SupportMessage.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
    SupportMessage.countDocuments.mockResolvedValue(0);
    SupportMessage.create.mockResolvedValue({ toObject: () => message });
    SupportRequest.findByIdAndUpdate.mockReturnValue({
        lean: vi
            .fn()
            .mockResolvedValue({ ...request, notificationId: 'message:' + messageId, notificationKind: 'message' }),
    });
});
describe('support conversations', () => {
    it('returns a bounded plain-text preview only for the authenticated account list', async () => {
        getSupportAccount.mockResolvedValue({ id: 'owner', role: 'patient' });
        const chain = { select: vi.fn().mockReturnThis(), sort: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(),
            lean: vi.fn().mockResolvedValue([{ _id: id, message: 'Help\n\n with   booking ' + 'x'.repeat(300) }]) };
        SupportRequest.find.mockReturnValue(chain);
        const res = await call(ownSupportRequests);
        expect(SupportRequest.find).toHaveBeenCalledWith({ senderId: 'owner', senderRole: 'patient' });
        const item = res.json.mock.calls[0][0].data[0];
        expect(item.preview).toHaveLength(180);
        expect(item.preview).toMatch(/^Help with booking /);
        expect(item.message).toBeUndefined();
    });
    it.each(['patient', 'doctor'])('notifies the %s request owner after persisting an admin reply', async (role) => {
        const owned = { ...request, senderId: 'owner', senderRole: role };
        getSupportAccess.mockResolvedValue({ request: owned, account: { id: 'admin', role: 'admin', fullname: 'Admin' }, senderKey: 'admin:admin' });
        SupportRequest.findByIdAndUpdate.mockImplementation((id, update) => ({ lean: vi.fn().mockResolvedValue({ ...owned, ...update.$set }) }));
        const res = await call(sendSupportMessage);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(io.to).toHaveBeenCalledWith('support:owner:' + role + ':owner');
        expect(io.emit).toHaveBeenCalledWith('owner-support-notification', expect.objectContaining({ kind: 'message', isRead: false }));
        expect(io.to).not.toHaveBeenCalledWith('support:admins');
    });
    it('fetches missed messages after the last received ID in ascending order', async () => {
        const chain = {
            sort: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            lean: vi.fn().mockResolvedValue([message]),
        };
        SupportMessage.find.mockReturnValue(chain);
        const res = await call(getSupportConversation, { query: { after: id } });
        expect(SupportMessage.find).toHaveBeenCalledWith({ request: id, _id: { $gt: id } });
        expect(chain.sort).toHaveBeenCalledWith({ _id: 1 });
        expect(res.json.mock.calls[0][0].data.messages).toEqual([message]);
    });

    it('persists a message, then notifies admin and authorized conversation rooms', async () => {
        const res = await call(sendSupportMessage);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(SupportMessage.create).toHaveBeenCalledWith(
            expect.objectContaining({ senderId: 'owner', senderRole: 'patient' }),
        );
        expect(io.to).toHaveBeenCalledWith('support:admins');
        expect(io.to).toHaveBeenCalledWith('support:request:' + id);
        expect(res.json.mock.calls[0][0].data.senderKey).toBeUndefined();
        expect(SupportRequest.findByIdAndUpdate.mock.calls[0][1].$set.readBy).toEqual([]);
    });
    it('returns an already-sent message for the same client nonce without duplicating notifications', async () => {
        SupportMessage.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(message) });
        const res = await call(sendSupportMessage);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(SupportMessage.create).not.toHaveBeenCalled();
        expect(io.emit).not.toHaveBeenCalled();
    });
    it('keeps message success when Socket.IO fails', async () => {
        io.to.mockImplementation(() => {
            throw new Error('transport down');
        });
        const res = await call(sendSupportMessage);
        expect(res.status).toHaveBeenCalledWith(201);
    });
    it('keeps a persisted message successful when its notification update fails', async () => {
        SupportRequest.findByIdAndUpdate.mockReturnValue({
            lean: vi.fn().mockRejectedValue(new Error('temporary database error')),
        });
        const res = await call(sendSupportMessage);
        expect(res.status).toHaveBeenCalledWith(201);
    });
    it('does not create admin notifications for an admin reply', async () => {
        getSupportAccess.mockResolvedValue({
            request,
            account: { id: 'admin', role: 'admin', fullname: 'Admin' },
            senderKey: 'admin:admin',
        });
        await call(sendSupportMessage);
        expect(SupportRequest.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(io.to).not.toHaveBeenCalledWith('support:admins');
    });
    it('rejects unauthorized messages before writing or joining', async () => {
        getSupportAccess.mockRejectedValue(Object.assign(new Error('forbidden'), { status: 403, code: 'forbidden' }));
        const res = await call(sendSupportMessage);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(SupportMessage.create).not.toHaveBeenCalled();
    });
    it.each([
        { content: ' ', clientId: 'nonce-1234567890123456' },
        { content: 'x'.repeat(3001), clientId: 'nonce-1234567890123456' },
        { content: 'hello', clientId: 'bad' },
    ])('validates chat input', async (body) => {
        const res = await call(sendSupportMessage, { body });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(SupportMessage.create).not.toHaveBeenCalled();
    });
    it('rate limits messages per participant and request', async () => {
        SupportMessage.countDocuments.mockResolvedValue(30);
        const res = await call(sendSupportMessage);
        expect(res.status).toHaveBeenCalledWith(429);
    });
    it('loads bounded history and uses a cursor to fetch earlier messages', async () => {
        const chain = {
            sort: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            lean: vi.fn().mockResolvedValue([message]),
        };
        SupportMessage.find.mockReturnValue(chain);
        const res = await call(getSupportConversation, { query: { before: messageId } });
        expect(SupportMessage.find).toHaveBeenCalledWith({ request: id, _id: { $lt: messageId } });
        expect(chain.limit).toHaveBeenCalledWith(51);
        expect(res.json.mock.calls[0][0].data).toMatchObject({ hasMore: false, messages: [message] });
    });
});
