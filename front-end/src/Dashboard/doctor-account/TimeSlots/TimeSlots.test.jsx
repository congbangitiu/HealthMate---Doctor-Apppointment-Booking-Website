import { Component, StrictMode, useState } from 'react';
import PropTypes from 'prop-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../../hooks/useResponsive', () => ({ default: () => ({ isMobile: false }) }));
vi.mock('../../../utils/date-time/formatDateForDisplay', () => ({ default: (date) => String(date) }));
vi.mock('../../../utils/date-time/convertTime', () => ({ default: (time) => time }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key.split('.').at(-1) }) }));

import TimeSlots from './TimeSlots';

const days = [
    { name: 'Wednesday', date: '2026-10-21' },
    { name: 'Thursday', date: '2026-10-22' },
    { name: 'Friday', date: '2026-10-23' },
];
const props = (overrides = {}) => ({
    handleTimeSlotsChange: vi.fn(), onAvailableScheduleChange: vi.fn(),
    daysOfWeekWithDates: days, availableSchedules: [], ...overrides,
});
const lastSlots = (options) => options.handleTimeSlotsChange.mock.lastCall?.[0];
const lastSchedules = (options) => options.onAvailableScheduleChange.mock.lastCall?.[0];
const minuteOfDay = (time) => {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
};

async function toggleOption(user, selectIndex, optionName) {
    await user.click(screen.getAllByRole('combobox')[selectIndex]);
    await user.click(await screen.findByRole('option', { name: optionName }));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
}

class RenderBoundary extends Component {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    render() { return this.state.failed ? <p>Rendering failed</p> : this.props.children; }
}
RenderBoundary.propTypes = { children: PropTypes.node.isRequired };

function ScheduleEditor() {
    const [schedules, setSchedules] = useState([{ day: 'Thursday', shifts: ['Morning'] }]);
    const [slots, setSlots] = useState([]);
    return <>
        <TimeSlots daysOfWeekWithDates={days} availableSchedules={schedules}
            onAvailableScheduleChange={setSchedules} handleTimeSlotsChange={setSlots} />
        <output aria-label="Parent slot count">{slots.length}</output>
    </>;
}

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-21T10:00:00+07:00'));
    // jsdom has no layout; provide a visible anchor for the actual MUI menus.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
        x: 0, y: 0, top: 0, left: 0, width: 120, height: 30, right: 120, bottom: 30, toJSON: () => ({}),
    });
});

describe('TimeSlots', () => {
    it.each([
        ['Morning', 7, '08:00', '11:30'], ['Afternoon', 6, '13:00', '16:00'], ['Evening', 6, '18:00', '21:00'],
    ])('FE-T01: generates %s as %i consecutive thirty-minute slots', (shift, count, start, end) => {
        const options = props({ availableSchedules: [{ day: 'Thursday', shifts: [shift] }] });
        render(<TimeSlots {...options} />);
        const slots = lastSlots(options);
        expect(slots).toHaveLength(count);
        expect(slots[0]).toMatchObject({ day: '2026-10-22', startingTime: start });
        expect(slots.at(-1).endingTime).toBe(end);
        for (let index = 0; index < slots.length; index++) {
            expect(slots[index].day).toBe('2026-10-22');
            expect(minuteOfDay(slots[index].endingTime) - minuteOfDay(slots[index].startingTime)).toBe(30);
            if (index) expect(slots[index].startingTime).toBe(slots[index - 1].endingTime);
        }
    });

    it('FE-T02: sorts days by calendar date when selected in reverse order', async () => {
        const user = userEvent.setup();
        const options = props();
        render(<TimeSlots {...options} />);
        await toggleOption(user, 0, 'Friday (2026-10-23)');
        await toggleOption(user, 0, 'Thursday (2026-10-22)');
        expect(lastSchedules(options)).toEqual([{ day: 'Thursday', shifts: [] }, { day: 'Friday', shifts: [] }]);
    });

    it('FE-T03: removes the deselected day and its shifts while retaining other days', async () => {
        const options = props({ availableSchedules: [
            { day: 'Thursday', shifts: ['Morning'] }, { day: 'Friday', shifts: ['Evening'] },
        ] });
        render(<TimeSlots {...options} />);
        await toggleOption(userEvent.setup(), 0, 'Thursday (2026-10-22)');
        expect(lastSchedules(options)).toEqual([{ day: 'Friday', shifts: ['Evening'] }]);
        expect(lastSlots(options)).toHaveLength(6);
        expect(lastSlots(options).every((slot) => slot.day === '2026-10-23')).toBe(true);
    });

    it('FE-T04: adds a second shift without changing another day shifts', async () => {
        const options = props({ availableSchedules: [
            { day: 'Thursday', shifts: ['Morning'] }, { day: 'Friday', shifts: ['Afternoon'] },
        ] });
        render(<TimeSlots {...options} />);
        await toggleOption(userEvent.setup(), 1, 'Evening');
        expect(lastSchedules(options)).toEqual([
            { day: 'Thursday', shifts: ['Morning', 'Evening'] }, { day: 'Friday', shifts: ['Afternoon'] },
        ]);
        expect(lastSlots(options)).toHaveLength(19);
        expect(lastSlots(options).filter((slot) => slot.day === '2026-10-23')).toHaveLength(6);
    });

    it('FE-T05: preloads only schedules whose days exist in the provided calendar', () => {
        const options = props({ availableSchedules: [
            { day: 'Thursday', shifts: ['Morning'] }, { day: 'NotADay', shifts: ['Evening'] },
        ] });
        render(<TimeSlots {...options} />);
        expect(lastSchedules(options)).toEqual([{ day: 'Thursday', shifts: ['Morning'] }]);
        expect(screen.getAllByRole('combobox')).toHaveLength(2);
        expect(lastSlots(options)).toHaveLength(7);
    });

    it.each(['day', 'shift'])('FE-T06: publishes an empty slot list after clearing the final %s', async (kind) => {
        const user = userEvent.setup();
        const options = props();
        render(<TimeSlots {...options} />);
        await toggleOption(user, 0, 'Thursday (2026-10-22)');
        await toggleOption(user, 1, 'Morning');
        expect(lastSlots(options)).toHaveLength(7);
        options.handleTimeSlotsChange.mockClear();
        await toggleOption(user, kind === 'day' ? 0 : 1, kind === 'day' ? 'Thursday (2026-10-22)' : 'Morning');
        expect(lastSchedules(options)).toEqual(kind === 'day' ? [] : [{ day: 'Thursday', shifts: [] }]);
        expect(options.handleTimeSlotsChange).toHaveBeenLastCalledWith([]);
    });

    it('FE-T07: groups generated table rows by date without losing slots', () => {
        const options = props({ availableSchedules: [
            { day: 'Thursday', shifts: ['Morning'] }, { day: 'Friday', shifts: ['Afternoon'] },
        ] });
        render(<TimeSlots {...options} />);
        const table = screen.getByRole('table');
        expect(within(table).getAllByRole('row')).toHaveLength(14);
        expect(within(table).getByRole('cell', { name: '2026-10-22' })).toHaveAttribute('rowspan', '7');
        expect(within(table).getByRole('cell', { name: '2026-10-23' })).toHaveAttribute('rowspan', '6');
        expect(lastSlots(options)).toHaveLength(13);
    });

    it('FE-T08: handles an unknown period without crashing the component', () => {
        // The boundary contains React's error so the test can inspect the rendered failure explicitly.
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const options = props({ availableSchedules: [{ day: 'Thursday', shifts: ['Night'] }] });
        render(<RenderBoundary><TimeSlots {...options} /></RenderBoundary>);
        expect(screen.queryByText('Rendering failed')).not.toBeInTheDocument();
        expect(lastSlots(options)).toEqual([]);
    });

    it('FE-T09: keeps a preloaded schedule cleared when parent callbacks update the input props', async () => {
        render(<StrictMode><ScheduleEditor /></StrictMode>);
        expect(screen.getByLabelText('Parent slot count')).toHaveTextContent('7');
        await toggleOption(userEvent.setup(), 0, 'Thursday (2026-10-22)');
        expect(screen.getByLabelText('Parent slot count')).toHaveTextContent('0');
        expect(screen.getAllByRole('combobox')).toHaveLength(1);
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('FE-T10: loads schedules arriving after mount without publishing a temporary empty schedule', () => {
        const options = props();
        const view = render(<TimeSlots {...options} />);
        options.handleTimeSlotsChange.mockClear();
        options.onAvailableScheduleChange.mockClear();
        view.rerender(<TimeSlots {...options} availableSchedules={[{ day: 'Thursday', shifts: ['Morning'] }]} />);
        expect(lastSlots(options)).toHaveLength(7);
        expect(options.handleTimeSlotsChange.mock.calls.every(([slots]) => slots.length === 7)).toBe(true);
        expect(options.onAvailableScheduleChange.mock.calls.every(([schedules]) => schedules.length === 1)).toBe(true);
    });

    it('FE-T11: ignores unknown shifts while preserving valid shifts from the same schedule', () => {
        const options = props({ availableSchedules: [{ day: 'Thursday', shifts: ['Night', 'Morning', 'toString'] }] });
        render(<TimeSlots {...options} />);
        expect(lastSlots(options)).toHaveLength(7);
        expect(lastSchedules(options)).toEqual([{ day: 'Thursday', shifts: ['Morning'] }]);
    });
});
