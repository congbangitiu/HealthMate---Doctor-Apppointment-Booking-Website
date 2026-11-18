import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GuestSupportRecovery from './GuestSupportRecovery';
import { authContext } from '../../context/AuthContext';
import { getGuestRequests } from '../../utils/services/supportRequests';
const locale = vi.hoisted(() => ({ language: 'en', resolvedLanguage: 'en', changeLanguage: vi.fn() }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: locale }) }));
vi.mock('../../../config', () => ({ BASE_URL: '/api/v1' }));
vi.mock('../../components/Loader/Loader', () => ({ default: () => <div>loading</div> }));
const rawToken = 'a'.repeat(64);
const Path = () => {
    const location = useLocation();
    return <output data-testid="path">{location.pathname + location.search + location.hash}</output>;
};
const mount = (accountToken = null, link = '/support-requests/recover?language=vi#token=' + rawToken) =>
    render(
        <authContext.Provider value={{ token: accountToken }}>
            <MemoryRouter initialEntries={[link]}>
                <Routes>
                    <Route
                        path="/support-requests/recover"
                        element={
                            <>
                                <GuestSupportRecovery />
                                <Path />
                            </>
                        }
                    />
                    <Route
                        path="/support-requests"
                        element={
                            <>
                                <div>requests restored</div>
                                <Path />
                            </>
                        }
                    />
                </Routes>
            </MemoryRouter>
        </authContext.Provider>,
    );
beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    locale.language = locale.resolvedLanguage = 'en';
    locale.changeLanguage.mockImplementation(async (language) => {
        locale.language = locale.resolvedLanguage = language;
    });
    vi.stubGlobal(
        'fetch',
        vi.fn(async (url) => ({
            ok: true,
            json: async () =>
                url.endsWith('/inspect')
                    ? { success: true, language: 'vi' }
                    : { success: true, data: { requests: [{ id: 'request-a', guestToken: 'restored-token' }] } },
        })),
    );
});
describe('guest email access confirmation', () => {
    it('can refresh the cleaned confirmation URL without losing its unused token', async () => {
        const first = mount();
        await screen.findByRole('button', { name: 'recoveryContinue' });
        first.unmount();
        mount(null, '/support-requests/recover?language=vi');
        expect(await screen.findByRole('button', { name: 'recoveryContinue' })).toBeInTheDocument();
        expect(fetch.mock.calls.filter(([url]) => url.endsWith('/confirm'))).toHaveLength(0);
        const requests = fetch.mock.calls.filter(([url]) => url.endsWith('/inspect'));
        expect(requests).toHaveLength(2);
        expect(requests[1][1].body).toBe(JSON.stringify({ token: rawToken }));
    });
    it('retries a failed inspection without demanding another email link', async () => {
        fetch.mockRejectedValueOnce(new Error('offline'));
        mount();
        expect(await screen.findByRole('alert')).toHaveTextContent('recoveryUnavailable');
        expect(screen.queryByRole('button', { name: 'recoverySend' })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'retry' }));
        expect(await screen.findByRole('button', { name: 'recoveryContinue' })).toBeInTheDocument();
    });
    it('removes the secret fragment, checks the link without consuming it, and waits for an explicit confirmation', async () => {
        mount();
        const confirm = await screen.findByRole('button', { name: 'recoveryContinue' });
        expect(screen.getByTestId('path')).toHaveTextContent('/support-requests/recover?language=vi');
        expect(screen.getByTestId('path')).not.toHaveTextContent(rawToken);
        expect(locale.changeLanguage).toHaveBeenCalledWith('vi');
        expect(fetch.mock.calls.every(([url]) => !url.includes(rawToken) && !url.endsWith('/confirm'))).toBe(true);
        expect(getGuestRequests()).toEqual([]);
        fireEvent.click(confirm);
        expect(await screen.findByText('requests restored')).toBeInTheDocument();
        expect(fetch).toHaveBeenCalledWith(
            '/api/v1/contacts/guest-recovery/confirm',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ token: rawToken }),
            }),
        );
        expect(getGuestRequests()).toEqual([{ id: 'request-a', guestToken: 'restored-token' }]);
    });
    it('shows a resend form for an expired or already used link and does not issue a session', async () => {
        fetch.mockResolvedValue({ ok: false, status: 400, json: async () => ({ code: 'recoveryInvalid' }) });
        mount();
        expect(await screen.findByRole('alert')).toHaveTextContent('recoveryInvalid');
        expect(sessionStorage.getItem('healthmate.support.recovery')).toBeNull();
        expect(screen.getByRole('button', { name: 'recoverySend' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'recoveryContinue' })).not.toBeInTheDocument();
        expect(getGuestRequests()).toEqual([]);
    });
    it('handles another tab consuming the link between inspection and confirmation', async () => {
        fetch.mockImplementation(async (url) => ({
            ok: url.endsWith('/inspect'),
            status: url.endsWith('/inspect') ? 200 : 400,
            json: async () => ({ language: 'en' }),
        }));
        mount();
        fireEvent.click(await screen.findByRole('button', { name: 'recoveryContinue' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('recoveryInvalid');
        expect(getGuestRequests()).toEqual([]);
    });
    it('does not switch a signed-in account into a guest session', async () => {
        mount('account-token');
        expect(screen.getByText('recoverySignedIn')).toHaveAttribute('role', 'status');
        await waitFor(() => expect(fetch).toHaveBeenCalled());
        expect(screen.queryByRole('button', { name: 'recoveryContinue' })).not.toBeInTheDocument();
        expect(fetch.mock.calls.every(([url]) => !url.endsWith('/confirm'))).toBe(true);
        expect(getGuestRequests()).toEqual([]);
    });
});
