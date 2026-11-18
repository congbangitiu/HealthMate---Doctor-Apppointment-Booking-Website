import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GuestSupportRecovery from './GuestSupportRecovery';
const locale = vi.hoisted(() => ({ language: 'en', resolvedLanguage: 'en' }));
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, options) => (key === 'recoveryCountdown' ? key + ' ' + options.time : key),
        i18n: locale,
    }),
}));
vi.mock('../../../config', () => ({ BASE_URL: '/api/v1' }));
beforeEach(() => {
    locale.language = locale.resolvedLanguage = 'en';
    vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({ ok: true })),
    );
});
describe('guest recovery email form', () => {
    it('keeps recovery compact when a guest already has requests, and expands on demand', () => {
        render(<GuestSupportRecovery collapsible />);
        expect(screen.queryByLabelText('recoveryEmail')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'recoveryOtherRequests' }));
        expect(screen.getByLabelText('recoveryEmail')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'close' }));
        expect(screen.queryByLabelText('recoveryEmail')).not.toBeInTheDocument();
    });
    it('replaces the form with confirmation, and preserves the address and cooldown when changing email', async () => {
        render(<GuestSupportRecovery />);
        fireEvent.change(screen.getByLabelText('recoveryEmail'), { target: { value: 'guest@example.test' } });
        fireEvent.click(screen.getByRole('button', { name: 'recoverySend' }));
        const confirmation = await screen.findByRole('status');
        expect(confirmation).toHaveTextContent('guest@example.test');
        expect(screen.queryByLabelText('recoveryEmail')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'recoveryChangeEmail' }));
        expect(screen.getByLabelText('recoveryEmail')).toHaveValue('guest@example.test');
        expect(screen.getByLabelText('recoveryEmail')).toHaveFocus();
        expect(screen.getByRole('button', { name: 'recoverySend' })).toBeDisabled();
        expect(fetch).toHaveBeenCalledOnce();
    });
    it.each(['en', 'vi'])('requests a link in the selected %s language without an account token', async (language) => {
        locale.language = locale.resolvedLanguage = language;
        render(<GuestSupportRecovery />);
        fireEvent.change(screen.getByLabelText('recoveryEmail'), { target: { value: 'guest@example.test' } });
        fireEvent.click(screen.getByRole('button', { name: 'recoverySend' }));
        expect(await screen.findByRole('status')).toHaveTextContent('recoverySentIntro');
        expect(fetch).toHaveBeenCalledWith(
            '/api/v1/contacts/guest-recovery',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'guest@example.test', language }),
            }),
        );
        expect(screen.getByRole('button', { name: 'recoveryResend' })).toBeDisabled();
    });
    it('keeps the email on a request failure and allows retry', async () => {
        fetch.mockRejectedValue(new Error('offline'));
        render(<GuestSupportRecovery />);
        fireEvent.change(screen.getByLabelText('recoveryEmail'), { target: { value: 'guest@example.test' } });
        fireEvent.click(screen.getByRole('button', { name: 'recoverySend' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('recoveryUnavailable');
        expect(screen.getByLabelText('recoveryEmail')).toHaveValue('guest@example.test');
        expect(screen.getByRole('button', { name: 'recoverySend' })).toBeEnabled();
    });
    it('prevents duplicate sending and enables resend only after the cooldown', async () => {
        vi.useFakeTimers();
        try {
            render(<GuestSupportRecovery />);
            fireEvent.change(screen.getByLabelText('recoveryEmail'), { target: { value: 'guest@example.test' } });
            await act(async () => fireEvent.click(screen.getByRole('button', { name: 'recoverySend' })));
            expect(screen.getByRole('button', { name: 'recoveryResend' })).toBeDisabled();
            expect(screen.getByText('recoveryCountdown 01:00')).toBeInTheDocument();
            await act(async () => vi.advanceTimersByTime(1000));
            expect(screen.getByText('recoveryCountdown 00:59')).toBeInTheDocument();
            await act(async () => vi.advanceTimersByTime(59000));
            expect(screen.getByRole('button', { name: 'recoveryResend' })).toBeEnabled();
            expect(fetch).toHaveBeenCalledOnce();
        } finally {
            vi.useRealTimers();
        }
    });
});
