vi.mock('../../../utils/services/socket', () => ({
    default: { connected: false, on: vi.fn(), off: vi.fn(), emit: vi.fn() },
}));
import socket from '../../../utils/services/socket';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SupportManagement from './SupportManagement';
import { authContext } from '../../../context/AuthContext';

const language = vi.hoisted(() => ({ current: 'en' }));
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, options) => (options?.id ? key + ' ' + options.id : key),
        i18n: { language: language.current },
    }),
}));
vi.mock('../../../../config', () => ({ BASE_URL: '/api/v1' }));
const id = '507f1f77bcf86cd799439011';
const initial = {
    _id: id,
    fullname: 'Test Sender',
    email: 'sender@example.com',
    phone: '0901234567',
    senderRole: 'patient',
    category: 'technical',
    subject: '',
    message: 'My issue details',
    createdAt: '2026-10-31T01:00:00Z',
    status: 'new',
    isRead: false,
    __v: 0,
    history: [],
    assignee: null,
};
let request, total, conflict;
const mount = (path = '/admins/management/support') =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <authContext.Provider value={{ token: 'admin-token', user: { _id: 'admin-1' } }}>
                <SupportManagement />
            </authContext.Provider>
        </MemoryRouter>,
    );
beforeEach(() => {
    language.current = 'en';
    vi.stubGlobal('scrollTo', vi.fn());
    request = { ...initial };
    total = 1;
    conflict = false;
    vi.stubGlobal(
        'fetch',
        vi.fn(async (url, options = {}) => {
            if (url.includes('/conversation'))
                return {
                    ok: true,
                    json: async () => ({
                        data: {
                            request,
                            messages: [],
                            hasMore: false,
                            viewer: { id: 'admin-1', role: 'admin' },
                        },
                    }),
                };
            if (options.method === 'PATCH') {
                if (conflict) return { ok: false, status: 409, json: async () => ({ code: 'conflict' }) };
                const body = JSON.parse(options.body);
                request = {
                    ...request,
                    status: body.status || request.status,
                    __v: request.__v + 1,
                    history: [
                        ...request.history,
                        ...(body.note
                            ? [{ type: 'note', note: body.note, actorName: 'Admin One', at: initial.createdAt }]
                            : []),
                    ],
                };
                return { ok: true, json: async () => ({ data: request }) };
            }
            if (options.method === 'POST') {
                request = { ...request, isRead: true };
                return { ok: true, json: async () => ({ data: request }) };
            }
            return { ok: true, json: async () => ({ data: [request], total }) };
        }),
    );
});
const open = async () => {
    fireEvent.click(await screen.findByRole('row', { name: 'viewRequest #' + id }));
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByText('My issue details');
    return within(dialog);
};
describe('SupportManagement', () => {
    it('does not periodically reload the table but still refreshes on realtime events', async () => {
        mount();
        await screen.findByRole('row', { name: 'viewRequest #' + id });
        const before = fetch.mock.calls.length;
        vi.useFakeTimers();
        try {
            await act(async () => { await vi.advanceTimersByTimeAsync(90000); });
            expect(fetch).toHaveBeenCalledTimes(before);
            const onChange = socket.on.mock.calls.filter(([event]) => event === 'support-requests-changed').at(-1)[1];
            await act(async () => {
                onChange();
                await vi.advanceTimersByTimeAsync(150);
            });
            expect(fetch).toHaveBeenCalledTimes(before + 1);
        } finally {
            vi.useRealTimers();
        }
    });
    it.each([false, true])('copies the full request ID and handles clipboard failure (%s)', async (fails) => {
        const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
        const writeText = fails ? vi.fn().mockRejectedValue(new Error('denied')) : vi.fn().mockResolvedValue();
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
        try {
            mount();
            const modal = await open();
            expect(modal.getByText('#' + id)).toBeInTheDocument();
            fireEvent.click(modal.getByRole('button', { name: 'copyId' }));
            expect(writeText).toHaveBeenCalledWith(id);
            if (fails) expect(await modal.findByRole('alert')).toHaveTextContent('copyFailed');
            else
                await waitFor(() => {
                    expect(modal.getByRole('button', { name: 'copyId' })).toHaveTextContent('copied');
                    expect(modal.queryByRole('status')).not.toBeInTheDocument();
                });
        } finally {
            if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard);
            else delete navigator.clipboard;
        }
    });

    it.each([5, 10, 11])('only shows pagination when total %s exceeds the selected page size', async (count) => {
        total = count;
        mount();
        await screen.findByRole('row', { name: 'viewRequest #' + id });
        if (count > 10) expect(screen.getByText('next')).toBeInTheDocument();
        else expect(screen.queryByText('next')).not.toBeInTheDocument();
    });
    it('changes the API page size, resets to page one and updates pagination visibility', async () => {
        total = 15;
        mount();
        fireEvent.click(await screen.findByText('next'));
        await waitFor(() => expect(fetch.mock.calls.some(([url]) => url.includes('page=2'))).toBe(true));
        await screen.findByRole('row', { name: 'viewRequest #' + id });
        fireEvent.keyDown(screen.getByLabelText('requestsPerPage'), { key: 'ArrowDown' });
        fireEvent.click(await screen.findByText('20'));
        await waitFor(() =>
            expect(
                fetch.mock.calls.some(([url]) => {
                    const params = new URL(url, 'http://localhost').searchParams;
                    return params.get('limit') === '20' && params.get('page') === '1';
                }),
            ).toBe(true),
        );
        await screen.findByRole('row', { name: 'viewRequest #' + id });
        expect(screen.queryByText('next')).not.toBeInTheDocument();
        fireEvent.keyDown(screen.getByLabelText('requestsPerPage'), { key: 'ArrowDown' });
        fireEvent.click(await screen.findByText('5'));
        expect(await screen.findByText('next')).toBeInTheDocument();
        expect(
            fetch.mock.calls.some(([url]) => new URL(url, 'http://localhost').searchParams.get('limit') === '5'),
        ).toBe(true);
    });

    it.each([
        ['vi', '3 thg 11, 2026', '09:00'],
        ['en', 'Nov 3, 2026', '09:00 AM'],
    ])('formats Vietnam submission time in %s like Appointment', async (locale, day, time) => {
        language.current = locale;
        request = { ...request, createdAt: '2026-11-03T02:00:00.000Z' };
        mount();
        const row = await screen.findByRole('row', { name: 'viewRequest #' + id });
        expect(within(row).getByText(day)).toBeInTheDocument();
        expect(within(row).getByText(time)).toBeInTheDocument();
    });

    it.each(['Enter', ' '])('opens a request row using the %s key', async (key) => {
        mount();
        const row = await screen.findByRole('row', { name: 'viewRequest #' + id });
        expect(screen.getAllByRole('columnheader')).toHaveLength(5);
        expect(within(row).getByText('#' + id).parentElement).toHaveAttribute('title', '#' + id);
        expect(within(row).getByText(initial.email)).toHaveAttribute('title', initial.email);
        row.focus();
        fireEvent.keyDown(row, { key });
        const dialog = await screen.findByRole('dialog');
        expect(await within(dialog).findByText('My issue details')).toBeInTheDocument();
    });

    it('opens a request, marks it read and saves a new status with an internal note', async () => {
        mount();
        const modal = await open();
        expect(fetch).toHaveBeenCalledWith(
            '/api/v1/contacts/' + id + '/read',
            expect.objectContaining({ method: 'POST' }),
        );
        fireEvent.keyDown(modal.getByLabelText('status'), { key: 'ArrowDown' });
        fireEvent.click(await modal.findByText('statuses.resolved'));
        fireEvent.change(modal.getByLabelText('note'), { target: { value: 'Issue fixed' } });
        fireEvent.click(modal.getByRole('button', { name: 'save' }));
        await modal.findByText('saved');
        const patch = fetch.mock.calls.find(([, options]) => options.method === 'PATCH');
        expect(JSON.parse(patch[1].body)).toEqual({ version: 0, status: 'resolved', note: 'Issue fixed' });
        expect(modal.getByLabelText('note')).toHaveValue('');
        expect(modal.getByText('Issue fixed')).toBeInTheDocument();
    });
    it('keeps the note on conflict and reloads fresh details before another save', async () => {
        mount();
        const modal = await open();
        fireEvent.change(modal.getByLabelText('note'), { target: { value: 'Keep this draft' } });
        conflict = true;
        fireEvent.click(modal.getByRole('button', { name: 'save' }));
        await modal.findByText('errors.conflict');
        expect(modal.getByLabelText('note')).toHaveValue('Keep this draft');
        request = { ...request, __v: 1, status: 'in-progress' };
        conflict = false;
        fireEvent.click(modal.getByRole('button', { name: 'reloadDetails' }));
        await waitFor(() => expect(modal.getByLabelText('note')).toHaveValue('Keep this draft'));
        expect((await modal.findAllByText('statuses.in-progress')).length).toBeGreaterThan(0);
        fireEvent.click(modal.getByRole('button', { name: 'save' }));
        await modal.findByText('saved');
        const calls = fetch.mock.calls.filter(([, options]) => options.method === 'PATCH');
        expect(JSON.parse(calls[1][1].body)).toMatchObject({
            version: 1,
            status: 'in-progress',
            note: 'Keep this draft',
        });
    });
    it('loads a request linked directly in the URL', async () => {
        mount('/admins/management/support?request=' + id);
        const modal = await screen.findByRole('dialog');
        expect(await within(modal).findByText('My issue details')).toBeInTheDocument();
    });
    it('sends date filters and uses server pagination', async () => {
        total = 25;
        mount();
        await screen.findByRole('row', { name: 'viewRequest #' + id });
        fireEvent.change(screen.getByLabelText('from'), { target: { value: '2026-10-01' } });
        await waitFor(() => expect(fetch.mock.calls.some(([url]) => url.includes('from=2026-10-01'))).toBe(true));
        await screen.findByText('next');
        fireEvent.click(screen.getByText('next'));
        await waitFor(() => expect(fetch.mock.calls.some(([url]) => url.includes('page=2'))).toBe(true));
    });
    it('shows a recoverable list error', async () => {
        fetch.mockRejectedValueOnce(new Error('offline'));
        mount();
        expect(await screen.findByRole('alert')).toHaveTextContent('errors.loadFailed');
        fireEvent.click(screen.getByRole('button', { name: 'refresh' }));
        expect(await screen.findByRole('row', { name: 'viewRequest #' + id })).toBeInTheDocument();
    });
});
