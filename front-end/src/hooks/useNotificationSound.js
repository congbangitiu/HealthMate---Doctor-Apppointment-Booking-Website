import { useCallback, useEffect, useRef } from 'react';
import notificationSound from '../assets/sounds/notificationSound.wav';

// Reuse the same media element unlocked by a real interaction, and retry blocked alerts on the next gesture.
const useNotificationSound = () => {
    const audio = useRef(null);
    const pending = useRef(false);
    const unlocked = useRef(false);
    const generation = useRef(0);
    const getAudio = useCallback(() => {
        if (!audio.current) {
            audio.current = new Audio(notificationSound);
            audio.current.preload = 'auto';
        }
        return audio.current;
    }, []);
    const play = useCallback(() => {
        const player = getAudio();
        const version = ++generation.current;
        pending.current = false;
        player.muted = false;
        player.currentTime = 0;
        try {
            Promise.resolve(player.play())
                .then(() => {
                    unlocked.current = true;
                })
                .catch((error) => {
                    if (version !== generation.current) return;
                    if (error.name === 'NotAllowedError') pending.current = true;
                    else console.error('Error playing notification sound:', error);
                });
        } catch (error) {
            if (error.name === 'NotAllowedError') pending.current = true;
            else console.error('Error playing notification sound:', error);
        }
    }, [getAudio]);
    useEffect(() => {
        const unlock = () => {
            if (pending.current) {
                play();
                return;
            }
            if (unlocked.current) return;
            const player = getAudio();
            const version = ++generation.current;
            player.muted = true;
            try {
                Promise.resolve(player.play())
                    .then(() => {
                        if (version !== generation.current) return;
                        player.pause?.();
                        player.currentTime = 0;
                        player.muted = false;
                        unlocked.current = true;
                    })
                    .catch(() => {
                        if (version === generation.current) player.muted = false;
                    });
            } catch {
                player.muted = false;
            }
        };
        window.addEventListener('pointerdown', unlock);
        window.addEventListener('keydown', unlock);
        return () => {
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
            generation.current += 1;
            audio.current?.pause?.();
        };
    }, [getAudio, play]);
    return play;
};
export default useNotificationSound;
