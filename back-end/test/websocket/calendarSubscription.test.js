import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import notificationSocketHandler from '../../WebSocket/notificationSocket.js';

let socket;
let handlers;
beforeEach(() => {
    handlers = new Map();
    socket = { data: {}, on: vi.fn((name, handler) => handlers.set(name, handler)), join: vi.fn(), leave: vi.fn() };
    notificationSocketHandler({ on: (_, connected) => connected(socket) });
});
describe('authenticated calendar subscription', () => {
    it('derives the room from a valid token and ignores a supplied user ID', async () => {
        const token = jwt.sign({ id: 'doctor-one', role: 'doctor' }, process.env.JWT_SECRET_KEY);
        const ack = vi.fn();
        await handlers.get('calendar-subscribe')({ token, userId: 'another-doctor' }, ack);
        expect(socket.join).toHaveBeenCalledExactlyOnceWith('calendar:doctor:doctor-one');
        expect(ack).toHaveBeenCalledWith({ success: true });
    });
    it.each(['invalid', jwt.sign({ id: 'one', role: 'admin' }, 'unit-test-secret')])(
        'rejects invalid or unauthorized subscription',
        async (token) => {
            const ack = vi.fn();
            await handlers.get('calendar-subscribe')({ token }, ack);
            expect(socket.join).not.toHaveBeenCalled();
            expect(ack).toHaveBeenCalledWith({ success: false });
        },
    );
    it('leaves the previous calendar room on account change or unsubscribe', async () => {
        socket.data.calendarRoom = 'calendar:patient:old-account';
        const token = jwt.sign({ id: 'new-account', role: 'patient' }, process.env.JWT_SECRET_KEY);
        await handlers.get('calendar-subscribe')({ token });
        expect(socket.leave).toHaveBeenCalledWith('calendar:patient:old-account');
        await handlers.get('calendar-unsubscribe')();
        expect(socket.leave).toHaveBeenCalledWith('calendar:patient:new-account');
        expect(socket.data.calendarRoom).toBeUndefined();
    });
});
