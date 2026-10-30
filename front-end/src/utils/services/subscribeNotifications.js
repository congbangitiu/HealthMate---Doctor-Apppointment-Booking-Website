export default function subscribeNotifications(socket, role, userId, handlers) {
    const joinRoom = () => {
        if (role === 'doctor') socket.emit('doctor-join-room', { doctorId: userId });
        else if (role === 'patient') socket.emit('user-join-room', { userId });
    };

    for (const [event, handler] of Object.entries(handlers)) socket.on(event, handler);
    socket.on('connect', joinRoom);
    if (socket.connected) joinRoom();

    return () => {
        socket.off('connect', joinRoom);
        for (const [event, handler] of Object.entries(handlers)) socket.off(event, handler);
    };
}
