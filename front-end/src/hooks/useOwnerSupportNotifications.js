import { useCallback, useEffect, useRef, useState } from 'react';
import { BASE_URL } from '../../config';
import socket from '../utils/services/socket';

const useOwnerSupportNotifications = (token, enabled, onLive) => {
    const [state, setState] = useState({ items: [], unreadCount: 0, error: false });
    const live = useRef(onLive);
    live.current = onLive;
    const markRead = useCallback(
        async (notification) => {
            if (!token || !enabled || !notification?.id || !notification.requestId) return;
            try {
                const response = await fetch(BASE_URL + '/contacts/my-notifications/read', {
                    method: 'POST',
                    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requestId: notification.requestId, notificationId: notification.id }),
                });
                if (!response.ok) return;
                setState((value) => {
                    const wasUnread = value.items.some((item) => item.id === notification.id && !item.isRead);
                    return {
                        ...value,
                        items: value.items.map((item) =>
                            item.id === notification.id ? { ...item, isRead: true } : item,
                        ),
                        unreadCount: Math.max(0, value.unreadCount - (wasUnread ? 1 : 0)),
                    };
                });
            } catch {
                /* Preserve unread state when the read request fails. */
            }
        },
        [token, enabled],
    );
    useEffect(() => {
        setState({ items: [], unreadCount: 0, error: false });
        if (!enabled || !token) return;
        let active = true;
        let controller;
        const seen = new Set();
        const load = async () => {
            controller?.abort();
            const current = new AbortController();
            controller = current;
            try {
                const response = await fetch(`${BASE_URL}/contacts/my-notifications`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: current.signal,
                });
                if (!response.ok) throw new Error();
                const body = await response.json();
                if (!active || current.signal.aborted) return;
                // HTTP restoration must not suppress a live event that arrives after the response.
                setState({ items: body.data || [], unreadCount: body.unreadCount || 0, error: false });
            } catch {
                if (active && !current.signal.aborted) setState((value) => ({ ...value, error: true }));
            }
        };
        const onNotification = (event) => {
            if (!active || !event?.requestId || !event.id) return;
            if (seen.has(event.id)) {
                void load();
                return;
            }
            if (!seen.has(event.id)) {
                seen.add(event.id);
                if (seen.size > 300) seen.delete(seen.values().next().value);
                live.current?.(event);
            }
            setState((value) => {
                const previous = value.items.find((item) => item.requestId === event.requestId);
                const items = [event, ...value.items.filter((item) => item.requestId !== event.requestId)]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 12);
                return {
                    ...value,
                    items,
                    unreadCount: value.unreadCount + (!event.isRead && (!previous || previous.isRead) ? 1 : 0),
                };
            });
            void load();
        };
        const subscribe = () => {
            socket.emit('owner-support-subscribe', { token }, (result) => {
                if (active && result?.success) void load();
            });
            void load();
        };
        const whenVisible = () => {
            if (!document.hidden) void load();
        };
        socket.on('owner-support-notification', onNotification);
        socket.on('owner-support-changed', load);
        socket.on('connect', subscribe);
        window.addEventListener('focus', whenVisible);
        document.addEventListener('visibilitychange', whenVisible);
        subscribe();
        return () => {
            active = false;
            controller?.abort();
            socket.off('owner-support-notification', onNotification);
            socket.off('owner-support-changed', load);
            socket.off('connect', subscribe);
            socket.emit('owner-support-unsubscribe');
            window.removeEventListener('focus', whenVisible);
            document.removeEventListener('visibilitychange', whenVisible);
        };
    }, [token, enabled]);
    return { ...state, markRead };
};
export default useOwnerSupportNotifications;
