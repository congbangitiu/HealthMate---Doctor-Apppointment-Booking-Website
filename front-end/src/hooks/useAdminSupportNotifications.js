import { useEffect, useRef, useState } from 'react';
import { BASE_URL } from '../../config';
import socket from '../utils/services/socket';

const useAdminSupportNotifications = (token, enabled, onLive) => {
    const [state, setState] = useState({ items: [], unreadCount: 0, error: false });
    const live = useRef(onLive);
    live.current = onLive;
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
                const response = await fetch(`${BASE_URL}/contacts/notifications`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: current.signal,
                });
                if (!response.ok) throw new Error();
                const body = await response.json();
                if (!active || current.signal.aborted) return;
                for (const item of body.data || []) seen.add(item.id);
                setState({ items: body.data || [], unreadCount: body.unreadCount || 0, error: false });
            } catch {
                if (active && !current.signal.aborted) setState((value) => ({ ...value, error: true }));
            }
        };
        const onNotification = (event) => {
            if (!event?.requestId || !event.id) return;
            if (!seen.has(event.id)) {
                seen.add(event.id);
                if (seen.size > 300) seen.delete(seen.values().next().value);
                live.current?.(event);
            }
            void load();
        };
        const subscribe = () => {
            socket.emit('admin-support-subscribe', { token }, (result) => {
                if (active && result?.success) void load();
            });
            void load();
        };
        const whenVisible = () => {
            if (!document.hidden) void load();
        };
        socket.on('support-notification', onNotification);
        socket.on('support-requests-changed', load);
        socket.on('connect', subscribe);
        window.addEventListener('focus', whenVisible);
        document.addEventListener('visibilitychange', whenVisible);
        const interval = setInterval(whenVisible, 30000);
        subscribe();
        return () => {
            active = false;
            controller?.abort();
            clearInterval(interval);
            socket.off('support-notification', onNotification);
            socket.off('support-requests-changed', load);
            socket.off('connect', subscribe);
            socket.emit('admin-support-unsubscribe');
            window.removeEventListener('focus', whenVisible);
            document.removeEventListener('visibilitychange', whenVisible);
        };
    }, [token, enabled]);
    return state;
};
export default useAdminSupportNotifications;
