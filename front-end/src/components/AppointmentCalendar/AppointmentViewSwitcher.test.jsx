import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Appointments from '../../Dashboard/doctor-account/Appointments/Appointments';
import MyBookings from '../../Dashboard/user-account/MyBookings/MyBookings';
import AppointmentCalendar from './AppointmentCalendar';
import i18n from '../../utils/services/i18n';

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('../../hooks/useFetchData', () => ({ default: mocks.fetch }));
vi.mock('./AppointmentCalendar', () => ({ default: vi.fn(() => <div>Calendar workspace</div>) }));
const appointment = {
    _id: 'booking-1',
    status: 'pending',
    doctor: { _id: 'doctor-1', fullname: 'Doctor One', email: 'doctor@example.test', phone: 900000000 },
    user: { _id: 'patient-1', fullname: 'Patient One', phone: 900000001, gender: 'female' },
    timeSlot: { day: '2099-06-01', startingTime: '08:00', endingTime: '08:30' },
};
const Navigation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    return (
        <>
            <output data-testid="location">
                {location.pathname}
                {location.search}
            </output>
            <button onClick={() => navigate(-1)}>Browser back</button>
        </>
    );
};
const mount = (role, query = '?tab=appointments') =>
    render(
        <MemoryRouter initialEntries={[`/profile${query}`]}>
            {role === 'doctor' ? <Appointments /> : <MyBookings />}
            <Navigation />
        </MemoryRouter>,
    );
beforeEach(async () => {
    await i18n.changeLanguage('en');
    vi.mocked(AppointmentCalendar).mockClear();
    mocks.fetch.mockReturnValue({ data: [appointment], loading: false, error: null });
    vi.stubGlobal('scrollTo', vi.fn());
});

describe('original list and calendar toggle', () => {
    it.each(['doctor', 'patient'])(
        'opens the original %s list by default and restores it after switching',
        async (role) => {
            mount(role);
            expect(screen.getByRole('button', { name: 'List', exact: true })).toHaveAttribute('aria-pressed', 'true');
            expect(AppointmentCalendar).not.toHaveBeenCalled();
            if (role === 'doctor') {
                expect(await screen.findByRole('table')).toBeInTheDocument();
                await screen.findByRole('link', { name: 'Patient One', exact: true });
            } else {
                await screen.findByRole('heading', { name: /Doctor One/ });
                expect(screen.queryByRole('table')).not.toBeInTheDocument();
            }
            fireEvent.click(screen.getByRole('button', { name: 'Calendar', exact: true }));
            expect(screen.getByText('Calendar workspace')).toBeInTheDocument();
            expect(vi.mocked(AppointmentCalendar).mock.calls.at(-1)[0]).toMatchObject({ role, calendarOnly: true });
            expect(screen.getByTestId('location')).toHaveTextContent('tab=appointments');
            expect(screen.getByTestId('location')).toHaveTextContent('appointmentView=calendar');
            expect(screen.getByTestId('location')).toHaveTextContent('calView=week');
            fireEvent.click(screen.getByRole('button', { name: 'List', exact: true }));
            expect(screen.queryByText('Calendar workspace')).not.toBeInTheDocument();
            if (role === 'doctor') await screen.findByRole('table');
            else await screen.findByRole('heading', { name: /Doctor One/ });
            expect(screen.getByTestId('location')).toHaveTextContent('appointmentView=list');
        },
    );

    it('opens shared calendar links and preserves date, filters and the profile tab across toggles', async () => {
        mount('doctor', '?tab=appointments&calView=day&calDate=2099-06-01&calStatus=pending');
        expect(screen.getByText('Calendar workspace')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'List', exact: true }));
        await screen.findByRole('table');
        fireEvent.click(screen.getByRole('button', { name: 'Calendar', exact: true }));
        const url = screen.getByTestId('location');
        for (const part of ['tab=appointments', 'calView=day', 'calDate=2099-06-01', 'calStatus=pending'])
            expect(url).toHaveTextContent(part);
        fireEvent.click(screen.getByRole('button', { name: 'Browser back' }));
        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'List', exact: true })).toHaveAttribute('aria-pressed', 'true'),
        );
    });

    it('honors an explicit list choice even when a previous calendar view is in the URL', async () => {
        mount('doctor', '?tab=appointments&appointmentView=list&calView=week');
        await screen.findByRole('table');
        expect(AppointmentCalendar).not.toHaveBeenCalled();
    });
});


describe('appointment list page sizes', () => {
    it.each(['doctor', 'patient'])('paginates the %s list with 5, 10 or 20 appointments and resets after filtering', async (role) => {
        mocks.fetch.mockReturnValue({
            data: Array.from({ length: 23 }, (_, index) => ({ ...appointment, _id: `booking-${index}` })),
            loading: false,
            error: null,
        });
        mount(role);
        const visibleCount = () => role === 'doctor'
            ? screen.getByRole('table').querySelectorAll('tbody tr').length
            : screen.getAllByRole('heading', { name: /Doctor One/ }).length;
        await waitFor(() => expect(visibleCount()).toBe(5));
        fireEvent.click(screen.getByText('Next', { exact: true }));
        const selectSize = (size) => {
            fireEvent.keyDown(screen.getByRole('combobox', { name: 'Appointments per page' }), { key: 'ArrowDown' });
            fireEvent.click(screen.getByRole('option', { name: String(size), exact: true }));
        };
        selectSize(10);
        await waitFor(() => expect(visibleCount()).toBe(10));
        fireEvent.click(screen.getByText('Next', { exact: true }));
        selectSize(20);
        await waitFor(() => expect(visibleCount()).toBe(20));
        fireEvent.click(screen.getByText('Next', { exact: true }));
        await waitFor(() => expect(visibleCount()).toBe(3));
        fireEvent.keyDown(screen.getByRole('combobox', { name: 'Status', exact: true }), { key: 'ArrowDown' });
        fireEvent.click(screen.getByRole('option', { name: 'Pending', exact: true }));
        await waitFor(() => expect(visibleCount()).toBe(20));
        selectSize(5);
        await waitFor(() => expect(visibleCount()).toBe(5));
    });
});
