import { act, fireEvent, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useNotificationSound from './useNotificationSound';
let player;
beforeEach(() => {
    player = { play: vi.fn().mockResolvedValue(undefined), pause: vi.fn(), muted: false, currentTime: 0 };
    vi.stubGlobal(
        'Audio',
        vi.fn(function () {
            return player;
        }),
    );
});
describe('notification sound playback', () => {
    it('reuses the same audio element unlocked by interaction', async () => {
        const { result } = renderHook(() => useNotificationSound());
        fireEvent.pointerDown(window);
        await waitFor(() => expect(player.pause).toHaveBeenCalled());
        await act(async () => result.current());
        expect(Audio).toHaveBeenCalledTimes(1);
        expect(player.muted).toBe(false);
        expect(player.play).toHaveBeenCalledTimes(2);
    });
    it('retries an autoplay-blocked alert on the next user interaction', async () => {
        player.play.mockRejectedValueOnce(Object.assign(new Error('blocked'), { name: 'NotAllowedError' }));
        const { result } = renderHook(() => useNotificationSound());
        await act(async () => result.current());
        fireEvent.keyDown(window, { key: 'Enter' });
        await waitFor(() => expect(player.play).toHaveBeenCalledTimes(2));
        expect(player.muted).toBe(false);
    });
});
