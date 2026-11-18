import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Contact from './Contact';
import { authContext } from '../../context/AuthContext';
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, options) => (key === 'success' ? `success ${options.id}` : key),
        i18n: { language: 'en' },
    }),
}));
vi.mock('../../components/Recaptcha/Recaptcha', () => ({
    default: ({ onChange }) => (
        <button type="button" onClick={() => onChange('captcha-token')}>
            Verify CAPTCHA
        </button>
    ),
}));
vi.mock('../../../config', () => ({ BASE_URL: '/api/v1' }));
const mount = (identity = {}) =>
    render(
        <MemoryRouter><authContext.Provider value={identity}>
            <Contact />
        </authContext.Provider></MemoryRouter>,
    );
async function choose(label) {
    fireEvent.keyDown(screen.getByLabelText('subject'), { key: 'ArrowDown' });
    fireEvent.click(await screen.findByText(`categories.${label}`));
}
async function fillGuest() {
    fireEvent.change(screen.getByLabelText('fullname'), { target: { value: 'Guest' } });
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'guest@example.com' } });
    fireEvent.change(screen.getByLabelText('phone'), { target: { value: '0901234567' } });
    fireEvent.change(screen.getByLabelText('message'), { target: { value: 'Help please' } });
    await choose('technical');
    fireEvent.click(screen.getByText('Verify CAPTCHA'));
}
beforeEach(() => {
    vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', 'site-key');
    vi.stubGlobal('fetch', vi.fn());
    window.scrollTo = vi.fn();
});
describe('Contact', () => {
    it('shows the custom subject only for Other and discards it when category changes', async () => {
        mount();
        expect(screen.queryByLabelText('otherSubject')).not.toBeInTheDocument();
        await choose('other');
        fireEvent.change(screen.getByLabelText('otherSubject'), { target: { value: 'Custom title' } });
        await choose('technical');
        expect(screen.queryByLabelText('otherSubject')).not.toBeInTheDocument();
        await choose('other');
        expect(screen.getByLabelText('otherSubject')).toHaveValue('');
    });
    it.each(['doctor', 'patient'])('loads editable %s contact details from the database', async (role) => {
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ data: { fullname: 'Database Name', email: 'db@example.com' } }),
        });
        mount({ token: 'signed-token', role });
        await waitFor(() => expect(screen.getByLabelText('fullname')).toHaveValue('Database Name'));
        expect(fetch).toHaveBeenCalledWith(
            `/api/v1/${role === 'doctor' ? 'doctors' : 'users'}/profile/me`,
            expect.objectContaining({
                headers: { Authorization: 'Bearer signed-token' },
            }),
        );
        expect(screen.getByLabelText('phone')).toHaveValue('');
        fireEvent.change(screen.getByLabelText('fullname'), { target: { value: 'Edited Name' } });
        expect(screen.getByLabelText('fullname')).toHaveValue('Edited Name');
    });
    it('keeps the draft on failure and clears issue fields after a successful retry', async () => {
        fetch
            .mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ code: 'captchaInvalid' }) })
            .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ data: { id: 'request-1' } }) });
        mount();
        await fillGuest();
        fireEvent.submit(screen.getByLabelText('message').closest('form'));
        await screen.findByText('errors.captchaInvalid');
        expect(screen.getByLabelText('message')).toHaveValue('Help please');
        expect(screen.getByRole('button', { name: 'submit' })).toBeDisabled();
        fireEvent.click(screen.getByText('Verify CAPTCHA'));
        fireEvent.submit(screen.getByLabelText('message').closest('form'));
        await screen.findByText('request-1');
        expect(screen.getByLabelText('message')).toHaveValue('');
        expect(screen.getByLabelText('fullname')).toHaveValue('Guest');
        const payload = JSON.parse(fetch.mock.calls[1][1].body);
        expect(payload).toMatchObject({ category: 'technical', subject: '', captchaToken: 'captcha-token' });
    });
    it('shows a retry action when profile loading fails', async () => {
        fetch.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { fullname: 'Recovered', email: 'db@example.com' } }),
        });
        mount({ token: 'signed-token', role: 'doctor' });
        await screen.findByText('profileError');
        fireEvent.click(screen.getByText('retry'));
        await waitFor(() => expect(screen.getByLabelText('fullname')).toHaveValue('Recovered'));
    });
});
