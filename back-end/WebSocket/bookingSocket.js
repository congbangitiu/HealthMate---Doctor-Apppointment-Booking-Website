const bookingSocketHandler = (io) => {
    io.on('connection', (socket) => {
        // When a doctor connects, they join their respective room
        socket.on('join-room', ({ doctorId }) => {
            socket.join(doctorId);
        });

        // Handle client disconnection
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
};

export default bookingSocketHandler;
