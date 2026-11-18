import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAdminSupportNotifications from './useAdminSupportNotifications';

const channel = vi.hoisted(() => ({ handlers: new Map(), emit: vi.fn() }));
vi.mock('../utils/services/socket', () => ({ default: {
    on: (event, handler) => {
        if (!channel.handlers.has(event)) channel.handlers.set(event, new Set());
        channel.handlers.get(event).add(handler);
    },
    off: (event, handler) => channel.handlers.get(event)?.delete(handler),
    emit: channel.emit,
} }));
vi.mock('../../config', () => ({ BASE_URL: '/api/v1' }));
let items;
beforeEach(() => {
    items = [];
    channel.handlers.clear();
    channel.emit.mockImplementation((event, payload, callback) => callback?.({ success: true }));
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ data: items, unreadCount: items.filter((item) => !item.isRead).length }) })));
});
const fire = (event, data) => act(async () => { for (const handler of channel.handlers.get(event) || []) handler(data); });
describe('admin support notifications', () => {
    it('restores unread notifications from the database without playing historical alerts', async () => {
        items = [{ id: 'created:one', requestId: 'one', isRead: false }];
        const onLive = vi.fn();
        const { result } = renderHook(() => useAdminSupportNotifications('admin-token', true, onLive));
        await waitFor(() => expect(result.current.unreadCount).toBe(1));
        expect(onLive).not.toHaveBeenCalled();
        expect(channel.emit).toHaveBeenCalledWith('admin-support-subscribe', { token: 'admin-token' }, expect.any(Function));
    });
    it('deduplicates live alerts, refreshes counts and recovers missed notifications on reconnect', async () => {
        const onLive = vi.fn();
        const { result, unmount } = renderHook(() => useAdminSupportNotifications('admin-token', true, onLive));
        await waitFor(() => expect(fetch).toHaveBeenCalled());
        const event = { id: 'created:one', requestId: 'one', isRead: false };
        items = [event];
        await fire('support-notification', event);
        await fire('support-notification', event);
        await waitFor(() => expect(result.current.unreadCount).toBe(1));
        expect(onLive).toHaveBeenCalledTimes(1);
        items = [...items, { id: 'created:two', requestId: 'two', isRead: false }];
        await fire('connect');
        await waitFor(() => expect(result.current.unreadCount).toBe(2));
        expect(onLive).toHaveBeenCalledTimes(1);
        items = items.map((item) => ({ ...item, isRead: true }));
        await fire('support-requests-changed', { reason: 'read' });
        await waitFor(() => expect(result.current.unreadCount).toBe(0));
        unmount();
        expect(channel.handlers.get('support-notification').size).toBe(0);
        expect(channel.emit).toHaveBeenCalledWith('admin-support-unsubscribe');
    });
    it('does not subscribe or read admin data for a normal user', () => {
        renderHook(() => useAdminSupportNotifications('patient-token', false, vi.fn()));
        expect(fetch).not.toHaveBeenCalled();
        expect(channel.emit).not.toHaveBeenCalled();
    });
});
