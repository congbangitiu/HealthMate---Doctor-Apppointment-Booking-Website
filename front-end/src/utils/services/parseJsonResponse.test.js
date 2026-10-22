import { describe, expect, it, vi } from 'vitest';
import parseJsonResponse from './parseJsonResponse';

const response = (text, status = 200) => ({ status, ok: status < 400, text: vi.fn().mockResolvedValue(text) });

describe('parseJsonResponse', () => {
    it.each([
        ['object', '{"success":true,"data":{"id":"test-id"}}', { success: true, data: { id: 'test-id' } }],
        ['array', '[{"id":1},{"id":2}]', [{ id: 1 }, { id: 2 }]],
        ['null', 'null', null], ['boolean', 'false', false], ['number', '0', 0],
        ['string', '"message"', 'message'], ['whitespace', ' \n {"value":1} \t ', { value: 1 }],
    ])('FE-U01: parses a valid JSON %s without changing its value', async (_label, text, expected) => {
        const res = response(text);
        await expect(parseJsonResponse(res)).resolves.toEqual(expected);
        expect(res.text).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['HTML', '<html>Bad gateway</html>'], ['empty body', ''], ['whitespace', ' \n '],
        ['malformed JSON', '{"value":'], ['trailing comma', '{"value":1,}'],
    ])('FE-U02: reports HTTP status and a readable error for %s', async (_label, text) => {
        await expect(parseJsonResponse(response(text, 502))).rejects.toThrow(
            'Server returned an unexpected response (HTTP 502). Please try again later!',
        );
    });

    it.each([400, 401, 500])('FE-U03: returns valid JSON at HTTP %i so the caller can inspect res.ok', async (status) => {
        const body = { success: false, message: 'Request rejected' };
        await expect(parseJsonResponse(response(JSON.stringify(body), status))).resolves.toEqual(body);
    });

    it('FE-U04: propagates a body-reading error without disguising it as a JSON parse error', async () => {
        const error = new TypeError('Response body unavailable');
        const res = { status: 200, text: vi.fn().mockRejectedValue(error) };
        await expect(parseJsonResponse(res)).rejects.toBe(error);
        expect(res.text).toHaveBeenCalledTimes(1);
    });
});
