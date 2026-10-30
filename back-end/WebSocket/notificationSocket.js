import jwt from 'jsonwebtoken';

const notificationSocketHandler = (io) => {
    io.on('connection', (socket) => {
        // Calendar rooms derive identity from the signed token, never a client-supplied user ID.
        socket.on('calendar-subscribe', async ({ token } = {}, acknowledge = () => {}) => {
            if (socket.data.calendarRoom) {
                await socket.leave(socket.data.calendarRoom);
                delete socket.data.calendarRoom;
            }
            try {
                const identity = jwt.verify(token, process.env.JWT_SECRET_KEY);
                if (!['doctor', 'patient'].includes(identity.role) || typeof identity.id !== 'string' || !identity.id) {
                    return acknowledge({ success: false });
                }
                const room = `calendar:${identity.role}:${identity.id}`;
                await socket.join(room);
                socket.data.calendarRoom = room;
                acknowledge({ success: true });
            } catch {
                acknowledge({ success: false });
            }
        });
        socket.on('calendar-unsubscribe', async () => {
            if (socket.data.calendarRoom) await socket.leave(socket.data.calendarRoom);
            delete socket.data.calendarRoom;
        });
        // When a doctor connects, they join their respective room
        socket.on('doctor-join-room', ({ doctorId }) => {
            socket.join(doctorId);
        });

        socket.on('user-join-room', ({ userId }) => {
            socket.join(userId);
        });

        // Handle client disconnection
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
};

export default notificationSocketHandler;
