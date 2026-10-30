import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authContext } from '../../context/AuthContext';
import i18n from '../../utils/services/i18n';
import Header from './Header';

const socket = vi.hoisted(() => ({ connected: true, handlers: new Map(), emit: vi.fn() }));
const emptyData = vi.hoisted(() => []);
vi.mock('../../utils/services/socket', () => ({ default: {
    ...socket,
    on: (event, handler) => {
        if (!socket.handlers.has(event)) socket.handlers.set(event, new Set());
        socket.handlers.get(event).add(handler);
    },
    off: (event, handler) => socket.handlers.get(event)?.delete(handler),
} }));
vi.mock('../../hooks/useFetchData', () => ({ default: () => ({ data: emptyData }) }));
vi.mock('../../hooks/useResponsive', () => ({ default: () => ({ isMobile: false, isTablet: false }) }));
const notification = {
    id: 'reschedule-booking-1-history-1', appointmentId: 'booking-1', type: 'reschedule',
    doctor: { _id: 'doctor-1', fullname: 'Doctor One', photo: '/doctor.png' },
    from: { day: '2099-06-01', startingTime: '08:00', endingTime: '08:30' },
    timeSlot: { day: '2099-06-02', startingTime: '09:00', endingTime: '09:30' },
    createdAt: '2099-05-01T00:00:00Z',
};
let stored;
let fetchMock;
const play = vi.fn();
const Location = () => <output data-testid="path">{useLocation().pathname}</output>;
const mount = () => render(
    <authContext.Provider value={{ user: { _id: 'patient-1', fullname: 'Patient One' }, role: 'patient', token: 'test-token' }}>
        <MemoryRouter><Header /><Location /></MemoryRouter>
    </authContext.Provider>,
);
beforeEach(async () => {
    await i18n.changeLanguage('en');
    socket.handlers.clear();
    stored = [];
    play.mockReset().mockResolvedValue(undefined);
    vi.stubGlobal('Audio', vi.fn(function () { return { play }; }));
    fetchMock = vi.fn(async (url) => ({
        ok: true,
        json: async () => url.endsWith('/calendar/notifications')
            ? { data: stored, unreadCount: stored.length }
            : { success: true, unreadCount: 0 },
    }));
    vi.stubGlobal('fetch', fetchMock);
});

describe('patient reschedule notifications', () => {
    it('updates the badge and bell in realtime, avoids duplicates and opens the appointment', async () => {
        const user = userEvent.setup();
        const { unmount } = mount();
        await waitFor(() => expect(socket.handlers.get('reschedule-notification')?.size).toBe(1));
        await act(async () => {
            stored = [notification];
            for (const handler of socket.handlers.get('reschedule-notification')) {
                handler(notification);
                handler(notification);
            }
        });
        expect(await screen.findByText('1')).toBeInTheDocument();
        expect(play).toHaveBeenCalledTimes(1);
        await user.click(screen.getByRole('button', { name: 'Notifications' }));
        const message = await screen.findByText((_, element) => element.tagName === 'P' && element.textContent.includes('Doctor One rescheduled your appointment'));
        expect(message.querySelector('b')).toHaveTextContent('rescheduled');
        expect(message).toHaveTextContent('08:00–08:30');
        expect(message).toHaveTextContent('09:00–09:30');
        expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/calendar/notifications/read'), expect.objectContaining({ method: 'POST' }));
        await user.click(message);
        expect(screen.getByTestId('path')).toHaveTextContent('/users/appointments/my-appointments/booking-1');
        unmount();
        expect(socket.handlers.get('reschedule-notification').size).toBe(0);
    });

    it('restores saved notifications on reload and recovers missed changes on reconnect', async () => {
        const user = userEvent.setup();
        stored = [notification];
        mount();
        expect(await screen.findByText('1')).toBeInTheDocument();
        stored = [notification, { ...notification, id: 'reschedule-booking-1-history-2', createdAt: '2099-05-02T00:00:00Z' }];
        await act(async () => { for (const handler of socket.handlers.get('connect')) handler(); });
        expect(await screen.findByText('2')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Notifications' }));
        expect(await screen.findAllByText((_, element) => element.tagName === 'P' && element.textContent.includes('Doctor One rescheduled your appointment'))).toHaveLength(2);
    });
});
