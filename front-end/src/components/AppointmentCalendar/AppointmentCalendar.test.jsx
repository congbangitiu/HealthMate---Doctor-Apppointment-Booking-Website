import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../utils/services/i18n';
import { authContext } from '../../context/AuthContext';
import AppointmentCalendar from './AppointmentCalendar';

const socket = vi.hoisted(() => ({ handlers: new Map(), on: vi.fn(), off: vi.fn(), emit: vi.fn() }));
vi.mock('../../utils/services/socket', () => ({ default: socket }));
const slot = { day: '2099-06-01', startingTime: '08:00', endingTime: '08:30' };
const next = { ...slot, startingTime: '09:00', endingTime: '09:30' };
let bookings;
let fetchMock;
let conflict;
const Location = () => <output data-testid="url">{useLocation().search}</output>;
const mount = (role = 'patient', query = '?tab=appointments&calView=day&calDate=2099-06-01') =>
    render(
        <authContext.Provider value={{ token: 'test-token', user: { _id: 'viewer' } }}>
            <MemoryRouter initialEntries={[`/profile${query}`]}>
                <AppointmentCalendar role={role} />
                <Location />
            </MemoryRouter>
        </authContext.Provider>,
    );
beforeEach(async () => {
    await i18n.changeLanguage('en');
    socket.handlers.clear();
    socket.on.mockImplementation((name, handler) => socket.handlers.set(name, handler));
    socket.off.mockImplementation((name) => socket.handlers.delete(name));
    bookings = [
        {
            _id: 'booking-1',
            doctor: { _id: 'doctor-1', fullname: 'Doctor One' },
            user: { _id: 'user-1', fullname: 'Patient One' },
            status: 'pending',
            timeSlot: slot,
            scheduleVersion: 0,
            createdAt: '2099-05-01T00:00:00Z',
            statusHistory: [],
            scheduleHistory: [],
        },
    ];
    conflict = false;
    fetchMock = vi.fn(async (url, options = {}) => {
        if (options.method === 'PUT') {
            if (conflict) return { ok: false, json: async () => ({ code: 'STALE_APPOINTMENT' }) };
            const body = JSON.parse(options.body);
            bookings = bookings.map((booking) => ({
                ...booking,
                timeSlot: body.timeSlot || booking.timeSlot,
                status: body.status || booking.status,
                scheduleVersion: 1,
            }));
            return { ok: true, json: async () => ({ data: bookings[0] }) };
        }
        return { ok: true, json: async () => ({ data: url.includes('/calendar/availability') ? [next] : bookings }) };
    });
    vi.stubGlobal('fetch', fetchMock);
});

describe('appointment workspace', () => {
    it('shows a check only after copying succeeds without adding a notice to the calendar or drawer', async () => {
        const user = userEvent.setup();
        let finishCopy;
        const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(
            () =>
                new Promise((resolve) => {
                    finishCopy = resolve;
                }),
        );
        mount();
        await screen.findByRole('button', { name: /Doctor One, 2099-06-01/ });
        await user.click(screen.getByRole('button', { name: 'Copy calendar link' }));
        expect(screen.queryByRole('button', { name: 'Calendar link copied' })).not.toBeInTheDocument();
        await act(async () => finishCopy());
        expect(screen.getByRole('button', { name: 'Calendar link copied' })).toBeInTheDocument();
        expect(writeText).toHaveBeenCalledWith(expect.stringContaining('calDate=2099-06-01'));
        await user.click(screen.getByRole('button', { name: /Doctor One, 2099-06-01/ }));
        expect(screen.queryByText('Calendar link copied')).not.toBeInTheDocument();
        writeText.mockRestore();
    });

    it('animates refresh until the request completes without displaying updating text', async () => {
        const user = userEvent.setup();
        mount();
        await screen.findByRole('button', { name: /Doctor One, 2099-06-01/ });
        let finishRefresh;
        fetchMock.mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    finishRefresh = resolve;
                }),
        );
        const button = screen.getByRole('button', { name: 'Refresh' });
        await user.click(button);
        expect(button).toBeDisabled();
        expect(button.querySelector('svg').getAttribute('class')).toContain('refreshSpinning');
        expect(screen.queryByText('Updating schedule…')).not.toBeInTheDocument();
        await act(async () => finishRefresh({ ok: true, json: async () => ({ data: bookings }) }));
        expect(button).toBeEnabled();
        expect(button.querySelector('svg').getAttribute('class') || '').not.toContain('refreshSpinning');
    });

    it('opens patient details and records, while keeping rescheduling restricted to doctors', async () => {
        const user = userEvent.setup();
        mount();
        const appointment = await screen.findByRole('button', { name: /Doctor One, 2099-06-01/ });
        expect(appointment).toHaveAttribute('draggable', 'false');
        await user.click(appointment);
        const detail = screen.getByRole('dialog', { name: 'Appointment details' });
        expect(within(detail).getByRole('link', { name: 'Open medical records' })).toHaveAttribute(
            'href',
            '/users/appointments/my-appointments/booking-1',
        );
        expect(within(detail).queryByRole('button', { name: 'Reschedule' })).not.toBeInTheDocument();
        expect(within(detail).getByText('Appointment created')).toBeInTheDocument();
        await user.click(within(detail).getByRole('button', { name: 'Close' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(appointment).toHaveFocus();
    });

    it('stores filters by ID on the URL without losing the profile tab, even for identical names', async () => {
        const user = userEvent.setup();
        bookings.push({
            ...bookings[0],
            _id: 'booking-2',
            doctor: { _id: 'doctor-2', fullname: 'Doctor One' },
            status: 'done',
        });
        mount();
        await screen.findByRole('button', { name: /Doctor One, 2099-06-01.*Done/ });
        await user.click(screen.getByRole('combobox', { name: 'Doctor' }));
        await user.click(screen.getAllByRole('option', { name: 'Dr. Doctor One' })[1]);
        expect(screen.getAllByRole('button', { name: /Doctor One, 2099-06-01/ })).toHaveLength(1);
        expect(screen.getByTestId('url').textContent).toContain('calPerson=doctor-2');
        expect(screen.getByTestId('url').textContent).toContain('tab=appointments');
        await user.click(screen.getByRole('combobox', { name: 'Status' }));
        await user.click(screen.getByRole('option', { name: 'Pending', exact: true }));
        expect(screen.getByText('No appointments in this period')).toBeInTheDocument();
    });

    it('requires confirmation and a reason before persisting a drag-and-drop reschedule', async () => {
        const user = userEvent.setup();
        mount('doctor');
        const appointment = await screen.findByRole('button', { name: /Patient One, 2099-06-01/ });
        const transfer = { setData: vi.fn(), getData: () => 'booking-1' };
        fireEvent.dragStart(appointment, { dataTransfer: transfer });
        fireEvent.drop(screen.getByTitle('Available 09:00–09:30'), { dataTransfer: transfer });
        const dialog = screen.getByRole('dialog', { name: 'Confirm rescheduling' });
        expect(screen.queryByText('Appointment details')).not.toBeInTheDocument();
        expect(fetchMock.mock.calls.filter(([, options]) => options?.method === 'PUT')).toHaveLength(0);
        expect(within(dialog).getByRole('button', { name: 'Confirm change' })).toBeDisabled();
        await user.type(within(dialog).getByLabelText('Reason for change'), 'Patient requested a later appointment');
        await user.click(within(dialog).getByRole('button', { name: 'Confirm change' }));
        await waitFor(() =>
            expect(screen.queryByRole('dialog', { name: 'Confirm rescheduling' })).not.toBeInTheDocument(),
        );
        const mutation = fetchMock.mock.calls.find(([, options]) => options?.method === 'PUT');
        expect(JSON.parse(mutation[1].body)).toEqual({
            timeSlot: next,
            expectedVersion: 0,
            reason: 'Patient requested a later appointment',
        });
        expect(mutation[1].headers.Authorization).toBe('Bearer test-token');
        expect(screen.queryByText('Appointment details')).not.toBeInTheDocument();
        await user.click(await screen.findByRole('button', { name: /Patient One, 2099-06-01, 09:00/ }));
        expect(
            within(screen.getByRole('dialog', { name: 'Appointment details' })).getByText('09:00–09:30'),
        ).toBeInTheDocument();
    });

    it('keeps the old schedule and displays an actionable error after a stale write', async () => {
        const user = userEvent.setup();
        conflict = true;
        mount('doctor');
        await user.click(await screen.findByRole('button', { name: /Patient One, 2099-06-01/ }));
        await user.click(screen.getByRole('button', { name: 'Reschedule' }));
        const dialog = screen.getByRole('dialog', { name: 'Confirm rescheduling' });
        await user.click(within(dialog).getByRole('combobox', { name: 'Available time slot' }));
        await user.click(within(dialog).getByRole('option', { name: '01/06/2099 · 09:00–09:30' }));
        await user.type(within(dialog).getByLabelText('Reason for change'), 'Later time');
        await user.click(within(dialog).getByRole('button', { name: 'Confirm change' }));
        expect(await within(dialog).findByRole('alert')).toHaveTextContent('changed elsewhere');
        expect(within(dialog).getByRole('button', { name: 'Confirm change' })).toBeDisabled();
        expect(bookings[0].timeSlot).toEqual(slot);
    });

    it('refetches the authenticated scope after a realtime event and cleans up listeners', async () => {
        const { unmount } = mount();
        await screen.findByRole('button', { name: /Doctor One, 2099-06-01/ });
        bookings = [];
        act(() => socket.handlers.get('appointments-changed')());
        await screen.findByText('No appointments in this period');
        unmount();
        expect(socket.handlers.size).toBe(0);
    });

    it('renders a daily agenda instead of a time grid on mobile and preserves historical appointments in list view', async () => {
        bookings.push({
            ...bookings[0],
            _id: 'historical-booking',
            doctor: { _id: 'doctor-past', fullname: 'Past Doctor' },
            timeSlot: { ...slot, day: '2020-01-01' },
        });
        vi.stubGlobal(
            'matchMedia',
            vi.fn(() => ({
                matches: true,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                addListener: vi.fn(),
                removeListener: vi.fn(),
            })),
        );
        mount('patient', '?calView=week&calDate=2099-06-01');
        await screen.findByRole('button', { name: /08:00.*Doctor One/ });
        expect(screen.getByText('Appointments are grouped by day on smaller screens.')).toBeInTheDocument();
        expect(screen.queryByTitle('Available 09:00–09:30')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'List', exact: true }));
        expect(screen.getByTestId('url')).toHaveTextContent('calView=list');
        expect(await screen.findByRole('button', { name: /Past Doctor/ })).toBeInTheDocument();
    });

    it('cancels a patient appointment after confirmation and refreshes without reloading the page', async () => {
        const user = userEvent.setup();
        mount();
        await user.click(await screen.findByRole('button', { name: /Doctor One, 2099-06-01/ }));
        await user.click(screen.getByRole('button', { name: 'Cancel appointment' }));
        const dialog = screen.getByRole('dialog', { name: 'Are you sure you want to cancel this appointment?' });
        expect(within(dialog).getByText('Dr. Doctor One')).toBeInTheDocument();
        expect(fetchMock.mock.calls.filter(([, options]) => options?.method === 'PUT')).toHaveLength(0);
        await user.click(within(dialog).getByRole('button', { name: 'Confirm', exact: true }));
        await waitFor(() => expect(bookings[0].status).toBe('cancelled'));
        const detail = await screen.findByRole('dialog', { name: 'Appointment details' });
        expect(await within(detail).findByText('Cancelled', { exact: true })).toBeInTheDocument();
        expect(within(detail).queryByRole('status')).not.toBeInTheDocument();
    });
});
