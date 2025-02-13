import Booking from '../Models/BookingSchema.js';

const bookingSocketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected for booking notifications:', socket.id);

        // When a doctor connects, they join their respective room
        socket.on('join-room', ({ doctorId }) => {
            socket.join(doctorId);
            console.log(`Doctor ${doctorId} joined their room`);
        });

        // Handle a new booking event
        socket.on('new-booking', async ({ bookingId }) => {
            try {
                // Find the latest booking with populated doctor and user details
                const booking = await Booking.findById(bookingId).populate('doctor user');
                if (!booking) {
                    console.error(`Booking not found: ${bookingId}`);
                    return;
                }

                const { doctor, user, timeSlot, ticketPrice, paymentMethod, isPaid, createdAt } = booking;

                // Check if the doctor has joined the room
                const rooms = io.sockets.adapter.rooms;
                if (!rooms.get(doctor._id.toString())) {
                    console.warn(`Doctor ${doctor._id} is not in any room, cannot send notification`);
                    return;
                }

                // Send real-time booking notification to the doctor
                io.to(doctor._id.toString()).emit('booking-notification', {
                    user: {
                        id: user._id,
                        fullname: user.fullname,
                        photo: user.photo,
                    },
                    timeSlot,
                    ticketPrice,
                    paymentMethod,
                    isPaid,
                    createdAt,
                });

                console.log(`Booking notification sent to doctor ${doctor._id}`);
            } catch (error) {
                console.error('Error handling new booking event:', error);
            }
        });

        // Handle client disconnection
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
};

export default bookingSocketHandler;
