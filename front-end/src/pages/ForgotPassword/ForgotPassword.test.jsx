import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, configure, getConfig, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('../../../config', () => ({ BASE_URL: 'http://localhost:5000/api/v1' }));
vi.mock('react-toastify', () => ({ toast: mocks }));
vi.mock('react-spinners/SyncLoader', () => ({ default: () => <span role="status">Loading</span> }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, values) =>
    key === 'resendIn' ? `Resend in ${values.seconds}s` : key,
}) }));
import ForgotPassword from './ForgotPassword';

const base = 'http://localhost:5000/api/v1';
const email = 'patient@example.test';
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, text: vi.fn().mockResolvedValue(JSON.stringify(body)) });
let fetchMock;
let user;

// Avoid RTL's real zero-delay wait under Vitest fake timers; flush React updates
// with async act for each user interaction and restore the wrapper afterwards.
const originalAsyncWrapper = getConfig().asyncWrapper;
beforeAll(() => configure({ asyncWrapper: async (action) => {
    let result;
    await act(async () => { result = await action(); });
    return result;
} }));
afterAll(() => configure({ asyncWrapper: originalAsyncWrapper }));

beforeEach(() => {
    vi.useFakeTimers();
    user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('scrollTo', vi.fn());
    Object.values(mocks).forEach((mock) => mock.mockClear());
    window.history.replaceState({}, '', '/');
});

function renderPage(state = { email }) {
    return render(<MemoryRouter initialEntries={[{ pathname: '/forgot-password', state }]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ForgotPassword />
    </MemoryRouter>);
}

async function enterOTP() {
    const inputs = document.querySelectorAll('input');
    expect(inputs).toHaveLength(6);
    for (let index = 0; index < 6; index++) await user.type(inputs[index], String(index + 1));
}

async function reachResetStep() {
    fetchMock.mockResolvedValueOnce(response({ message: 'OTP sent' }))
        .mockResolvedValueOnce(response({ resetToken: 'reset-token' }));
    renderPage();
    await user.click(screen.getByRole('button', { name: 'sendOtp' }));
    await enterOTP();
    await user.click(screen.getByRole('button', { name: 'verify' }));
    expect(screen.getByPlaceholderText('newPasswordPlaceholder')).toBeInTheDocument();
    fetchMock.mockClear();
    mocks.success.mockClear();
}

async function fillPasswords(password = 'Password1', confirmation = password) {
    await user.type(screen.getByPlaceholderText('newPasswordPlaceholder'), password);
    await user.type(screen.getByPlaceholderText('confirmPasswordPlaceholder'), confirmation);
}

describe('ForgotPassword', () => {
    it('FE-F01: pre-fills the email received from router state and links back to login', () => {
        renderPage();
        expect(screen.getByPlaceholderText('emailPlaceholder')).toHaveValue(email);
        expect(screen.getByRole('link', { name: 'backToLogin' })).toHaveAttribute('href', '/login');
    });

    it('FE-F01: starts with an empty email when router state is absent', () => {
        renderPage(null);
        expect(screen.getByPlaceholderText('emailPlaceholder')).toHaveValue('');
    });

    it('FE-F02: posts the email and renders the real OTP component with a sixty-second cooldown', async () => {
        fetchMock.mockResolvedValue(response({ message: 'OTP sent' }));
        renderPage();
        await user.click(screen.getByRole('button', { name: 'sendOtp' }));
        expect(fetchMock).toHaveBeenCalledWith(`${base}/auth/forgot-password`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
        });
        expect(screen.getByText('Resend in 60s')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'verify' })).toBeDisabled();
        expect(mocks.success).toHaveBeenCalledWith('OTP sent');
        expect(screen.queryByPlaceholderText('emailPlaceholder')).not.toBeInTheDocument();
    });

    it('FE-F03: accepts HTTP 429 and uses the server retryAfter for the initial OTP countdown', async () => {
        fetchMock.mockResolvedValue(response({ message: 'Please wait', retryAfter: 17 }, 429));
        renderPage();
        await user.click(screen.getByRole('button', { name: 'sendOtp' }));
        expect(screen.getByText('Resend in 17s')).toBeInTheDocument();
        expect(mocks.info).toHaveBeenCalledWith('Please wait');
        expect(mocks.error).not.toHaveBeenCalled();
    });

    it.each([
        ['HTTP 400', 400, 'Unknown email'], ['HTTP 500', 500, 'Service unavailable'],
        ['network', 0, 'Network unavailable'],
        ['HTML', 502, 'Server returned an unexpected response (HTTP 502). Please try again later!'],
    ])('FE-F04: keeps the email step and stops loading after a %s failure', async (kind, status, message) => {
        if (kind === 'network') fetchMock.mockRejectedValue(new Error(message));
        else if (kind === 'HTML') fetchMock.mockResolvedValue({ ok: false, status, text: vi.fn().mockResolvedValue('<html>Error</html>') });
        else fetchMock.mockResolvedValue(response({ message }, status));
        renderPage();
        await user.click(screen.getByRole('button', { name: 'sendOtp' }));
        expect(mocks.error).toHaveBeenCalledWith(message);
        expect(screen.getByRole('button', { name: 'sendOtp' })).toBeEnabled();
        expect(screen.getByPlaceholderText('emailPlaceholder')).toHaveValue(email);
        expect(screen.queryByPlaceholderText('newPasswordPlaceholder')).not.toBeInTheDocument();
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('FE-F05: verifies OTP with email and enters the password reset step using the returned token', async () => {
        fetchMock.mockResolvedValueOnce(response({ message: 'OTP sent' }))
            .mockResolvedValueOnce(response({ resetToken: 'reset-token' }));
        renderPage();
        await user.click(screen.getByRole('button', { name: 'sendOtp' }));
        await enterOTP();
        await user.click(screen.getByRole('button', { name: 'verify' }));
        expect(fetchMock).toHaveBeenNthCalledWith(2, `${base}/auth/forgot-password/verify`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp: '123456' }),
        });
        expect(mocks.success).toHaveBeenCalledWith('otpVerified');
        expect(screen.getByPlaceholderText('newPasswordPlaceholder')).toHaveValue('');
        expect(screen.queryByText(/Resend in/)).not.toBeInTheDocument();
    });

    it('FE-F06: rejects mismatching passwords without calling the reset API', async () => {
        await reachResetStep();
        await fillPasswords('Password1', 'Password2');
        await user.click(screen.getByRole('button', { name: 'submit' }));
        expect(mocks.error).toHaveBeenCalledWith('mismatch');
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each(['Abc1234', 'Password', '12345678'])(
        'FE-F07: rejects weak password %s without calling the reset API', async (password) => {
            await reachResetStep();
            await fillPasswords(password);
            await user.click(screen.getByRole('button', { name: 'submit' }));
            expect(mocks.error).toHaveBeenCalledWith('weakPassword');
            expect(fetchMock).not.toHaveBeenCalled();
        },
    );

    it('FE-F08: accepts the eight-character boundary and schedules login after 1500 milliseconds', async () => {
        await reachResetStep();
        const timer = vi.spyOn(globalThis, 'setTimeout');
        fetchMock.mockResolvedValueOnce(response({ message: 'Password updated' }));
        await fillPasswords('Abcd1234');
        await user.click(screen.getByRole('button', { name: 'submit' }));
        expect(fetchMock).toHaveBeenCalledWith(`${base}/auth/forgot-password/reset`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resetToken: 'reset-token', newPassword: 'Abcd1234', confirmedPassword: 'Abcd1234' }),
        });
        expect(mocks.success).toHaveBeenCalledWith('Password updated');
        expect(timer).toHaveBeenCalledWith(expect.any(Function), 1500);
        expect(screen.getByRole('button')).toBeDisabled();
        // The callback is not executed here: jsdom cannot verify cross-page navigation.
    });

    it.each([401, 500])('FE-F09: keeps the reset form and allows retry after HTTP %i', async (status) => {
        await reachResetStep();
        const timer = vi.spyOn(globalThis, 'setTimeout');
        fetchMock.mockResolvedValueOnce(response({ message: 'Reset rejected' }, status));
        await fillPasswords();
        await user.click(screen.getByRole('button', { name: 'submit' }));
        expect(mocks.error).toHaveBeenCalledWith('Reset rejected');
        expect(screen.getByRole('button', { name: 'submit' })).toBeEnabled();
        expect(screen.getByPlaceholderText('newPasswordPlaceholder')).toHaveValue('Password1');
        expect(mocks.success).not.toHaveBeenCalled();
        expect(timer).not.toHaveBeenCalledWith(expect.any(Function), 1500);
    });

    it.each([{}, { resetToken: null }, { resetToken: '' }, { resetToken: '  ' }, { resetToken: 123 }])(
        'FE-F10: does not advance to password reset with an invalid verification response: %j', async (data) => {
        fetchMock.mockResolvedValueOnce(response({ message: 'OTP sent' })).mockResolvedValueOnce(response(data));
        renderPage();
        await user.click(screen.getByRole('button', { name: 'sendOtp' }));
        await enterOTP();
        await user.click(screen.getByRole('button', { name: 'verify' }));
        expect(screen.queryByPlaceholderText('newPasswordPlaceholder')).not.toBeInTheDocument();
        expect(mocks.success).not.toHaveBeenCalledWith('otpVerified');
        expect(mocks.error).toHaveBeenCalledWith('invalidVerification');
        expect(screen.getByRole('button', { name: 'verify' })).toBeEnabled();
    });

    it('FE-F11: respects the server retryAfter on repeated HTTP 429 resend responses', async () => {
        fetchMock.mockResolvedValueOnce(response({ message: 'Wait', retryAfter: 1 }, 429))
            .mockResolvedValueOnce(response({ message: 'Still waiting', retryAfter: 17 }, 429))
            .mockResolvedValueOnce(response({ message: 'Wait again', retryAfter: 17 }, 429));
        renderPage();
        await user.click(screen.getByRole('button', { name: 'sendOtp' }));
        await act(async () => { vi.advanceTimersByTime(1000); });
        await user.click(screen.getByRole('button', { name: 'resend' }));
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(screen.queryByText('Resend in 17s')).toBeInTheDocument();
        for (let index = 0; index < 17; index++) await act(async () => { vi.advanceTimersByTime(1000); });
        await user.click(screen.getByRole('button', { name: 'resend' }));
        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(screen.getByText('Resend in 17s')).toBeInTheDocument();
    });

    it.todo('FE-F08: verifies actual navigation to login after a password reset in a browser');
});
