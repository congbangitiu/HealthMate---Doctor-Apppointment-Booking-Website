const notificationSocketHandler = (io) => {
    io.on('connection', (socket) => {
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
