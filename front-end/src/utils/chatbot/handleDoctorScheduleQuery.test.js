import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../../config', () => ({ BASE_URL: 'http://localhost:5000/api/v1' }));
import handleDoctorScheduleQuery from './handleDoctorScheduleQuery';

const alice = { _id: 'alice-id', fullname: 'Alice Nguyen', availableSchedules: [{ day: 'Monday', shifts: ['Morning'] }] };
const jsonResponse = (body, ok = true, status = ok ? 200 : 500) => ({ ok, status, json: vi.fn().mockResolvedValue(body) });
let fetchMock;

beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
});

describe('handleDoctorScheduleQuery', () => {
    it.each(['Dr. ALICE NGUYEN!', 'Doctor Alice Nguyen?', 'When is Alice available?'])(
        'FE-C10: normalizes titles, case and punctuation in %j', async (text) => {
            fetchMock.mockResolvedValue(jsonResponse({ data: [alice] }));
            await expect(handleDoctorScheduleQuery(text)).resolves.toBe(alice);
            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock).toHaveBeenCalledWith('http://localhost:5000/api/v1/doctors');
        },
    );

    it('FE-C10: retains Vietnamese characters when matching a doctor name', async () => {
        const doctor = { _id: 'vietnamese-id', fullname: 'Nguyễn Ánh' };
        fetchMock.mockResolvedValue(jsonResponse({ data: [doctor] }));
        await expect(handleDoctorScheduleQuery('Doctor NGUYỄN ÁNH!')).resolves.toBe(doctor);
    });

    it('FE-C10: matches whole name words rather than substrings of another word', async () => {
        fetchMock.mockResolvedValue(jsonResponse({ data: [alice] }));
        await expect(handleDoctorScheduleQuery('Is Alicestone available?')).resolves.toBeNull();
    });

    it.each([{ data: [] }, {}, { data: null }, null])(
        'FE-C11: returns null when the response contains no doctor list: %j', async (body) => {
            fetchMock.mockResolvedValue(jsonResponse(body));
            await expect(handleDoctorScheduleQuery('Dr Alice')).resolves.toBeNull();
        },
    );

    it.each([
        ['shared-name-first', 'Doctor John Brown'], ['exact-name-first', 'Doctor John Brown'],
        ['shared-name-first', 'When is Doctor JOHN BROWN available?'],
        ['exact-name-first', 'When is Doctor JOHN BROWN available?'],
    ])(
        'FE-C12: resolves the explicit full name with API order %s in %j', async (order, text) => {
            const adams = { _id: 'adams-id', fullname: 'John Adams' };
            const brown = { _id: 'brown-id', fullname: 'John Brown' };
            const doctors = order === 'shared-name-first' ? [adams, brown] : [brown, adams];
            fetchMock.mockResolvedValue(jsonResponse({ data: doctors }));
            await expect(handleDoctorScheduleQuery(text)).resolves.toBe(brown);
        },
    );

    it.each([400, 500])('FE-C13: rejects HTTP %i instead of treating an error payload as doctor data', async (status) => {
        fetchMock.mockResolvedValue(jsonResponse({ message: 'Request rejected', data: [alice] }, false, status));
        await expect(handleDoctorScheduleQuery('Dr Alice')).rejects.toBeInstanceOf(Error);
    });

    it.each(['network', 'JSON'])('FE-C13: propagates a %s failure to the caller', async (kind) => {
        const error = kind === 'network' ? new TypeError('Network unavailable') : new SyntaxError('Invalid JSON');
        if (kind === 'network') fetchMock.mockRejectedValue(error);
        else fetchMock.mockResolvedValue({ ok: true, json: vi.fn().mockRejectedValue(error) });
        await expect(handleDoctorScheduleQuery('Dr Alice')).rejects.toBe(error);
    });

    it('FE-C12: respects name word boundaries when one full name is a prefix of another word', async () => {
        const lee = { _id: 'lee-id', fullname: 'Ann Lee' };
        const leeman = { _id: 'leeman-id', fullname: 'Ann Leeman' };
        fetchMock.mockResolvedValue(jsonResponse({ data: [lee, leeman] }));
        await expect(handleDoctorScheduleQuery('When is Doctor Ann Leeman available?')).resolves.toBe(leeman);
    });

    it('FE-C10: retains single-name-word fallback when no complete full name is provided', async () => {
        const adams = { _id: 'adams-id', fullname: 'John Adams' };
        const brown = { _id: 'brown-id', fullname: 'John Brown' };
        fetchMock.mockResolvedValue(jsonResponse({ data: [adams, brown] }));
        await expect(handleDoctorScheduleQuery('Dr Brown')).resolves.toBe(brown);
    });

    it('FE-C13: rejects an HTTP error before parsing an invalid error body', async () => {
        const res = { ok: false, status: 503, json: vi.fn().mockRejectedValue(new SyntaxError('HTML error body')) };
        fetchMock.mockResolvedValue(res);
        await expect(handleDoctorScheduleQuery('Dr Alice')).rejects.toThrow('HTTP 503');
        expect(res.json).not.toHaveBeenCalled();
    });

    it('FE-C10: skips records without a usable name when searching for a valid doctor', async () => {
        fetchMock.mockResolvedValue(jsonResponse({ data: [null, {}, { fullname: '' }, { fullname: 123 }, alice] }));
        await expect(handleDoctorScheduleQuery('Doctor Alice Nguyen')).resolves.toBe(alice);
    });
});
