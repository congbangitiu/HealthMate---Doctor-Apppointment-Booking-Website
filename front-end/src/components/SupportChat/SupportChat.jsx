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

    useEffect(() => {
        let active = true;
        let controller;
        setMessages([]);
        setViewer(null);
        setAssignee(null);
        setRequester(null);
        setError('');
        setLoading(true);
        setConnected(false);
        let initialized = false;
        let latestId = null;
        let openedNotificationId;
        const load = async () => {
            controller?.abort();
            const current = new AbortController();
            controller = current;
            try {
                let more;
                let seenRequest;
                let seenViewer;
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
                    if (openedNotificationId === undefined)
                        openedNotificationId = result.request.ownerNotificationId || null;
                    seenRequest = result.request;
                    seenViewer = result.viewer;
                    onRequestChange?.(result.request);
                    if (!initialized) {
                        setHasMore(result.hasMore);
                        initialized = true;
                    }
                    const last = result.messages[result.messages.length - 1];
                    if (last) latestId = last._id;
                    more = fetchingNewer && result.hasMore && Boolean(last);
                } while (more);
                if (
                    token &&
                    !guestToken &&
                    ['patient', 'doctor'].includes(seenViewer?.role) &&
                    !document.hidden &&
                    seenRequest?.ownerNotificationRead === false &&
                    seenRequest.ownerNotificationId === openedNotificationId
                ) {
                    try {
                        const response = await fetch(BASE_URL + '/contacts/my-notifications/read', {
                            method: 'POST',
                            headers: headers(),
                            signal: current.signal,
                            body: JSON.stringify({ requestId, notificationId: seenRequest.ownerNotificationId }),
                        });
                        if (response.ok) openedNotificationId = null;
                    } catch {
                        /* Keep the unread marker and retry on the next sync. */
                    }
                }
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
        };
    }, [requestId, token, guestToken, fetchChat, headers, retry, onRequestChange]);
    useEffect(() => {
        setDraft('');
        nonce.current = null;
    }, [requestId, token, guestToken]);
    const lastMessageId = messages[messages.length - 1]?._id;
    const viewerRole = useRef(null);
    viewerRole.current = viewer?.role;
    useEffect(() => {
        const messageList = bottom.current?.parentElement;
        if (messageList) messageList.scrollTop = messageList.scrollHeight;
    }, [requestId, lastMessageId]);

    const older = async () => {
        if (olderLoading || !messages.length) return;
        setOlderLoading(true);
        const id = requestId;
        try {
            const result = await fetchChat(messages[0]._id);
            if (activeId.current !== id) return;
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
