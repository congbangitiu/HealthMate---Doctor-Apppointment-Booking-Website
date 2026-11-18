import { useCallback, useEffect, useRef, useState } from 'react';
import { BASE_URL } from '../../config';
import socket from '../utils/services/socket';
import { guestProofs, forgetGuestRequests } from '../utils/services/supportRequests';
const empty = () => ({ items: [], unreadCount: 0, error: false });
const useGuestSupportNotifications = (requests, enabled, onLive) => {
    const [state, setState] = useState(empty);
    const live = useRef(onLive);
    live.current = onLive;
    const proofs = JSON.stringify(guestProofs(requests));
    const generation = useRef(0);
    const markRead = useCallback(
        async (notification) => {
            const proof = requests.find((entry) => entry.id === notification?.requestId);
            if (!enabled || !proof || !notification?.id) return;
            const version = generation.current;
            try {
                const response = await fetch(BASE_URL + '/contacts/' + proof.id + '/guest-notification/read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Support-Token': proof.guestToken },
                    body: JSON.stringify({ notificationId: notification.id }),
                });
                if (!response.ok || version !== generation.current) return;
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
                /* Keep unread state until the server confirms the read. */
            }
        },
        [requests, enabled],
    );
    useEffect(() => {
        generation.current += 1;
        setState(empty());
        const credentials = JSON.parse(proofs);
        if (!enabled || !credentials.length) return;
        const allowed = new Set(credentials.map((entry) => entry.requestId));
        let active = true;
        let controller;
        const seen = new Set();
        const load = async () => {
            controller?.abort();
            const current = new AbortController();
            controller = current;
            try {
                const response = await fetch(BASE_URL + '/contacts/guest-notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requests: credentials }),
                    signal: current.signal,
                });
                if (!response.ok) throw new Error('loadFailed');
                const body = await response.json();
                if (!active || current.signal.aborted) return;
                if (body.unavailableRequestIds?.length) forgetGuestRequests(body.unavailableRequestIds);
                setState({ items: body.data || [], unreadCount: body.unreadCount || 0, error: false });
            } catch {
                if (active && !current.signal.aborted) setState((value) => ({ ...value, error: true }));
            }
        };
        const receive = (event) => {
            if (!active || !event?.id || !allowed.has(event.requestId)) return;
            if (seen.has(event.id)) {
                void load();
                return;
            }
            seen.add(event.id);
            if (seen.size > 300) seen.delete(seen.values().next().value);
            live.current?.(event);
            setState((value) => {
                const old = value.items.find((item) => item.requestId === event.requestId);
                return {
                    ...value,
                    items: [event, ...value.items.filter((item) => item.requestId !== event.requestId)]
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .slice(0, 12),
                    unreadCount: value.unreadCount + (!event.isRead && (!old || old.isRead) ? 1 : 0),
                };
            });
            void load();
        };
        const subscribe = () => {
            socket.emit('guest-support-subscribe', { requests: credentials }, (result) => {
                if (active && result?.success) void load();
            });
            void load();
        };
        const whenVisible = () => {
            if (!document.hidden) void load();
        };
        socket.on('guest-support-notification', receive);
        socket.on('guest-support-changed', load);
        socket.on('connect', subscribe);
        window.addEventListener('focus', whenVisible);
        document.addEventListener('visibilitychange', whenVisible);
        subscribe();
        return () => {
            active = false;
            generation.current += 1;
            controller?.abort();
            socket.off('guest-support-notification', receive);
            socket.off('guest-support-changed', load);
            socket.off('connect', subscribe);
            socket.emit('guest-support-unsubscribe');
            window.removeEventListener('focus', whenVisible);
            document.removeEventListener('visibilitychange', whenVisible);
        };
    }, [proofs, enabled]);
    return { ...(enabled && requests.length ? state : empty()), markRead };
};
export default useGuestSupportNotifications;
