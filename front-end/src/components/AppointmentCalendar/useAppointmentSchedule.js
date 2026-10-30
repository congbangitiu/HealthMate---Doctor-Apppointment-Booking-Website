import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { authContext } from '../../context/AuthContext';
import { BASE_URL } from '../../../config';
import socket from '../../utils/services/socket';

export default function useAppointmentSchedule(role) {
    const { token, user } = useContext(authContext);
    const [revision, setRevision] = useState(0);
    const [state, setState] = useState({
        appointments: [],
        slots: [],
        loading: true,
        refreshing: false,
        error: '',
        slotError: '',
    });
    const loaded = useRef(false);
    const refresh = useCallback(() => setRevision((value) => value + 1), []);
    const request = useCallback(
        async (path, options = {}) => {
            const response = await fetch(`${BASE_URL}${path}`, {
                ...options,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
            });
            const body = await response.json();
            if (!response.ok)
                throw Object.assign(new Error(body.message || 'Request failed'), { code: body.code || 'SAVE_FAILED' });
            return body.data;
        },
        [token],
    );

    useEffect(() => {
        loaded.current = false;
        setState({ appointments: [], slots: [], loading: true, refreshing: false, error: '', slotError: '' });
    }, [role, token, user?._id]);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;
        setState((current) => ({ ...current, loading: !loaded.current, refreshing: loaded.current, error: '' }));
        const options = { signal: controller.signal };
        Promise.all([
            request(`/${role === 'doctor' ? 'doctors' : 'users'}/appointments/my-appointments`, options),
            role === 'doctor'
                ? request('/bookings/calendar/availability', options)
                      .then((slots) => ({ slots, slotError: '' }))
                      .catch((error) => ({ slots: [], slotError: error.code || 'LOAD_FAILED' }))
                : Promise.resolve({ slots: [], slotError: '' }),
        ])
            .then(([appointments, availability]) => {
                if (!active) return;
                loaded.current = true;
                setState({
                    appointments: Array.isArray(appointments) ? appointments : [],
                    ...availability,
                    loading: false,
                    refreshing: false,
                    error: '',
                });
            })
            .catch(() => {
                if (active)
                    setState((current) => ({ ...current, loading: false, refreshing: false, error: 'loadError' }));
            });
        return () => {
            active = false;
            controller.abort();
        };
    }, [role, request, revision, user?._id]);

    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') refresh();
        };
        const subscribe = () => {
            socket.emit('calendar-subscribe', { token });
            refresh();
        };
        socket.on('appointments-changed', refresh);
        socket.on('connect', subscribe);
        if (socket.connected) subscribe();
        window.addEventListener('focus', refresh);
        document.addEventListener('visibilitychange', onVisible);
        // Recover missed events, including deployments where Socket.IO is unavailable.
        const timer = setInterval(onVisible, 60000);
        return () => {
            socket.off('appointments-changed', refresh);
            socket.off('connect', subscribe);
            socket.emit('calendar-unsubscribe');
            window.removeEventListener('focus', refresh);
            document.removeEventListener('visibilitychange', onVisible);
            clearInterval(timer);
        };
    }, [refresh, token]);
    return { ...state, refresh, request };
}
