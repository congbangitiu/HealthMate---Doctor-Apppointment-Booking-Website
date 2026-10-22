import React, { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({ confirmationProps: vi.fn() }));
vi.mock('../../hooks/useResponsive', () => ({ default: () => ({ isMobile: false }) }));
vi.mock('../../utils/date-time/formatDateForDisplay', () => ({ default: (date) => String(date) }));
vi.mock('../../utils/date-time/convertTime', () => ({ default: (time) => time }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({
    t: (key, values) => ({
        'sidePanel.bookButton': 'Book appointment',
        'sidePanel.fullyBooked': `No available slots for ${values?.doctorName || ''}`,
    }[key] || key),
}) }));
vi.mock('../../Dashboard/user-account/ConfirmBooking/ConfirmBooking', () => ({
    default: (props) => { mocks.confirmationProps(props); return null; },
}));

import SidePanel from './SidePanel';

const at = (startingTime, endingTime = '11:30') => ({ day: '2026-10-21', startingTime, endingTime });
const props = (overrides = {}) => ({
    doctorId: 'doctor-id', doctorName: 'Test Doctor', doctorPhoto: 'doctor.jpg', ticketPrice: 25,
    timeSlots: [at('11:00')], role: 'patient', expandedSidePanel: true, setExpandedSidePanel: vi.fn(),
    ...overrides,
});

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-21T10:00:00+07:00'));
});

describe('SidePanel', () => {
    it('preserves the selected slot when the panel is remounted in expanded mode', async () => {
        const slot = at('11:00');
        const ControlledPanel = () => {
            const [expanded, setExpanded] = useState(false);
            const [selectedSlot, setSelectedSlot] = useState(null);

            return (
                <>
                    <button onClick={() => setExpanded((value) => !value)}>Toggle panel</button>
                    <SidePanel
                        key={expanded ? 'expanded' : 'collapsed'}
                        {...props({
                            timeSlots: [slot],
                            expandedSidePanel: expanded,
                            setExpandedSidePanel: setExpanded,
                            selectedSlot,
                            setSelectedSlot,
                        })}
                    />
                </>
            );
        };

        render(<ControlledPanel />);
        await userEvent.click(screen.getByRole('radio'));
        expect(screen.getByRole('radio')).toBeChecked();

        await userEvent.click(screen.getByRole('button', { name: 'Toggle panel' }));
        expect(screen.getByRole('radio')).toBeChecked();
        expect(screen.getByRole('button', { name: 'Book appointment' })).toBeEnabled();
    });

    it('FE-S01: hides past slots and keeps slots starting now or in the future', () => {
        render(<SidePanel {...props({ timeSlots: [at('09:00', '09:30'), at('10:00', '10:30'), at('11:00')] })} />);
        expect(screen.queryByText('09:00 - 09:30')).not.toBeInTheDocument();
        expect(screen.getByText('10:00 - 10:30')).toBeInTheDocument();
        expect(screen.getByText('11:00 - 11:30')).toBeInTheDocument();
        expect(screen.getAllByRole('radio')).toHaveLength(2);
    });

    it('FE-S02: enables booking only after a patient selects a slot', async () => {
        const user = userEvent.setup();
        render(<SidePanel {...props()} />);
        expect(screen.getByRole('button', { name: 'Book appointment' })).toBeDisabled();
        await user.click(screen.getByRole('radio'));
        expect(screen.getByRole('radio')).toBeChecked();
        expect(screen.getByRole('button', { name: 'Book appointment' })).toBeEnabled();
    });

    it.each(['doctor', 'admin', 'guest'])('FE-S03: does not allow role %s to select or book a slot', async (role) => {
        render(<SidePanel {...props({ role })} />);
        await userEvent.click(screen.getByText('11:00 - 11:30'));
        expect(screen.queryByRole('radio')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Book appointment' })).not.toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it.each([
        ['empty', []], ['past-only', [at('09:00', '09:30')]],
    ])('FE-S04: shows fully booked for %s availability', (_label, timeSlots) => {
        render(<SidePanel {...props({ timeSlots })} />);
        expect(screen.getByText('No available slots for Test Doctor')).toBeInTheDocument();
        expect(screen.queryByRole('radio')).not.toBeInTheDocument();
        const button = screen.queryByRole('button', { name: 'Book appointment' });
        if (button) expect(button).toBeDisabled();
    });

    it('FE-S05: opens the real dialog with the selected slot and doctor props', async () => {
        const slot = at('11:00');
        const user = userEvent.setup();
        render(<SidePanel {...props({ timeSlots: [slot] })} />);
        await user.click(screen.getByRole('radio'));
        await user.click(screen.getByRole('button', { name: 'Book appointment' }));
        expect(await screen.findByRole('dialog')).toBeVisible();
        expect(mocks.confirmationProps.mock.lastCall[0]).toMatchObject({
            doctorId: 'doctor-id', doctorName: 'Test Doctor', doctorPhoto: 'doctor.jpg', ticketPrice: 25, selectedSlot: slot,
        });
        expect(mocks.confirmationProps.mock.lastCall[0].setTimeSlots).toEqual(expect.any(Function));
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it.each(['replacement', 'empty'])('FE-S06: refreshes %s props and clears a removed selection', async (kind) => {
        const initialProps = props();
        const view = render(<SidePanel {...initialProps} />);
        await userEvent.click(screen.getByRole('radio'));
        const nextSlots = kind === 'empty' ? [] : [at('12:00', '12:30')];
        view.rerender(<SidePanel {...initialProps} timeSlots={nextSlots} />);
        expect(screen.queryByText('11:00 - 11:30')).not.toBeInTheDocument();
        if (kind === 'replacement') expect(screen.getByText('12:00 - 12:30')).toBeInTheDocument();
        const button = screen.queryByRole('button', { name: 'Book appointment' });
        if (button) expect(button).toBeDisabled();
    });

    it('FE-S07: preserves an available selection after refetch replaces slot objects', async () => {
        const initialProps = props();
        const view = render(<SidePanel {...initialProps} />);
        await userEvent.click(screen.getByRole('radio'));
        const refreshedSlot = { ...initialProps.timeSlots[0] };
        view.rerender(<SidePanel {...initialProps} timeSlots={[refreshedSlot]} />);
        expect(screen.getByRole('radio')).toBeChecked();
        expect(screen.getByRole('button', { name: 'Book appointment' })).toBeEnabled();
        expect(mocks.confirmationProps.mock.lastCall[0].selectedSlot).toBe(refreshedSlot);
    });

    it('FE-S08: clears selection and closes the dialog when booking removes the selected slot locally', async () => {
        render(<SidePanel {...props()} />);
        await userEvent.click(screen.getByRole('radio'));
        await userEvent.click(screen.getByRole('button', { name: 'Book appointment' }));
        expect(await screen.findByRole('dialog')).toBeVisible();
        const { selectedSlot, setTimeSlots } = mocks.confirmationProps.mock.lastCall[0];
        act(() => setTimeSlots((slots) => slots.filter((slot) => slot !== selectedSlot)));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(screen.getByText('No available slots for Test Doctor')).toBeInTheDocument();
        expect(mocks.confirmationProps.mock.lastCall[0].selectedSlot).toBeNull();
    });
});
