import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SupportChat from './SupportChat';

const channel = vi.hoisted(() => ({ handlers: new Map(), emit: vi.fn() }));
vi.mock('../../utils/services/socket', () => ({
    default: {
        on: (event, handler) => {
            if (!channel.handlers.has(event)) channel.handlers.set(event, new Set());
            channel.handlers.get(event).add(handler);
        },
        off: (event, handler) => channel.handlers.get(event)?.delete(handler),
        emit: channel.emit,
    },
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en' } }) }));
vi.mock('../../../config', () => ({ BASE_URL: '/api/v1' }));
let messages, failSend;
beforeEach(() => {
    messages = [];
    failSend = false;
    channel.handlers.clear();
    channel.emit.mockImplementation((event, payload, callback) => callback?.({ success: true }));
    vi.stubGlobal(
        'fetch',
        vi.fn(async (url, options = {}) => {
            if (url.endsWith('/messages')) {
                if (failSend) throw new Error('offline');
                const body = JSON.parse(options.body);
                const message = {
                    _id: 'message-1',
                    content: body.content,
                    senderRole: 'guest',
                    senderName: 'Guest',
                    createdAt: '2026-11-10T01:00:00Z',
                };
                messages = [message];
                return { ok: true, json: async () => ({ data: message }) };
            }
            return {
                ok: true,
                json: async () => ({
                    data: {
                        request: { _id: 'request-1' },
                        messages,
                        hasMore: false,
                        viewer: { id: null, role: 'guest' },
                    },
                }),
            };
        }),
    );
});
describe('support chat', () => {
    it('shows the requester to admins, with a neutral fallback when their avatar fails', async () => {
        fetch.mockImplementation(async () => ({
            ok: true,
            json: async () => ({
                data: {
                    request: {
                        _id: 'request-1',
                        requester: { fullname: 'Request Sender', photo: '/sender.png' },
                        assignee: { fullname: 'Assigned Admin', photo: '/admin.png' },
                    },
                    messages: [],
                    hasMore: false,
                    viewer: { role: 'admin', id: 'admin-1' },
                },
            }),
        }));
        render(<SupportChat requestId="request-1" token="admin-token" />);
        expect(await screen.findByRole('heading', { name: 'Request Sender' })).toBeInTheDocument();
        const avatar = screen.getByRole('img', { name: 'Request Sender' });
        expect(avatar).toHaveAttribute('src', '/sender.png');
        expect(screen.queryByRole('heading', { name: 'Assigned Admin' })).not.toBeInTheDocument();
        fireEvent.error(avatar);
        expect(screen.getByRole('img', { name: 'Request Sender' }).getAttribute('src')).toContain(
            'default-notification-avatar.svg',
        );
    });
    it('updates the header when the assigned admin changes or releases the request', async () => {
        let assignee = { id: 'admin-1', fullname: 'Admin One', photo: '/one.png' };
        fetch.mockImplementation(async () => ({
            ok: true,
            json: async () => ({
                data: {
                    request: { _id: 'request-1', assignee },
                    messages: [],
                    hasMore: false,
                    viewer: { role: 'patient', id: 'owner' },
                },
            }),
        }));
        render(<SupportChat requestId="request-1" token="owner-token" />);
        expect(await screen.findByRole('heading', { name: 'Admin One' })).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Admin One' })).toHaveAttribute('src', '/one.png');
        assignee = { id: 'admin-2', fullname: 'Admin Two', photo: '/two.png' };
        await act(async () => {
            for (const handler of channel.handlers.get('support-chat-changed')) handler({ requestId: 'request-1' });
        });
        expect(await screen.findByRole('heading', { name: 'Admin Two' })).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Admin Two' })).toHaveAttribute('src', '/two.png');
        assignee = null;
        await act(async () => {
            for (const handler of channel.handlers.get('support-chat-changed')) handler({ requestId: 'request-1' });
        });
        expect(await screen.findByRole('heading', { name: 'supportTeam' })).toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
    it('does not silently mark a new realtime update read during background conversation sync', async () => {
        let notificationId = 'status:old';
        fetch.mockImplementation(async (url) => ({
            ok: true,
            json: async () =>
                url.endsWith('/read')
                    ? { success: true }
                    : {
                          data: {
                              request: {
                                  _id: 'request-1',
                                  ownerNotificationId: notificationId,
                                  ownerNotificationRead: false,
                              },
                              messages: [],
                              hasMore: false,
                              viewer: { role: 'patient', id: 'owner' },
                          },
                      },
        }));
        render(<SupportChat requestId="request-1" token="owner-token" />);
        await waitFor(() => expect(fetch.mock.calls.some(([url]) => url.endsWith('/read'))).toBe(true));
        notificationId = 'status:new';
        await act(async () => {
            for (const handler of channel.handlers.get('support-chat-changed')) handler({ requestId: 'request-1' });
        });
        expect(fetch.mock.calls.filter(([url]) => url.endsWith('/read'))).toHaveLength(1);
    });
    it.each(['patient', 'doctor'])(
        'marks the exact update read after its %s owner loads the conversation',
        async (role) => {
            fetch.mockImplementation(async (url) => ({
                ok: true,
                json: async () =>
                    url.endsWith('/read')
                        ? { success: true }
                        : {
                              data: {
                                  request: {
                                      _id: 'request-1',
                                      ownerNotificationId: 'status:seen',
                                      ownerNotificationRead: false,
                                  },
                                  messages: [],
                                  hasMore: false,
                                  viewer: { role, id: 'owner' },
                              },
                          },
            }));
            render(<SupportChat requestId="request-1" token="owner-token" />);
            await waitFor(() =>
                expect(fetch).toHaveBeenCalledWith(
                    '/api/v1/contacts/my-notifications/read',
                    expect.objectContaining({
                        method: 'POST',
                        body: JSON.stringify({ requestId: 'request-1', notificationId: 'status:seen' }),
                    }),
                ),
            );
        },
    );
    it('loads every page of a missed-message backlog after reconnect', async () => {
        const make = (id, content) => ({
            _id: id,
            content,
            senderRole: 'admin',
            senderName: 'Admin',
            createdAt: '2026-11-10T02:00:00Z',
        });
        fetch.mockImplementation(async (url) => {
            const cursor = new URL(url, 'http://localhost').searchParams.get('after');
            const data =
                cursor === 'message-001'
                    ? { messages: [make('message-002', 'Second reply')], hasMore: true }
                    : cursor === 'message-002'
                    ? { messages: [make('message-003', 'Third reply')], hasMore: false }
                    : { messages: [make('message-001', 'First reply')], hasMore: false };
            return {
                ok: true,
                json: async () => ({
                    data: {
                        ...data,
                        request: { _id: 'request-1' },
                        viewer: { role: 'guest', id: null },
                    },
                }),
            };
        });
        render(<SupportChat requestId="request-1" guestToken="guest-secret" />);
        await screen.findByText('First reply');
        await act(async () => {
            for (const handler of channel.handlers.get('connect')) handler();
        });
        expect(await screen.findByText('Second reply')).toBeInTheDocument();
        expect(await screen.findByText('Third reply')).toBeInTheDocument();
        expect(screen.getByText('First reply')).toBeInTheDocument();
        expect(fetch.mock.calls.some(([url]) => url.includes('after=message-002'))).toBe(true);
    });

    it('binds the guest conversation to its secret header and retries with the same nonce', async () => {
        render(<SupportChat requestId="request-1" guestToken="guest-secret" />);
        await waitFor(() => expect(screen.getByLabelText('messageLabel')).toBeEnabled());
        fireEvent.change(screen.getByLabelText('messageLabel'), { target: { value: 'Please help' } });
        failSend = true;
        fireEvent.keyDown(screen.getByLabelText('messageLabel'), { key: 'Enter' });
        await screen.findByRole('alert');
        expect(screen.getByLabelText('messageLabel')).toHaveValue('Please help');
        failSend = false;
        fireEvent.click(screen.getByRole('button', { name: 'send' }));
        expect(await screen.findByText('Please help')).toBeInTheDocument();
        const sends = fetch.mock.calls.filter(([url]) => url.endsWith('/messages'));
        expect(sends).toHaveLength(2);
        expect(JSON.parse(sends[0][1].body).clientId).toBe(JSON.parse(sends[1][1].body).clientId);
        expect(sends[1][1].headers['X-Support-Token']).toBe('guest-secret');
        expect(
            channel.emit.mock.calls.some(([event]) =>
                ['send-message', 'join-chat', 'edit-message', 'remove-message'].includes(event),
            ),
        ).toBe(false);
        expect(screen.getByLabelText('messageLabel')).toHaveValue('');
    });
    it('recovers missed messages on reconnect and removes socket handlers on unmount', async () => {
        const { unmount } = render(<SupportChat requestId="request-1" guestToken="guest-secret" />);
        await waitFor(() => expect(screen.getByLabelText('messageLabel')).toBeEnabled());
        messages = [
            {
                _id: 'message-2',
                content: 'Admin reply',
                senderRole: 'admin',
                senderName: 'Admin',
                createdAt: '2026-11-10T02:00:00Z',
            },
        ];
        await act(async () => {
            for (const handler of channel.handlers.get('connect')) handler();
        });
        expect(await screen.findByText('Admin reply')).toBeInTheDocument();
        await act(async () => {
            for (const handler of channel.handlers.get('support-chat-changed')) handler({ requestId: 'request-1' });
        });
        expect(screen.getAllByText('Admin reply')).toHaveLength(1);
        unmount();
        expect(channel.handlers.get('support-chat-changed').size).toBe(0);
        expect(channel.emit).toHaveBeenCalledWith('support-chat-unsubscribe');
    });
});
