import { afterEach, describe, expect, it, vi } from 'vitest';
import { addDays, clinicToday, layoutEvents, validDay, visibleDays } from './calendarUtils';

afterEach(() => vi.useRealTimers());
describe('clinic calendar dates', () => {
    it('uses the Vietnam date across UTC midnight and does not shift dates through local time', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-10-22T18:00:00Z'));
        expect(clinicToday()).toBe('2026-10-23');
        expect(visibleDays('2026-10-25', 'week')).toEqual([
            '2026-10-19',
            '2026-10-20',
            '2026-10-21',
            '2026-10-22',
            '2026-10-23',
            '2026-10-24',
            '2026-10-25',
        ]);
        expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
        expect(validDay('2026-02-29')).toBe(false);
        expect(validDay('invalid')).toBe(false);
    });
});
describe('overlapping appointments', () => {
    const event = (_id, startingTime, endingTime) => ({ _id, timeSlot: { startingTime, endingTime } });
    it('separates overlapping events into columns and releases columns for adjacent appointments', () => {
        const source = [
            event('a', '08:00', '09:00'),
            event('b', '08:30', '09:30'),
            event('c', '09:00', '09:30'),
            event('d', '09:30', '10:00'),
        ];
        const result = layoutEvents(source);
        expect(result.map(({ column, columns }) => [column, columns])).toEqual([
            [0, 2],
            [1, 2],
            [0, 2],
            [0, 1],
        ]);
        expect(source.map((item) => item._id)).toEqual(['a', 'b', 'c', 'd']);
    });
});
