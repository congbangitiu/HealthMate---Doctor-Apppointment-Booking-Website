import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SupportRequests from './SupportRequests';
import { authContext } from '../../context/AuthContext';

vi.mock('../../utils/services/socket', () => ({ default: { on: vi.fn(), off: vi.fn() } }));
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key) => key, i18n: { language: 'en', resolvedLanguage: 'en' } }),
}));
vi.mock('../../../config', () => ({ BASE_URL: '/api/v1' }));
vi.mock('../../components/SupportChat/SupportChat', () => ({
    default: ({ requestId }) => <div>chat:{requestId}</div>,
}));
const id = '507f1f77bcf86cd799439011';
beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn());
    localStorage.removeItem('healthmate.support.guests');
    sessionStorage.clear();
    vi.stubGlobal(
        'fetch',
        vi.fn(async (url) => ({
            ok: true,
            json: async () =>
                url.endsWith('/mine')
                    ? { data: [{ _id: id, category: 'technical', preview: 'I need help with my appointment.' }] }
                    : url.endsWith('/guest-notifications')
                    ? {
                          requests: [{ _id: id, category: 'technical', status: 'in-progress', preview: 'Guest issue' }],
                          data: [],
                      }
                    : { data: { request: { _id: id, category: 'technical', message: 'Original issue' } } },
        })),
    );
});
const Path = () => <output data-testid="path">{useLocation().pathname + useLocation().search}</output>;
const mount = (token, path = '/support-requests?request=' + id) =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <authContext.Provider value={{ token }}>
                <SupportRequests />
                <Path />
            </authContext.Provider>
        </MemoryRouter>,
    );
describe('sender support request entry point', () => {
    it('shows an end-session dialog with only the confirm action and closes without losing guest access', async () => {
        sessionStorage.setItem('healthmate.support.guests', JSON.stringify([{ id, guestToken: 'guest-secret' }]));
        mount(null, '/support-requests');
        await screen.findByRole('button', { name: /Guest issue/ });
        fireEvent.click(screen.getByRole('button', { name: 'endGuestSession' }));
        const dialog = await screen.findByRole('dialog', { name: 'endGuestSession' });
        expect(within(dialog).getByText('endGuestSessionWarning')).toBeInTheDocument();
        expect(screen.queryByRole('dialog', { name: 'recoverRequests' })).not.toBeInTheDocument();
        expect(within(dialog).queryByRole('button', { name: 'cancel' })).not.toBeInTheDocument();
        fireEvent.click(within(dialog).getByRole('button', { name: 'close' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(sessionStorage.getItem('healthmate.support.guests')).toContain('guest-secret');
        expect(screen.getByRole('button', { name: /Guest issue/ })).toBeInTheDocument();
    });
    it('keeps recovery confirmation and cooldown when closing and reopening its dialog', async () => {
        sessionStorage.setItem('healthmate.support.guests', JSON.stringify([{ id, guestToken: 'guest-secret' }]));
        mount(null, '/support-requests');
        await screen.findByRole('button', { name: /Guest issue/ });
        fireEvent.click(screen.getByRole('button', { name: 'recoverRequests' }));
        let dialog = await screen.findByRole('dialog', { name: 'recoverRequests' });
        fireEvent.change(within(dialog).getByLabelText('recoveryEmail'), { target: { value: 'guest@example.test' } });
        fireEvent.click(within(dialog).getByRole('button', { name: 'recoverySend' }));
        expect(await within(dialog).findByRole('status')).toHaveTextContent('guest@example.test');
        fireEvent.click(within(dialog).getByRole('button', { name: 'close' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        fireEvent.click(screen.getByRole('button', { name: 'recoverRequests' }));
        dialog = await screen.findByRole('dialog', { name: 'recoveryCheckInbox' });
        expect(within(dialog).getByRole('heading', { name: 'recoveryCheckInbox' })).toBeInTheDocument();
        expect(within(dialog).getByRole('button', { name: 'recoveryResend' })).toBeDisabled();
        expect(fetch.mock.calls.filter(([url]) => url.endsWith('/guest-recovery'))).toHaveLength(1);
    });
    it('opens recovery in a dialog and restores focus to its trigger when closed', async () => {
        sessionStorage.setItem('healthmate.support.guests', JSON.stringify([{ id, guestToken: 'guest-secret' }]));
        mount(null, '/support-requests');
        await screen.findByRole('button', { name: /Guest issue/ });
        expect(screen.queryByText('guestHint')).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'recoverRequests' })).not.toBeInTheDocument();
        const trigger = screen.getByRole('button', { name: 'recoverRequests' });
        trigger.focus();
        fireEvent.click(trigger);
        const dialog = await screen.findByRole('dialog', { name: 'recoverRequests' });
        expect(within(dialog).getByLabelText('recoveryEmail')).toBeInTheDocument();
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        fireEvent.click(within(dialog).getByRole('button', { name: 'close' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(trigger).toHaveFocus();
    });
    it('explains expired guest access and offers email recovery instead of silently losing requests', async () => {
        sessionStorage.setItem(
            'healthmate.support.guests',
            JSON.stringify([{ id, guestToken: 'guest-secret', expiresAt: new Date(Date.now() - 1000).toISOString() }]),
        );
        mount(null, '/support-requests');
        expect(await screen.findByText('guestSessionExpired')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'recoverRequests' })).toBeInTheDocument();
        expect(screen.queryByText('noRequests')).not.toBeInTheDocument();
    });
    it('offers retry for a temporary detail failure instead of claiming the user has no permission', async () => {
        let failed = true;
        fetch.mockImplementation(async (url) => ({
            ok: url.endsWith('/mine') || !failed,
            status: failed ? 503 : 200,
            json: async () =>
                url.endsWith('/mine')
                    ? { data: [{ _id: id, category: 'technical' }] }
                    : { data: { request: { _id: id, category: 'technical' } } },
        }));
        mount('owner-token');
        expect(await screen.findByRole('alert')).toHaveTextContent('chatFailed');
        expect(screen.queryByText('forbidden')).not.toBeInTheDocument();
        failed = false;
        fireEvent.click(screen.getByRole('button', { name: 'retry' }));
        expect(await screen.findByText('chat:' + id)).toBeInTheDocument();
    });
    it('distinguishes a removed request from a temporary server error', async () => {
        fetch.mockImplementation(async (url) => ({
            ok: url.endsWith('/mine'),
            status: 404,
            json: async () => ({ data: [] }),
        }));
        mount('owner-token');
        expect(await screen.findByRole('alert')).toHaveTextContent('requestNotFound');
        expect(screen.queryByRole('button', { name: 'retry' })).not.toBeInTheDocument();
    });
    it('shows only the recovery card and one contact action for a guest without saved requests', async () => {
        mount(null, '/support-requests');
        expect(await screen.findByRole('heading', { name: 'recoverRequests' })).toBeInTheDocument();
        expect(screen.getByText('guestRecoveryIntro')).toBeInTheDocument();
        expect(screen.getByText('guestSharedDeviceHint')).toBeInTheDocument();
        expect(screen.queryByText('noRequests')).not.toBeInTheDocument();
        expect(screen.queryByRole('navigation', { name: 'myRequests' })).not.toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: 'newRequest' })).toHaveLength(1);
        expect(fetch).not.toHaveBeenCalled();
    });
    it('keeps the empty-list state for a signed-in account without requests', async () => {
        fetch.mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
        mount('owner-token', '/support-requests');
        expect(await screen.findByText('noRequests')).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'recoverRequests' })).not.toBeInTheDocument();
    });
    it('restores guest summaries and ends the session without deleting the saved request on the server', async () => {
        sessionStorage.setItem('healthmate.support.guests', JSON.stringify([{ id, guestToken: 'guest-secret' }]));
        mount(null);
        expect(await screen.findByText('chat:' + id)).toBeInTheDocument();
        expect(await screen.findByRole('button', { name: /Guest issue/ })).toHaveTextContent(
            'supportManagement:statuses.in-progress',
        );
        fireEvent.click(screen.getByRole('button', { name: 'endGuestSession' }));
        expect(screen.getByText('endGuestSessionWarning')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'endGuestSessionConfirm' }));
        await waitFor(() => expect(screen.queryByText('chat:' + id)).not.toBeInTheDocument());
        expect(sessionStorage.getItem('healthmate.support.guests')).toBeNull();
        expect(screen.getByTestId('path')).toHaveTextContent('/support-requests');
        expect(fetch.mock.calls.some(([, options]) => options?.method === 'DELETE')).toBe(false);
    });
    it('keeps guest credentials out of signed-in account request lists and API calls', async () => {
        sessionStorage.setItem(
            'healthmate.support.guests',
            JSON.stringify([{ id: 'guest-only', guestToken: 'guest-secret' }]),
        );
        mount('owner-token', '/support-requests');
        await screen.findByRole('button', { name: /contact:categories.technical/ });
        expect(screen.queryByText('#guest-only')).not.toBeInTheDocument();
        expect(
            fetch.mock.calls.every(
                ([url, options]) => !url.includes('guest-notifications') && !options?.headers?.['X-Support-Token'],
            ),
        ).toBe(true);
    });
    it('starts in the overview and opens a request, then returns without losing other query parameters', async () => {
        mount('owner-token', '/support-requests?keep=yes');
        const card = await screen.findByRole('button', { name: /contact:categories.technical/ });
        expect(screen.queryByRole('region', { name: 'requestDetails' })).not.toBeInTheDocument();
        expect(card).toHaveTextContent('I need help with my appointment.');
        expect(card).toHaveTextContent('#' + id);
        expect(fetch.mock.calls.some(([url]) => url.includes('/conversation'))).toBe(false);
        fireEvent.click(card);
        expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
        expect(await screen.findByText('chat:' + id)).toBeInTheDocument();
        expect(screen.getByTestId('path')).toHaveTextContent('keep=yes&request=' + id);
        expect(card).toHaveAttribute('aria-current', 'true');
        await waitFor(() =>
            expect(screen.getByRole('heading', { name: 'contact:categories.technical' })).toHaveFocus(),
        );
        fireEvent.click(screen.getByRole('button', { name: 'backToRequests' }));
        expect(screen.queryByText('chat:' + id)).not.toBeInTheDocument();
        expect(screen.getByTestId('path')).toHaveTextContent('/support-requests?keep=yes');
        expect(card).toHaveFocus();
    });
    it('keeps the list available when opening an inaccessible conversation', async () => {
        fetch.mockImplementation(async (url) => ({
            ok: url.endsWith('/mine'),
            status: url.endsWith('/mine') ? 200 : 403,
            json: async () => ({ data: [{ _id: id, category: 'technical' }] }),
        }));
        mount('owner-token');
        expect(await screen.findByRole('alert')).toHaveTextContent('forbidden');
        expect(screen.getByRole('button', { name: /contact:categories.technical/ })).toBeInTheDocument();
        expect(screen.queryByText('chat:' + id)).not.toBeInTheDocument();
    });
    it('opens an owning account conversation with the bearer token', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
        mount('owner-token');
        expect(await screen.findByText('chat:' + id)).toBeInTheDocument();
        expect(screen.getAllByText('#' + id)).toHaveLength(2);
        fireEvent.click(screen.getByRole('button', { name: 'supportManagement:copyId' }));
        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'supportManagement:copied' })).toBeInTheDocument(),
        );
        expect(writeText).toHaveBeenCalledWith(id);
        expect(fetch).toHaveBeenCalledWith(
            '/api/v1/contacts/mine',
            expect.objectContaining({ headers: { Authorization: 'Bearer owner-token' } }),
        );
    });
    it('sends guest access in a header and never in a URL', async () => {
        sessionStorage.setItem('healthmate.support.guests', JSON.stringify([{ id, guestToken: 'guest-secret' }]));
        mount(null);
        expect(await screen.findByText('chat:' + id)).toBeInTheDocument();
        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(
                '/api/v1/contacts/' + id + '/conversation',
                expect.objectContaining({ headers: { 'X-Support-Token': 'guest-secret' } }),
            ),
        );
        expect(fetch.mock.calls.every(([url]) => !url.includes('guest-secret'))).toBe(true);
    });
});
