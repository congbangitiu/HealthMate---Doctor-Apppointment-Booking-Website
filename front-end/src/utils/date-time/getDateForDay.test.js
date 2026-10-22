import { beforeEach, describe, expect, it, vi } from 'vitest';
import getDateForDay from './getDateForDay';

function expectInvalidDay(input) {
    let result;
    try { result = getDateForDay(input); }
    catch (error) { expect(error).toBeInstanceOf(Error); return; }
    expect(result).toBeNull();
}

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T12:00:00+07:00'));
});

describe('getDateForDay', () => {
    it('FE-D01: returns today when the requested weekday is today', () => {
        expect(getDateForDay('Tuesday')).toBe('2026-10-20');
    });

    it.each([
        ['Wednesday', '2026-10-21'], ['Saturday', '2026-10-24'],
        ['Sunday', '2026-10-25'], ['Monday', '2026-10-26'],
    ])('FE-D02: returns the next %s within seven days', (day, expected) => {
        expect(getDateForDay(day)).toBe(expected);
    });

    it.each([
        ['2026-01-31T12:00:00+07:00', 'Sunday', '2026-02-01'],
        ['2026-12-31T12:00:00+07:00', 'Friday', '2027-01-01'],
        ['2028-02-28T12:00:00+07:00', 'Tuesday', '2028-02-29'],
    ])('FE-D02: crosses month, year, or leap-day boundaries from %s', (now, day, expected) => {
        vi.setSystemTime(new Date(now));
        expect(getDateForDay(day)).toBe(expected);
    });

    it.each(['00:00:00', '00:30:00', '06:59:59', '07:00:00'])(
        'FE-D03: retains the Vietnam calendar date at %s', (time) => {
            vi.setSystemTime(new Date(`2026-10-20T${time}+07:00`));
            expect(new Date().getTimezoneOffset()).toBe(-420);
            expect(getDateForDay('Tuesday')).toBe('2026-10-20');
            expect(getDateForDay('Wednesday')).toBe('2026-10-21');
        },
    );

    it.each(['NotADay', 'tuesday', '', null, undefined])(
        'FE-D04: rejects an invalid weekday instead of returning an unrelated date: %j', expectInvalidDay,
    );
});
