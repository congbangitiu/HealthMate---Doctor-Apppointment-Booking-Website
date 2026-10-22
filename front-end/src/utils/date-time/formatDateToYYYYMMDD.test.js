import { describe, expect, it } from 'vitest';
import formatDateToYYYYMMDD from './formatDateToYYYYMMDD';

describe('formatDateToYYYYMMDD', () => {
    it('FE-D05: pads single-digit months and days using the local calendar date', () => {
        expect(formatDateToYYYYMMDD(new Date('2026-01-05T00:30:00+07:00'))).toBe('2026-01-05');
        expect(formatDateToYYYYMMDD('2026-01-05')).toBe('2026-01-05');
    });

    it.each(['2028-02-29', '2026-12-31', '2027-01-01'])(
        'FE-D06: preserves the leap-day or year boundary %s', (date) => {
            expect(formatDateToYYYYMMDD(new Date(`${date}T12:00:00+07:00`))).toBe(date);
        },
    );

    it.each([['unparseable string', 'not-a-date'], ['invalid Date', new Date(NaN)], ['missing value', undefined]])(
        'FE-D07: rejects %s instead of returning NaN fields', (_label, value) => {
            let result;
            try { result = formatDateToYYYYMMDD(value); }
            catch (error) { expect(error).toBeInstanceOf(Error); return; }
            expect(result).toBeNull();
        },
    );
});
