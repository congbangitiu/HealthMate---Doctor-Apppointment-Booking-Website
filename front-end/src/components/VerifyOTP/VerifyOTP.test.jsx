import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, configure, getConfig, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../../../config', () => ({ BASE_URL: 'http://localhost:5000/api/v1' }));
vi.mock('react-toastify', () => ({ toast: mocks }));
vi.mock('react-spinners/SyncLoader', () => ({ default: () => <span role="status">Loading</span> }));
import VerifyOTP from './VerifyOTP';

const base = 'http://localhost:5000/api/v1';
const formData = {
    email: 'patient@example.test', fullname: 'Test Patient', username: 'patient', phone: '0901234567',
    password: 'Password1', confirmedPassword: 'Password1', role: 'patient', photo: 'photo.jpg', gender: 'female',
};
const props = (overrides = {}) => ({ formData, tab: 'email', onVerified: vi.fn(), ...overrides });
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, text: vi.fn().mockResolvedValue(JSON.stringify(body)) });
const deferred = () => {
    let resolve;
    const promise = new Promise((finish) => { resolve = finish; });
    return { promise, resolve };
};
let fetchMock;
let user;

// RTL's default async wrapper waits for a real zero-delay timeout. With Vitest fake
// timers, wrap interactions in async act instead and restore the wrapper after this suite.
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
    mocks.success.mockClear();
    mocks.error.mockClear();
    window.history.replaceState({}, '', '/');
});

async function enterOTP(code) {
    // Exercise the six actual otp-input-react inputs, including its focus/change behavior.
    const inputs = document.querySelectorAll('input');
    expect(inputs).toHaveLength(6);
    for (let index = 0; index < code.length; index++) await user.type(inputs[index], code[index]);
}

async function tick(seconds) {
    for (let index = 0; index < seconds; index++) await act(async () => { vi.advanceTimersByTime(1000); });
}

describe('VerifyOTP', () => {
    it('FE-O01: enables verification only when all six OTP digits have been entered', async () => {
        render(<VerifyOTP {...props()} />);
        expect(screen.getByRole('button', { name: 'Verify OTP' })).toBeDisabled();
        await enterOTP('12345');
        expect(screen.getByRole('button', { name: 'Verify OTP' })).toBeDisabled();
        await user.type(document.querySelectorAll('input')[5], '6');
        expect(screen.getByRole('button', { name: 'Verify OTP' })).toBeEnabled();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('FE-O02: sends the custom verification payload and passes the full response to onVerified', async () => {
        const data = { resetToken: 'reset-token', message: 'Verified' };
        fetchMock.mockResolvedValue(response(data));
        const options = props({ endpoint: '/auth/forgot-password/verify', buildPayload: vi.fn((otp) => ({ email: formData.email, otp })) });
        render(<VerifyOTP {...options} />);
        await enterOTP('123456');
        await user.click(screen.getByRole('button', { name: 'Verify OTP' }));
        expect(options.buildPayload).toHaveBeenCalledWith('123456');
        expect(fetchMock).toHaveBeenCalledWith(`${base}/auth/forgot-password/verify`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email, otp: '123456' }),
        });
        expect(options.onVerified).toHaveBeenCalledWith(data);
        expect(mocks.success).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Verify OTP' })).toBeEnabled();
    });

    it('FE-O03: posts all registration fields to the default endpoint', async () => {
        fetchMock.mockResolvedValue(response({ success: true }));
        render(<VerifyOTP {...props()} />);
        await enterOTP('654321');
        await user.click(screen.getByRole('button', { name: 'Verify OTP' }));
        expect(fetchMock.mock.calls[0][0]).toBe(`${base}/auth/register-verify-otp`);
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ ...formData, otp: '654321' });
    });

    it.each([
        ['error field', { error: 'OTP expired', message: 'Other message' }, 400, 'OTP expired'],
        ['message field', { message: 'Too many attempts' }, 429, 'Too many attempts'],
        ['fallback', {}, 500, 'Verification failed'],
        ['HTML', '<html>Error</html>', 502, 'Server returned an unexpected response (HTTP 502). Please try again later!'],
        ['network', null, 0, 'Network unavailable'],
    ])('FE-O04: reports a %s failure without calling onVerified', async (kind, body, status, message) => {
        if (kind === 'network') fetchMock.mockRejectedValue(new Error(message));
        else if (kind === 'HTML') fetchMock.mockResolvedValue({ ok: false, status, text: vi.fn().mockResolvedValue(body) });
        else fetchMock.mockResolvedValue(response(body, status));
        const options = props();
        render(<VerifyOTP {...options} />);
        await enterOTP('123456');
        await user.click(screen.getByRole('button', { name: 'Verify OTP' }));
        expect(mocks.error).toHaveBeenCalledWith(message);
        expect(options.onVerified).not.toHaveBeenCalled();
        expect(mocks.success).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Verify OTP' })).toBeEnabled();
    });

    it('FE-O05: announces registration success and waits two seconds before finishing the default login flow', async () => {
        // Same-URL assignment is supported by jsdom; actual navigation remains a browser test.
        window.history.replaceState({}, '', '/login');
        const timer = vi.spyOn(globalThis, 'setTimeout');
        fetchMock.mockResolvedValue(response({ success: true }));
        render(<VerifyOTP {...props({ onVerified: undefined })} />);
        await enterOTP('123456');
        await user.click(screen.getByRole('button', { name: 'Verify OTP' }));
        expect(mocks.success).toHaveBeenCalledWith('Account created successfully!');
        expect(timer).toHaveBeenCalledWith(expect.any(Function), 2000);
        expect(screen.getByRole('status')).toBeInTheDocument();
        await act(async () => { vi.advanceTimersByTime(1999); });
        expect(screen.getByRole('status')).toBeInTheDocument();
        await act(async () => { vi.advanceTimersByTime(1); });
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(mocks.error).not.toHaveBeenCalled();
    });

    it('FE-O06: exposes resend only after the initial cooldown reaches zero', async () => {
        render(<VerifyOTP {...props({ initialCooldown: 2, onResend: vi.fn() })} />);
        expect(screen.getByText('Resend OTP in 2s')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Resend OTP' })).not.toBeInTheDocument();
        await tick(1);
        expect(screen.getByText('Resend OTP in 1s')).toBeInTheDocument();
        await tick(1);
        expect(screen.getByRole('button', { name: 'Resend OTP' })).toBeEnabled();
    });

    it('FE-O07: clears OTP and resets the cooldown only after resend resolves', async () => {
        const pending = deferred();
        const onResend = vi.fn(() => pending.promise);
        render(<VerifyOTP {...props({ initialCooldown: 0, resendCooldown: 3, onResend })} />);
        await enterOTP('123456');
        const button = screen.getByRole('button', { name: 'Resend OTP' });
        await user.click(button);
        expect(onResend).toHaveBeenCalledTimes(1);
        expect(button).toBeDisabled();
        expect([...document.querySelectorAll('input')].map((input) => input.value).join('')).toBe('123456');
        await act(async () => { pending.resolve(); await pending.promise; });
        expect([...document.querySelectorAll('input')].every((input) => input.value === '')).toBe(true);
        expect(screen.getByRole('button', { name: 'Verify OTP' })).toBeDisabled();
        expect(screen.getByText('Resend OTP in 3s')).toBeInTheDocument();
        await tick(3);
        expect(screen.getByRole('button', { name: 'Resend OTP' })).toBeEnabled();
    });

    it('FE-O08: preserves the OTP and permits retry after resend rejects', async () => {
        const onResend = vi.fn().mockRejectedValue(new Error('Resend unavailable'));
        render(<VerifyOTP {...props({ initialCooldown: 0, onResend })} />);
        await enterOTP('123456');
        await user.click(screen.getByRole('button', { name: 'Resend OTP' }));
        expect(mocks.error).toHaveBeenCalledWith('Resend unavailable');
        expect([...document.querySelectorAll('input')].map((input) => input.value).join('')).toBe('123456');
        expect(screen.getByRole('button', { name: 'Resend OTP' })).toBeEnabled();
        expect(screen.queryByText(/Resend OTP in/)).not.toBeInTheDocument();
    });

    it.each([17, 0])('FE-O11: applies retryAfter %i returned by onResend', async (retryAfter) => {
        const onResend = vi.fn().mockResolvedValue({ retryAfter });
        render(<VerifyOTP {...props({ initialCooldown: 0, resendCooldown: 60, onResend })} />);
        await user.click(screen.getByRole('button', { name: 'Resend OTP' }));
        if (retryAfter === 0) {
            expect(screen.getByRole('button', { name: 'Resend OTP' })).toBeEnabled();
            expect(screen.queryByText(/Resend OTP in/)).not.toBeInTheDocument();
        } else expect(screen.getByText('Resend OTP in 17s')).toBeInTheDocument();
    });

    it('FE-O09: cancels the countdown timeout on unmount', async () => {
        const onResend = vi.fn();
        const timer = vi.spyOn(globalThis, 'setTimeout');
        const clearTimer = vi.spyOn(globalThis, 'clearTimeout');
        const view = render(<VerifyOTP {...props({ initialCooldown: 2, onResend })} />);
        // React and the real OTP input may own other timers; inspect only the countdown.
        const countdownIndex = timer.mock.calls.findIndex(([, delay]) => delay === 1000);
        expect(countdownIndex).toBeGreaterThanOrEqual(0);
        const countdownId = timer.mock.results[countdownIndex].value;
        view.unmount();
        expect(clearTimer).toHaveBeenCalledWith(countdownId);
        timer.mockClear();
        await tick(3);
        expect(timer).not.toHaveBeenCalledWith(expect.any(Function), 1000);
        expect(onResend).not.toHaveBeenCalled();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('FE-O10: renders no resend control or countdown without an onResend callback', () => {
        const timer = vi.spyOn(globalThis, 'setTimeout');
        render(<VerifyOTP {...props({ initialCooldown: 2 })} />);
        expect(screen.queryByRole('button', { name: 'Resend OTP' })).not.toBeInTheDocument();
        expect(screen.queryByText(/Resend OTP in/)).not.toBeInTheDocument();
        expect(timer).not.toHaveBeenCalledWith(expect.any(Function), 1000);
    });

    it.todo('FE-O05: verifies actual navigation to login after registration in a browser');
});
