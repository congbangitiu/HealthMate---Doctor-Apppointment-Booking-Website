import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

vi.mock('../../config', () => ({ token: 'unit-test-token' }));
import useFetchData from './useFetchData';

const urlA = 'http://localhost:5000/api/v1/test/a';
const urlB = 'http://localhost:5000/api/v1/test/b';
let fetchMock;

const deferred = () => {
    let resolve;
    const promise = new Promise((finish) => { resolve = finish; });
    return { promise, resolve };
};
const jsonResponse = (body, ok = true) => ({ ok, json: vi.fn().mockResolvedValue(body) });

beforeEach(() => {
    fetchMock = vi.fn();
    // Direct fetch control isolates promise order. No MSW handlers are used in this suite.
    vi.stubGlobal('fetch', fetchMock);
});

describe('useFetchData', () => {
    it('FE-H01: exposes loading while pending and then unwraps the data response', async () => {
        const pending = deferred();
        fetchMock.mockReturnValue(pending.promise);
        const { result } = renderHook(() => useFetchData(urlA));
        expect(result.current).toEqual({ data: [], loading: true, error: null });
        const data = [{ _id: 'doctor-id' }];
        await act(async () => { pending.resolve(jsonResponse({ data })); await pending.promise; });
        expect(result.current).toEqual({ data, loading: false, error: null });
    });

    it('FE-H02: returns the full response when no data field is present', async () => {
        const body = { success: true, appointments: [] };
        fetchMock.mockResolvedValue(jsonResponse(body));
        const { result } = renderHook(() => useFetchData(urlA));
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.data).toEqual(body);
        expect(result.current.error).toBeNull();
    });

    it.each([400, 500])('FE-H03: exposes the server message and stops loading for HTTP %i', async (status) => {
        fetchMock.mockResolvedValue(jsonResponse({ message: `HTTP ${status} failed` }, false));
        const { result } = renderHook(() => useFetchData(urlA));
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe(`HTTP ${status} failed`);
        expect(result.current.data).toEqual([]);
    });

    it.each(['network', 'JSON parsing'])('FE-H04: stops loading and exposes a %s error', async (kind) => {
        if (kind === 'network') fetchMock.mockRejectedValue(new TypeError('Network unavailable'));
        else fetchMock.mockResolvedValue({ ok: true, json: vi.fn().mockRejectedValue(new SyntaxError('Invalid JSON')) });
        const { result } = renderHook(() => useFetchData(urlA));
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe(kind === 'network' ? 'Network unavailable' : 'Invalid JSON');
        expect(result.current.data).toEqual([]);
    });

    it('FE-H05: refetches a changed URL with the configured authorization token', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse({ data: ['A'] })).mockResolvedValueOnce(jsonResponse({ data: ['B'] }));
        const { result, rerender } = renderHook(({ url }) => useFetchData(url), { initialProps: { url: urlA } });
        await waitFor(() => expect(result.current.data).toEqual(['A']));
        rerender({ url: urlB });
        await waitFor(() => expect(result.current.data).toEqual(['B']));
        expect(fetchMock).toHaveBeenCalledTimes(2);
        for (const [index, url] of [urlA, urlB].entries()) {
            expect(fetchMock).toHaveBeenNthCalledWith(index + 1, url, expect.objectContaining({
                headers: expect.objectContaining({ Authorization: 'Bearer unit-test-token' }),
            }));
        }
    });

    it('FE-H06 [KNOWN BUG]: clears an earlier error after a successful refetch', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'First request failed' }, false))
            .mockResolvedValueOnce(jsonResponse({ data: ['B'] }));
        const { result, rerender } = renderHook(({ url }) => useFetchData(url), { initialProps: { url: urlA } });
        await waitFor(() => expect(result.current.error).toBe('First request failed'));
        rerender({ url: urlB });
        await waitFor(() => expect(result.current.data).toEqual(['B']));
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('FE-H07 [KNOWN BUG]: keeps the latest URL data when an older request finishes last', async () => {
        const first = deferred();
        const second = deferred();
        fetchMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
        const { result, rerender } = renderHook(({ url }) => useFetchData(url), { initialProps: { url: urlA } });
        rerender({ url: urlB });
        await act(async () => { second.resolve(jsonResponse({ data: ['B'] })); await second.promise; });
        expect(result.current.data).toEqual(['B']);
        await act(async () => { first.resolve(jsonResponse({ data: ['A'] })); await first.promise; });
        expect(result.current.data).toEqual(['B']);
    });

    it.todo('FE-H08: verifies abort or ignored completion after unmount with an explicit observable cleanup contract');
});
