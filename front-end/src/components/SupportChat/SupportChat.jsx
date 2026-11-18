import ContentChat from '../ContentChat/ContentChat';
import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { BASE_URL } from '../../../config';
import socket from '../../utils/services/socket';

const SupportChat = ({ requestId, token, guestToken, onRequestChange }) => {
    const [messages, setMessages] = useState([]);
    const [viewer, setViewer] = useState(null);
    const [assignee, setAssignee] = useState(null);
    const [requester, setRequester] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [olderLoading, setOlderLoading] = useState(false);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [connected, setConnected] = useState(false);
    const [retry, setRetry] = useState(0);
    const [syncVersion, setSyncVersion] = useState(0);
    const [hasNewMessages, setHasNewMessages] = useState(false);
    const nearBottom = useRef(true);
    const initializedScroll = useRef(false);
    const previousLastMessage = useRef(null);
    const forceScroll = useRef(false);
    const olderAnchor = useRef(null);
    const latestRequest = useRef(null);
    const latestViewer = useRef(null);
    const readIds = useRef(new Set());
    const readPending = useRef(new Set());
    const readControllers = useRef(new Set());
    const nonce = useRef(null);
    const lock = useRef(false);
    const activeId = useRef(requestId);
    activeId.current = requestId;
    const bottom = useRef(null);
    const composer = useRef(null);
    useEffect(() => {
        if (!composer.current) return;
        composer.current.style.height = 'auto';
        composer.current.style.height = Math.min(composer.current.scrollHeight, 144) + 'px';
    }, [draft]);
    const headers = useCallback(
        () => ({
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(guestToken ? { 'X-Support-Token': guestToken } : {}),
        }),
        [token, guestToken],
    );
    const fetchChat = useCallback(
        async (before, signal, after) => {
            const response = await fetch(
                `${BASE_URL}/contacts/${requestId}/conversation${
                    before ? '?before=' + before : after ? '?after=' + after : ''
                }`,
                { headers: headers(), signal },
            );
            const body = await response.json();
            if (!response.ok || !body.data?.request)
                throw new Error(body.code === 'forbidden' ? 'forbidden' : 'chatFailed');
            return body.data;
        },
        [requestId, headers],
    );

    const acknowledge = useCallback(async () => {
        const request = latestRequest.current;
        const currentViewer = latestViewer.current;
        const pane = bottom.current?.parentElement;
        if (
            !pane ||
            document.hidden ||
            !nearBottom.current ||
            request?.ownerNotificationRead !== false ||
            !request.ownerNotificationId
        )
            return;
        const rect = pane.getBoundingClientRect();
        if (
            pane.clientHeight > 0 &&
            (rect.bottom <= 0 || rect.bottom > window.innerHeight + 1 || rect.top >= window.innerHeight)
        )
            return;
        const allowed = guestToken
            ? currentViewer?.role === 'guest'
            : token && ['patient', 'doctor'].includes(currentViewer?.role);
        const notificationId = request.ownerNotificationId;
        if (!allowed || readIds.current.has(notificationId) || readPending.current.has(notificationId)) return;
        const controller = new AbortController();
        readPending.current.add(notificationId);
        readControllers.current.add(controller);
        try {
            const response = await fetch(
                BASE_URL +
                    (guestToken
                        ? '/contacts/' + requestId + '/guest-notification/read'
                        : '/contacts/my-notifications/read'),
                {
                    method: 'POST',
                    headers: headers(),
                    signal: controller.signal,
                    body: JSON.stringify({ requestId, notificationId }),
                },
            );
            if (!response.ok || controller.signal.aborted || activeId.current !== requestId) return;
            readIds.current.add(notificationId);
            if (latestRequest.current?.ownerNotificationId === notificationId) {
                latestRequest.current = { ...latestRequest.current, ownerNotificationRead: true };
                onRequestChange?.(latestRequest.current);
            }
        } catch {
            /* Leave unread state intact until a successful, version-matched retry. */
        } finally {
            readPending.current.delete(notificationId);
            readControllers.current.delete(controller);
        }
    }, [guestToken, token, requestId, headers, onRequestChange]);
    const jumpToLatest = useCallback(() => {
        const pane = bottom.current?.parentElement;
        if (!pane) return;
        pane.scrollTop = pane.scrollHeight;
        nearBottom.current = true;
        setHasNewMessages(false);
        void acknowledge();
    }, [acknowledge]);
    const onScroll = useCallback(
        (event) => {
            const pane = event.currentTarget;
            nearBottom.current = pane.scrollHeight - pane.clientHeight - pane.scrollTop <= 48;
            if (nearBottom.current) {
                setHasNewMessages(false);
                void acknowledge();
            }
        },
        [acknowledge],
    );
    useEffect(() => {
        let active = true;
        const activeReadControllers = readControllers.current;
        let controller;
        setMessages([]);
        setViewer(null);
        setAssignee(null);
        setRequester(null);
        setError('');
        setLoading(true);
        setConnected(false);
        initializedScroll.current = false;
        nearBottom.current = true;
        previousLastMessage.current = null;
        latestRequest.current = null;
        latestViewer.current = null;
        olderAnchor.current = null;
        forceScroll.current = false;
        readIds.current.clear();
        readPending.current.clear();
        setHasNewMessages(false);
        let initialized = false;
        let latestId = null;

        const load = async () => {
            controller?.abort();
            const current = new AbortController();
            controller = current;
            try {
                let more;

                do {
                    const fetchingNewer = Boolean(latestId);
                    const result = await fetchChat(null, current.signal, latestId);
                    if (!active || current.signal.aborted) return;
                    setMessages((existing) =>
                        [...new Map([...existing, ...result.messages].map((item) => [item._id, item])).values()].sort(
                            (a, b) => a._id.localeCompare(b._id),
                        ),
                    );
                    setViewer(result.viewer);
                    setAssignee(result.request.assignee || null);
                    setRequester(result.request.requester || { fullname: result.request.fullname });
                    latestRequest.current = result.request;
                    latestViewer.current = result.viewer;

                    onRequestChange?.(result.request);
                    if (!initialized) {
                        setHasMore(result.hasMore);
                        initialized = true;
                    }
                    const last = result.messages[result.messages.length - 1];
                    if (last) latestId = last._id;
                    more = fetchingNewer && result.hasMore && Boolean(last);
                } while (more);
                setSyncVersion((value) => value + 1);
                setError('');
            } catch (err) {
                if (active && !current.signal.aborted) setError(err.message);
            } finally {
                if (active && !current.signal.aborted) setLoading(false);
            }
        };
        const onChange = (event) => {
            if (event?.requestId !== requestId) return;
            void load();
            if (token && !guestToken) {
                // Only a database-confirmed admin may use this endpoint; owners simply do not call it.
                if (viewerRole.current === 'admin') {
                    fetch(`${BASE_URL}/contacts/${requestId}/read`, { method: 'POST', headers: headers() }).catch(
                        () => {},
                    );
                }
            }
        };
        const join = () => {
            setConnected(false);
            socket.emit('support-chat-subscribe', { requestId, token, guestToken }, (result) => {
                if (!active) return;
                setConnected(Boolean(result?.success));
                if (result?.success) void load();
            });
            void load();
        };
        const offline = () => setConnected(false);
        socket.on('support-chat-changed', onChange);
        socket.on('connect', join);
        socket.on('disconnect', offline);
        const onFocus = () => {
            if (!document.hidden) void load();
        };
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onFocus);
        const onPageScroll = () => {
            void acknowledge();
        };
        window.addEventListener('scroll', onPageScroll, { passive: true });
        const poll = setInterval(onFocus, 15000);
        join();
        return () => {
            active = false;
            controller?.abort();
            clearInterval(poll);
            socket.off('support-chat-changed', onChange);
            socket.off('connect', join);
            socket.off('disconnect', offline);
            socket.emit('support-chat-unsubscribe');
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onFocus);
            window.removeEventListener('scroll', onPageScroll);
            for (const controller of activeReadControllers) controller.abort();
            activeReadControllers.clear();
        };
    }, [requestId, token, guestToken, fetchChat, headers, retry, onRequestChange, acknowledge]);
    useEffect(() => {
        setDraft('');
        nonce.current = null;
    }, [requestId, token, guestToken]);
    const lastMessageId = messages[messages.length - 1]?._id;
    const viewerRole = useRef(null);
    viewerRole.current = viewer?.role;
    useEffect(() => {
        const pane = bottom.current?.parentElement;
        if (!pane || loading) return;
        if (olderAnchor.current) {
            pane.scrollTop = olderAnchor.current.top + pane.scrollHeight - olderAnchor.current.height;
            olderAnchor.current = null;
        } else if (
            !initializedScroll.current ||
            forceScroll.current ||
            (previousLastMessage.current !== lastMessageId && nearBottom.current)
        ) {
            pane.scrollTop = pane.scrollHeight;
            nearBottom.current = true;
            setHasNewMessages(false);
        } else if (previousLastMessage.current !== lastMessageId) setHasNewMessages(true);
        initializedScroll.current = true;
        forceScroll.current = false;
        previousLastMessage.current = lastMessageId;
        void acknowledge();
    }, [messages, lastMessageId, loading, syncVersion, acknowledge]);

    const older = async () => {
        if (olderLoading || !messages.length) return;
        setOlderLoading(true);
        const id = requestId;
        try {
            const result = await fetchChat(messages[0]._id);
            if (activeId.current !== id) return;
            const pane = bottom.current?.parentElement;
            if (pane) olderAnchor.current = { top: pane.scrollTop, height: pane.scrollHeight };
            setMessages((current) => [
                ...new Map([...result.messages, ...current].map((item) => [item._id, item])).values(),
            ]);
            setHasMore(result.hasMore);
        } catch {
            if (activeId.current === id) setError('chatFailed');
        } finally {
            setOlderLoading(false);
        }
    };
    const send = async (event) => {
        event.preventDefault();
        if (lock.current || !draft.trim()) return;
        lock.current = true;
        setSending(true);
        setError('');
        const id = requestId;
        const content = draft.trim();
        if (!nonce.current || nonce.current.content !== content)
            nonce.current = { content, clientId: crypto.randomUUID() };
        try {
            const response = await fetch(`${BASE_URL}/contacts/${id}/messages`, {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify(nonce.current),
            });
            const body = await response.json();
            if (activeId.current !== id) return;
            if (!response.ok) throw new Error(body.code === 'rateLimited' ? 'rateLimited' : 'sendFailed');
            setMessages((current) =>
                [...new Map([...current, body.data].map((item) => [item._id, item])).values()].sort((a, b) =>
                    a._id.localeCompare(b._id),
                ),
            );
            forceScroll.current = true;
            setSyncVersion((value) => value + 1);
            setDraft('');
            nonce.current = null;
        } catch (err) {
            if (activeId.current === id) setError(err.message === 'rateLimited' ? 'rateLimited' : 'sendFailed');
        } finally {
            lock.current = false;
            setSending(false);
        }
    };
    return (
        <ContentChat
            support={{
                requestId,
                messages,
                viewer,
                assignee,
                requester,
                loading,
                connected,
                hasMore,
                olderLoading,
                onScroll,
                hasNewMessages,
                onJumpToLatest: jumpToLatest,
                onLoadOlder: older,
                draft,
                onDraftChange: setDraft,
                sending,
                error,
                onRetry: () => setRetry((n) => n + 1),
                onSend: send,
                bottomRef: bottom,
                composerRef: composer,
            }}
        />
    );
};
SupportChat.propTypes = {
    onRequestChange: PropTypes.func,
    requestId: PropTypes.string.isRequired,
    token: PropTypes.string,
    guestToken: PropTypes.string,
};
export default SupportChat;
