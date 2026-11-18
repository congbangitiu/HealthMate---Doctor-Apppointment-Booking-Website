import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useOwnerSupportNotifications from './useOwnerSupportNotifications';

const channel = vi.hoisted(() => ({ handlers: new Map(), emit: vi.fn() }));
vi.mock('../utils/services/socket', () => ({
    default: {
        on: (event, handler) => {
            if (!channel.handlers.has(event)) channel.handlers.set(event, new Set());
            channel.handlers.get(event).add(handler);
        },
        off: (event, handler) => channel.handlers.get(event)?.delete(handler),
        emit: channel.emit,
    },
}));
vi.mock('../../config', () => ({ BASE_URL: '/api/v1' }));
let items;
beforeEach(() => {
    items = [];
    channel.handlers.clear();
    channel.emit.mockImplementation((event, payload, callback) => callback?.({ success: true }));
    vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
            ok: true,
            json: async () => ({ data: items, unreadCount: items.filter((item) => !item.isRead).length }),
        })),
    );
});
const fire = (event, data) =>
    act(async () => {
        for (const handler of channel.handlers.get(event) || []) handler(data);
    });
describe('owner support notifications', () => {
    it('still plays the live alert when HTTP returned the same update before the socket event', async () => {
        const event = { id: 'status:one', requestId: 'one', isRead: false };
        items = [event];
        const onLive = vi.fn();
        renderHook(() => useOwnerSupportNotifications('owner-token', true, onLive));
        await waitFor(() => expect(fetch).toHaveBeenCalled());
        await fire('owner-support-notification', event);
        await fire('owner-support-notification', event);
        expect(onLive).toHaveBeenCalledTimes(1);
    });
    it('updates the badge immediately even when the follow-up HTTP request fails', async () => {
        const { result } = renderHook(() => useOwnerSupportNotifications('owner-token', true, vi.fn()));
        await waitFor(() => expect(fetch).toHaveBeenCalled());
        fetch.mockRejectedValue(new Error('offline'));
        await fire('owner-support-notification', { id: 'status:one', requestId: 'one', isRead: false });
        await waitFor(() => expect(result.current.unreadCount).toBe(1));
        expect(result.current.items[0].id).toBe('status:one');
    });
    it('only clears the clicked update after its read request succeeds', async () => {
        items = [{ id: 'status:one', requestId: 'one', isRead: false }];
        const { result } = renderHook(() => useOwnerSupportNotifications('owner-token', true, vi.fn()));
        await waitFor(() => expect(result.current.unreadCount).toBe(1));
        await act(async () => {
            await result.current.markRead(items[0]);
        });
        expect(result.current.unreadCount).toBe(0);
        expect(fetch).toHaveBeenCalledWith(
            '/api/v1/contacts/my-notifications/read',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ requestId: 'one', notificationId: 'status:one' }),
            }),
        );
    });
    it('restores unread notifications from the database without playing historical alerts', async () => {
        items = [{ id: 'created:one', requestId: 'one', isRead: false }];
        const onLive = vi.fn();
        const { result } = renderHook(() => useOwnerSupportNotifications('owner-token', true, onLive));
        await waitFor(() => expect(result.current.unreadCount).toBe(1));
        expect(onLive).not.toHaveBeenCalled();
        expect(channel.emit).toHaveBeenCalledWith(
            'owner-support-subscribe',
            { token: 'owner-token' },
            expect.any(Function),
        );
    });
    it('deduplicates live alerts, refreshes counts and recovers missed notifications on reconnect', async () => {
        const onLive = vi.fn();
        const { result, unmount } = renderHook(() => useOwnerSupportNotifications('owner-token', true, onLive));
        await waitFor(() => expect(fetch).toHaveBeenCalled());
        const event = { id: 'created:one', requestId: 'one', isRead: false };
        items = [event];
        await fire('owner-support-notification', event);
        await fire('owner-support-notification', event);
        await waitFor(() => expect(result.current.unreadCount).toBe(1));
        expect(onLive).toHaveBeenCalledTimes(1);
        items = [...items, { id: 'created:two', requestId: 'two', isRead: false }];
        await fire('connect');
        await waitFor(() => expect(result.current.unreadCount).toBe(2));
        expect(onLive).toHaveBeenCalledTimes(1);
        items = items.map((item) => ({ ...item, isRead: true }));
        await fire('owner-support-changed', { reason: 'read' });
        await waitFor(() => expect(result.current.unreadCount).toBe(0));
        unmount();
        expect(channel.handlers.get('owner-support-notification').size).toBe(0);
        expect(channel.emit).toHaveBeenCalledWith('owner-support-unsubscribe');
    });
    it('does not subscribe or read data when disabled', () => {
        renderHook(() => useOwnerSupportNotifications('patient-token', false, vi.fn()));
        expect(fetch).not.toHaveBeenCalled();
        expect(channel.emit).not.toHaveBeenCalled();
    });
});
