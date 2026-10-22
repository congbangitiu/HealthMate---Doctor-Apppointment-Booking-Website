import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../../../../config', () => ({ BASE_URL: 'http://localhost:5000/api/v1', token: 'unit-token' }));
vi.mock('react-toastify', () => ({ toast: { success: mocks.success, error: mocks.error } }));
vi.mock('../../../utils/date-time/formatDateForDisplay', () => ({ default: (date) => String(date) }));
vi.mock('../../../utils/date-time/convertTime', () => ({ default: (time) => time }));
vi.mock('react-spinners/SyncLoader', () => ({ default: () => <span role="status">Booking in progress</span> }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => ({
    'confirmBooking.confirmButton': 'Confirm booking',
    'confirmBooking.cash': 'Cash', 'confirmBooking.eWallet': 'E-Wallet',
    'confirmBooking.toast.noSlot': 'Please select a slot',
    'confirmBooking.toast.noPayment': 'Please select a payment method',
    'confirmBooking.toast.invalidSession': 'Your session is invalid. Please sign in again.',
    'confirmBooking.toast.bookingSuccess': 'Booking created',
    'confirmBooking.toast.createBookingFail': 'Booking failed',
    'confirmBooking.toast.checkoutFail': 'Checkout failed',
    'confirmBooking.toast.chatFail': 'Chat failed',
}[key] || key) }) }));

import ConfirmBooking from './ConfirmBooking';

const base = 'http://localhost:5000/api/v1';
const slot = { day: '2026-10-22', startingTime: '08:00', endingTime: '08:30' };
const otherSlot = { ...slot, startingTime: '09:00', endingTime: '09:30' };
const props = (overrides = {}) => ({
    doctorId: 'doctor-id', doctorName: 'Test Doctor', doctorPhoto: 'doctor.jpg',
    selectedSlot: slot, ticketPrice: 25, setTimeSlots: vi.fn(), ...overrides,
});
const jsonResponse = (body, ok = true) => ({ ok, json: vi.fn().mockResolvedValue(body) });
const deferred = () => {
    let resolve;
    const promise = new Promise((finish) => { resolve = finish; });
    return { promise, resolve };
};
let fetchMock;

beforeEach(() => {
    mocks.success.mockClear();
    mocks.error.mockClear();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem('user', JSON.stringify({ _id: 'patient-id' }));
    window.history.replaceState({}, '', '/');
});
afterEach(() => window.history.replaceState({}, '', '/'));

async function choosePaymentAndSubmit(method) {
    const user = userEvent.setup();
    await user.click(screen.getByDisplayValue(method));
    await user.click(screen.getByRole('button', { name: 'Confirm booking' }));
}

function mockCashSuccess() {
    // Cash navigation is hard-coded. Already being on the target URL avoids jsdom's unsupported
    // cross-page navigation; these cases assert booking effects, not that a redirect occurred.
    window.history.replaceState({}, '', '/checkout-success');
    fetchMock.mockResolvedValueOnce(jsonResponse({ booking: { _id: 'booking-id' } }))
        .mockResolvedValueOnce(jsonResponse({ chat: { _id: 'chat-id' } }));
}

describe('ConfirmBooking', () => {
    it('FE-B01: disables confirmation until a payment method is selected', async () => {
        render(<ConfirmBooking {...props()} />);
        expect(screen.getByRole('button', { name: 'Confirm booking' })).toBeDisabled();
        await userEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('FE-B02: rejects a missing slot even after a payment method is selected', async () => {
        // A null selectedSlot intentionally exercises the runtime guard despite the required prop.
        const warning = vi.spyOn(console, 'error').mockImplementationOnce(() => {});
        render(<ConfirmBooking {...props({ selectedSlot: null })} />);
        warning.mockRestore();
        await choosePaymentAndSubmit('Cash');
        expect(mocks.error).toHaveBeenCalledWith('Please select a slot');
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('FE-B03: submits the exact cash payload and stores the returned booking id', async () => {
        mockCashSuccess();
        render(<ConfirmBooking {...props()} />);
        await choosePaymentAndSubmit('Cash');
        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
        expect(fetchMock).toHaveBeenNthCalledWith(1, `${base}/bookings/create`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer unit-token' },
            body: JSON.stringify({ doctorId: 'doctor-id', userId: 'patient-id', timeSlot: slot, ticketPrice: 25, paymentMethod: 'cash', isPaid: false }),
        });
        expect(localStorage.getItem('appointmentId')).toBe('booking-id');
        expect(fetchMock).toHaveBeenNthCalledWith(2, `${base}/chats/create-chat`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer unit-token' },
            body: JSON.stringify({ doctorId: 'doctor-id', userId: 'patient-id' }),
        });
    });

    it('FE-B04: removes only the selected slot and reports a successful cash booking', async () => {
        mockCashSuccess();
        const options = props();
        render(<ConfirmBooking {...options} />);
        await choosePaymentAndSubmit('Cash');
        await waitFor(() => expect(screen.getByRole('button', { name: 'Confirm booking' })).toBeInTheDocument());
        expect(mocks.success).toHaveBeenCalledWith('Booking created');
        expect(options.setTimeSlots).toHaveBeenCalledTimes(1);
        const update = options.setTimeSlots.mock.calls[0][0];
        expect(update([slot, otherSlot])).toEqual([otherSlot]);
        expect(mocks.error).not.toHaveBeenCalled();
    });

    it('FE-B05: submits e-wallet metadata and assigns the session URL using supported hash navigation', async () => {
        const checkoutUrl = `${window.location.origin}/#stripe-checkout`;
        fetchMock.mockResolvedValueOnce(jsonResponse({ session: { url: checkoutUrl } }))
            .mockResolvedValueOnce(jsonResponse({ chat: {} }));
        const options = props();
        render(<ConfirmBooking {...options} />);
        await choosePaymentAndSubmit('E-Wallet');
        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
        expect(fetchMock).toHaveBeenNthCalledWith(1, `${base}/bookings/checkout-session/doctor-id`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer unit-token' },
            body: JSON.stringify({ timeSlot: slot, paymentMethod: 'e-wallet' }),
        });
        expect(window.location.href).toBe(checkoutUrl);
        expect(options.setTimeSlots).toHaveBeenCalledTimes(1);
        expect(localStorage.getItem('appointmentId')).toBeNull();
        // Hash navigation proves URL assignment only, not that external Stripe navigation works.
    });

    it.each(['Cash', 'E-Wallet'])('FE-B06: shows an API error for %s without changing slots or navigating', async (method) => {
        fetchMock.mockResolvedValue(jsonResponse({ message: 'Selected slot is unavailable' }, false));
        const options = props();
        render(<ConfirmBooking {...options} />);
        await choosePaymentAndSubmit(method);
        await waitFor(() => expect(screen.getByRole('button', { name: 'Confirm booking' })).toBeInTheDocument());
        expect(mocks.error).toHaveBeenCalledWith('Selected slot is unavailable');
        expect(options.setTimeSlots).not.toHaveBeenCalled();
        expect(mocks.success).not.toHaveBeenCalled();
        expect(localStorage.getItem('appointmentId')).toBeNull();
        expect(window.location.pathname).toBe('/');
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it.each(['network', 'JSON'])('FE-B06: stops loading and preserves slots after a %s failure', async (kind) => {
        if (kind === 'network') fetchMock.mockRejectedValue(new Error('Network unavailable'));
        else fetchMock.mockResolvedValue({ ok: true, json: vi.fn().mockRejectedValue(new SyntaxError('Invalid JSON')) });
        const options = props();
        render(<ConfirmBooking {...options} />);
        await choosePaymentAndSubmit('Cash');
        await waitFor(() => expect(screen.getByRole('button', { name: 'Confirm booking' })).toBeInTheDocument());
        expect(mocks.error).toHaveBeenCalledWith(kind === 'network' ? 'Network unavailable' : 'Invalid JSON');
        expect(options.setTimeSlots).not.toHaveBeenCalled();
        expect(localStorage.getItem('appointmentId')).toBeNull();
    });

    it('FE-B07: reports chat failure without repeating the completed cash booking', async () => {
        mockCashSuccess();
        fetchMock.mockReset().mockResolvedValueOnce(jsonResponse({ booking: { _id: 'booking-id' } }))
            .mockResolvedValueOnce(jsonResponse({ message: 'Chat unavailable' }, false));
        render(<ConfirmBooking {...props()} />);
        await choosePaymentAndSubmit('Cash');
        await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Chat unavailable'));
        expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([`${base}/bookings/create`, `${base}/chats/create-chat`]);
        expect(localStorage.getItem('appointmentId')).toBe('booking-id');
    });

    it('FE-B08: prevents double submission while a booking request is pending', async () => {
        const pending = deferred();
        fetchMock.mockReturnValue(pending.promise);
        render(<ConfirmBooking {...props()} />);
        const user = userEvent.setup();
        await user.click(screen.getByDisplayValue('Cash'));
        const button = screen.getByRole('button', { name: 'Confirm booking' });
        await user.dblClick(button);
        try {
            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(button).toBeDisabled();
        } finally {
            await act(async () => { pending.resolve(jsonResponse({ message: 'Request stopped' }, false)); await pending.promise; });
        }
    });

    it.each([
        ['Cash', null], ['Cash', '{invalid-json'], ['E-Wallet', null], ['E-Wallet', '{invalid-json'],
        ['Cash', '{}'], ['E-Wallet', '{}'], ['Cash', '{"_id":""}'], ['E-Wallet', '{"_id":""}'],
    ])('FE-B09: rejects invalid stored user %s/%s before calling the API', async (method, storedUser) => {
        if (storedUser === null) localStorage.removeItem('user');
        else localStorage.setItem('user', storedUser);
        fetchMock.mockResolvedValue(jsonResponse({ session: {}, chat: {} }));
        render(<ConfirmBooking {...props()} />);
        await choosePaymentAndSubmit(method);
        await waitFor(() => expect(mocks.error).toHaveBeenCalled());
        expect(fetchMock).not.toHaveBeenCalled();
        expect(mocks.error).toHaveBeenCalledWith(expect.stringMatching(/session|sign in|log in|login/i));
    });

    it.each([{}, { session: {} }, { session: { url: '  ' } }, { session: { url: 123 } }])(
        'FE-B10: reports an invalid checkout URL and does not create a chat: %j', async (response) => {
        fetchMock.mockResolvedValueOnce(jsonResponse(response)).mockResolvedValueOnce(jsonResponse({ chat: {} }));
        const options = props();
        render(<ConfirmBooking {...options} />);
        await choosePaymentAndSubmit('E-Wallet');
        await waitFor(() => expect(screen.getByRole('button', { name: 'Confirm booking' })).toBeInTheDocument());
        expect(mocks.error).toHaveBeenCalledWith(expect.any(String));
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(options.setTimeSlots).not.toHaveBeenCalled();
    });

    it('FE-B12: unlocks after a failed request and allows a successful retry', async () => {
        const pending = deferred();
        fetchMock.mockReturnValueOnce(pending.promise);
        render(<ConfirmBooking {...props()} />);
        await choosePaymentAndSubmit('Cash');
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        await act(async () => { pending.resolve(jsonResponse({ message: 'Temporary failure' }, false)); });
        expect(button).toBeEnabled();
        expect(mocks.error).toHaveBeenCalledWith('Temporary failure');
        mockCashSuccess();
        await userEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));
        await waitFor(() => expect(mocks.success).toHaveBeenCalledWith('Booking created'));
        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(localStorage.getItem('appointmentId')).toBe('booking-id');
        expect(button).toBeEnabled();
    });

    it('FE-B11: does not create a cash booking or paid confirmation when only starting checkout', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse({ session: { url: `${window.location.origin}/#checkout` } }))
            .mockResolvedValueOnce(jsonResponse({ chat: {} }));
        render(<ConfirmBooking {...props()} />);
        await choosePaymentAndSubmit('E-Wallet');
        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
        expect(fetchMock.mock.calls[0][0]).toBe(`${base}/bookings/checkout-session/doctor-id`);
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty('isPaid');
        expect(localStorage.getItem('appointmentId')).toBeNull();
        expect(mocks.success).not.toHaveBeenCalled();
    });

    it.todo('FE-B04/FE-B05: verifies actual cash and external Stripe navigation in a browser');
    it.todo('FE-B11: confirms slot reservation and release behavior after checkout cancellation or payment completion (integration)');
});
