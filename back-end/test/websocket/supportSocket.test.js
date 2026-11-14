import { beforeEach, describe, expect, it, vi } from 'vitest';
import supportSocketHandler from '../../WebSocket/supportSocket.js';
import notificationSocketHandler from '../../WebSocket/notificationSocket.js';
import chatSocketHandler from '../../WebSocket/chatSocket.js';
import { getSupportAccount, getSupportAccess } from '../../utils/supportAccess.js';

vi.mock('../../utils/supportAccess.js', () => ({ getSupportAccount: vi.fn(), getSupportAccess: vi.fn() }));
let socket, handlers;
const tick = () => new Promise((resolve) => setImmediate(resolve));
beforeEach(() => {
    handlers = new Map();
    socket = {
        connected: true,
        data: {},
        rooms: new Set(),
        join: vi.fn(),
        leave: vi.fn(),
        on: (event, callback) => handlers.set(event, callback),
    };
    getSupportAccount.mockResolvedValue({ id: 'admin', role: 'admin', expiresAt: Date.now() + 60000 });
    getSupportAccess.mockResolvedValue({ request: { _id: 'request-1' }, account: { role: 'guest' } });
    supportSocketHandler({ on: (event, callback) => callback(socket) });
});
describe('authenticated support rooms', () => {
    it.each(['patient', 'doctor'])('derives the %s owner room from verified identity, ignoring supplied IDs', async (role) => {
        getSupportAccount.mockResolvedValue({ id: 'verified', role, expiresAt: Date.now() + 60000 });
        const ack = vi.fn();
        handlers.get('owner-support-subscribe')({ token: 'signed', id: 'victim', role: 'admin' }, ack);
        await tick();
        expect(socket.join).toHaveBeenCalledWith('support:owner:' + role + ':verified');
        expect(ack).toHaveBeenCalledWith({ success: true });
        handlers.get('owner-support-unsubscribe')();
        await tick();
        expect(socket.leave).toHaveBeenCalledWith('support:owner:' + role + ':verified');
    });
    it('rejects invalid owner credentials', async () => {
        getSupportAccount.mockRejectedValue(new Error('invalid'));
        const ack = vi.fn();
        handlers.get('owner-support-subscribe')({ token: 'forged' }, ack);
        await tick();
        expect(socket.join).not.toHaveBeenCalled();
        expect(ack).toHaveBeenCalledWith({ success: false });
    });
    it('checks the account and acknowledges an admin subscription', async () => {
        const ack = vi.fn();
        handlers.get('admin-support-subscribe')({ token: 'signed-token', role: 'admin' }, ack);
        await tick();
        expect(getSupportAccount).toHaveBeenCalledWith('signed-token');
        expect(socket.join).toHaveBeenCalledWith('support:admins');
        expect(ack).toHaveBeenCalledWith({ success: true });
        handlers.get('disconnect')();
    });
    it('rejects patient and forged admin subscriptions', async () => {
        getSupportAccount.mockResolvedValue({ role: 'patient' });
        const ack = vi.fn();
        handlers.get('admin-support-subscribe')({ token: 'patient', role: 'admin' }, ack);
        await tick();
        expect(socket.join).not.toHaveBeenCalled();
        expect(ack).toHaveBeenCalledWith({ success: false });
    });
    it('serializes logout after a pending subscription so it cannot remain in the admin room', async () => {
        let resolve;
        getSupportAccount.mockReturnValue(
            new Promise((done) => {
                resolve = done;
            }),
        );
        handlers.get('admin-support-subscribe')({ token: 'old' }, vi.fn());
        await tick();
        handlers.get('admin-support-unsubscribe')();
        resolve({ role: 'admin' });
        await tick();
        expect(socket.leave).toHaveBeenCalledWith('support:admins');
    });
    it('verifies request ownership before joining a support chat', async () => {
        handlers.get('support-chat-subscribe')({ requestId: 'request-1', guestToken: 'secret' }, vi.fn());
        await tick();
        expect(getSupportAccess).toHaveBeenCalledWith({ requestId: 'request-1', guestToken: 'secret' });
        expect(socket.join).toHaveBeenCalledWith('support:request:request-1');
    });
    it('does not join a conversation with invalid credentials', async () => {
        getSupportAccess.mockRejectedValue(new Error('forbidden'));
        handlers.get('support-chat-subscribe')({ requestId: 'request-1' }, vi.fn());
        await tick();
        expect(socket.join).not.toHaveBeenCalled();
    });
    it('blocks legacy room events from joining protected support namespaces', async () => {
        const io = { on: (event, callback) => callback(socket) };
        notificationSocketHandler(io);
        chatSocketHandler(io);
        handlers.get('doctor-join-room')({ doctorId: 'support:admins' });
        handlers.get('user-join-room')({ userId: 'support:request:request-1' });
        await handlers.get('join-chat')({ chatId: 'support:admins', userId: 'forged', role: 'admin' });
        expect(socket.join).not.toHaveBeenCalled();
    });
});
