import { describe, expect, it, vi } from 'vitest';
import subscribeNotifications from './subscribeNotifications';

const createSocket = (connected = true) => {
    const listeners = new Map();
    return {
        connected,
        emit: vi.fn(),
        on(event, handler) {
            if (!listeners.has(event)) listeners.set(event, new Set());
            listeners.get(event).add(handler);
        },
        off(event, handler) {
            listeners.get(event)?.delete(handler);
        },
        receive(event, payload) {
            for (const handler of listeners.get(event) || []) handler(payload);
        },
    };
};

describe('notification subscriptions', () => {
    it('rejoins the doctor room after reconnect and delivers each booking once', () => {
        const socket = createSocket();
        const onBooking = vi.fn();
        subscribeNotifications(socket, 'doctor', 'doctor-1', { 'booking-notification': onBooking });
        expect(socket.emit).toHaveBeenLastCalledWith('doctor-join-room', { doctorId: 'doctor-1' });
        socket.receive('connect');
        expect(socket.emit).toHaveBeenCalledTimes(2);
        expect(socket.emit).toHaveBeenLastCalledWith('doctor-join-room', { doctorId: 'doctor-1' });
        const booking = { bookingId: 'booking-1' };
        socket.receive('booking-notification', booking);
        expect(onBooking).toHaveBeenCalledExactlyOnceWith(booking);
    });

    it('waits for the initial connection and uses the patient room payload', () => {
        const socket = createSocket(false);
        subscribeNotifications(socket, 'patient', 'patient-1', {});
        expect(socket.emit).not.toHaveBeenCalled();
        socket.receive('connect');
        expect(socket.emit).toHaveBeenCalledExactlyOnceWith('user-join-room', { userId: 'patient-1' });
    });

    it('removes only its own listeners and avoids duplicates after remount', () => {
        const socket = createSocket();
        const otherListener = vi.fn();
        const oldListener = vi.fn();
        const newListener = vi.fn();
        socket.on('booking-notification', otherListener);
        const cleanup = subscribeNotifications(socket, 'doctor', 'doctor-1', { 'booking-notification': oldListener });
        cleanup();
        socket.emit.mockClear();
        socket.receive('connect');
        expect(socket.emit).not.toHaveBeenCalled();
        subscribeNotifications(socket, 'doctor', 'doctor-1', { 'booking-notification': newListener });
        socket.receive('booking-notification', {});
        expect(otherListener).toHaveBeenCalledTimes(1);
        expect(oldListener).not.toHaveBeenCalled();
        expect(newListener).toHaveBeenCalledTimes(1);
    });
});
