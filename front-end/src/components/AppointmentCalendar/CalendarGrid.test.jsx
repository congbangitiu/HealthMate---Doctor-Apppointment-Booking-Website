import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CalendarGrid from './CalendarGrid';

const slot = { day: '2099-06-01', startingTime: '08:00', endingTime: '08:30' };
const cancelled = { _id: 'cancelled-1', status: 'cancelled', timeSlot: slot, user: { fullname: 'Patient One' } };
const booked = { ...cancelled, _id: 'new-booking', status: 'pending', user: { fullname: 'Patient Two' } };
const mount = (overrides = {}) => {
    const props = {
        days: [slot.day],
        appointments: [cancelled],
        slots: [slot],
        role: 'doctor',
        formatDay: (day) => day,
        t: (key, options) =>
            key === 'cancelledCount'
                ? `${options.count} cancelled appointments`
                : {
                      available: 'Available',
                      cancelled: 'Cancelled',
                      cancelledAppointments: 'Cancelled appointments',
                      close: 'Close',
                  }[key] || key,
        onOpen: vi.fn(),
        onDrop: vi.fn(),
        onDrag: vi.fn(),
        busy: false,
        ...overrides,
    };
    return { ...render(<CalendarGrid {...props} />), props };
};

describe('cancelled appointments in the doctor grid', () => {
    it('combines the available slot with a clickable cancellation entry and keeps it droppable', () => {
        const { props } = mount({ dragging: 'other-booking' });
        const entry = screen.getByRole('button', { name: /Patient One.*Cancelled/ });
        const freeSlot = entry.closest('[title="Available 08:00–08:30"]');
        expect(freeSlot).not.toBeNull();
        expect(within(freeSlot).queryByText('08:00–08:30')).not.toBeInTheDocument();
        expect(within(freeSlot).getByText('Patient One')).toBeInTheDocument();
        expect(screen.getAllByRole('button')).toHaveLength(1);
        fireEvent.click(entry);
        expect(props.onOpen).toHaveBeenCalledWith('cancelled-1');
        fireEvent.drop(freeSlot, { dataTransfer: { getData: () => 'other-booking' } });
        expect(props.onDrop).toHaveBeenCalledWith('other-booking', slot);
    });

    it('prioritizes the new booking and hides cancellation cards after rebooking', () => {
        mount({ appointments: [cancelled, booked], slots: [] });
        expect(screen.getByRole('button', { name: /Patient Two/ })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Patient One/ })).not.toBeInTheDocument();
        expect(screen.queryByText('Available')).not.toBeInTheDocument();
    });

    it('keeps cancellations discoverable through their filter without marking occupied time as available', () => {
        mount({ appointments: [cancelled], scheduleAppointments: [cancelled, booked], showCancelledHistory: true });
        expect(screen.getByRole('button', { name: /Patient One.*Cancelled/ })).toBeInTheDocument();
        expect(screen.queryByText('Available')).not.toBeInTheDocument();
    });

    it('groups cancellations and opens a list with the latest cancellation first', () => {
        const { props } = mount({
            appointments: [
                { ...cancelled, statusHistory: [{ status: 'cancelled', timestamp: '2099-05-01T00:00:00Z' }] },
                {
                    ...cancelled,
                    _id: 'cancelled-2',
                    user: { fullname: 'Patient Three' },
                    statusHistory: [{ status: 'cancelled', timestamp: '2099-05-02T00:00:00Z' }],
                },
            ],
        });
        expect(screen.getAllByRole('button')).toHaveLength(1);
        expect(screen.getAllByText('Available')).toHaveLength(1);
        fireEvent.click(screen.getByRole('button', { name: '2 cancelled appointments' }));
        const dialog = screen.getByRole('dialog', { name: 'Cancelled appointments' });
        const entries = within(dialog).getAllByRole('listitem');
        expect(entries[0]).toHaveTextContent('Patient Three');
        expect(entries[1]).toHaveTextContent('Patient One');
        fireEvent.click(within(entries[0]).getByRole('button'));
        expect(props.onOpen).toHaveBeenCalledWith('cancelled-2');
        fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    });

    it('shows the time on its own line for a slot without cancellations', () => {
        mount({ appointments: [] });
        const available = screen.getByText('Available');
        const time = screen.getByText('08:00–08:30');
        expect(available.parentElement).not.toContainElement(time);
        expect(available.closest('[title="Available 08:00–08:30"]')).toContainElement(time);
    });

    it('preserves normal cancelled cards for patients', () => {
        mount({ role: 'patient', appointments: [{ ...cancelled, doctor: { fullname: 'Doctor One' } }] });
        expect(screen.getByRole('button', { name: /Doctor One.*Cancelled/ })).toBeInTheDocument();
        expect(screen.queryByText('Available')).not.toBeInTheDocument();
    });
});
