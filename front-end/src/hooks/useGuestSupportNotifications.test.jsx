import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useGuestSupportNotifications from './useGuestSupportNotifications';
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
const requests = [{ id: 'a', guestToken: 'secret-a' }];
const notice = { id: 'status:one', requestId: 'a', createdAt: '2026-11-15T10:00:00Z', isRead: false };
let items;
const fire = (event, data) =>
    act(async () => {
        for (const handler of channel.handlers.get(event) || []) handler(data);
    });
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
describe('guest support notifications', () => {
    it('restores the feed silently and sends capabilities in a body, never in the URL', async () => {
        items = [notice];
        const live = vi.fn();
        const { result } = renderHook(() => useGuestSupportNotifications(requests, true, live));
        await waitFor(() => expect(result.current.unreadCount).toBe(1));
        expect(live).not.toHaveBeenCalled();
        expect(fetch).toHaveBeenCalledWith(
            '/api/v1/contacts/guest-notifications',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ requests: [{ requestId: 'a', guestToken: 'secret-a' }] }),
            }),
        );
        expect(fetch.mock.calls.every(([url]) => !url.includes('secret-a'))).toBe(true);
        expect(channel.emit).toHaveBeenCalledWith(
            'guest-support-subscribe',
            { requests: [{ requestId: 'a', guestToken: 'secret-a' }] },
            expect.any(Function),
        );
    });
    it('updates the badge and plays one alert for live delivery, ignoring another guest and duplicate events', async () => {
        const live = vi.fn();
        const { result } = renderHook(() => useGuestSupportNotifications(requests, true, live));
        await waitFor(() => expect(fetch).toHaveBeenCalled());
        await fire('guest-support-notification', { ...notice, requestId: 'b' });
        expect(live).not.toHaveBeenCalled();
        items = [notice];
        await fire('guest-support-notification', notice);
        await fire('guest-support-notification', notice);
        expect(live).toHaveBeenCalledOnce();
        expect(result.current.unreadCount).toBe(1);
    });
    it('keeps a live unread update even if the follow-up refresh fails', async () => {
        const { result } = renderHook(() => useGuestSupportNotifications(requests, true, vi.fn()));
        await waitFor(() => expect(fetch).toHaveBeenCalled());
        fetch.mockRejectedValue(new Error('offline'));
        await fire('guest-support-notification', notice);
        expect(result.current.unreadCount).toBe(1);
        expect(result.current.error).toBe(true);
    });
    it('recovers missed updates on reconnect and visibility without playing old alerts', async () => {
        const live = vi.fn();
        const { result } = renderHook(() => useGuestSupportNotifications(requests, true, live));
        await waitFor(() => expect(fetch).toHaveBeenCalled());
        items = [notice];
        await fire('connect');
        await waitFor(() => expect(result.current.unreadCount).toBe(1));
        items = [{ ...notice, isRead: true }];
        await act(async () => document.dispatchEvent(new Event('visibilitychange')));
        await waitFor(() => expect(result.current.unreadCount).toBe(0));
        expect(live).not.toHaveBeenCalled();
    });
    it('marks only the exact viewed notification using that request token', async () => {
        items = [notice];
        const { result } = renderHook(() => useGuestSupportNotifications(requests, true, vi.fn()));
        await waitFor(() => expect(result.current.unreadCount).toBe(1));
        await act(async () => result.current.markRead(notice));
        expect(fetch).toHaveBeenCalledWith('/api/v1/contacts/a/guest-notification/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Support-Token': 'secret-a' },
            body: JSON.stringify({ notificationId: notice.id }),
        });
        expect(result.current.unreadCount).toBe(0);
        const count = fetch.mock.calls.length;
        await act(async () => result.current.markRead({ ...notice, requestId: 'b' }));
        expect(fetch.mock.calls.length).toBe(count);
    });
    it('leaves rooms and clears the feed when the session ends or the user signs in', async () => {
        items = [notice];
        const live = vi.fn();
        const { result, rerender } = renderHook(
            ({ enabled, entries }) => useGuestSupportNotifications(entries, enabled, live),
            { initialProps: { enabled: true, entries: requests } },
        );
        await waitFor(() => expect(result.current.unreadCount).toBe(1));
        rerender({ enabled: false, entries: requests });
        expect(result.current.items).toEqual([]);
        expect(channel.emit).toHaveBeenCalledWith('guest-support-unsubscribe');
        expect(channel.handlers.get('guest-support-notification').size).toBe(0);
        await fire('guest-support-notification', notice);
        expect(live).not.toHaveBeenCalled();
    });
});
