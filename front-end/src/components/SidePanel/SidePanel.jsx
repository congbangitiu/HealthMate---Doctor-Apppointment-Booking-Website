import { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './SidePanel.module.scss';
import convertTime from '../../utils/convertTime';
import { BASE_URL, token } from './../../../config';
import { toast } from 'react-toastify';
import SyncLoader from 'react-spinners/SyncLoader';

const cx = classNames.bind(styles);

const SidePanel = ({ doctorId, ticketPrice, timeSlots: initialTimeSlots = [], role }) => {
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [timeSlots, setTimeSlots] = useState(initialTimeSlots);
    const [loading, setLoading] = useState(false);

    const bookingHandler = async () => {
        if (!selectedSlot) {
            toast.error('Please select a time slot');
            return;
        }

        setLoading(true);

        try {
            const appointmentRes = await fetch(`${BASE_URL}/bookings/checkout-session/${doctorId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ timeSlot: selectedSlot }),
            });

            const appointmentData = await appointmentRes.json();
            if (!appointmentRes.ok) {
                throw new Error(appointmentData.message + '! Please try again !!!');
            }

            if (appointmentData.session.url) {
                // Remove the booked time slot from the available time slots
                setTimeSlots((prevSlots) => prevSlots.filter((slot) => slot !== selectedSlot));
                window.location.href = appointmentData.session.url;
            }

            // Create the chat after a successful booking
            const user = JSON.parse(localStorage.getItem('user'));

            const chatRes = await fetch(`${BASE_URL}/chats/create-chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ doctorId, userId: user._id }),
            });

            const chatData = await chatRes.json();
            if (!chatRes.ok) {
                throw new Error(chatData.message || 'Failed to create chat. Please try again.');
            }

            setLoading(false);
        } catch (error) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    return (
        <div className={cx('container')}>
            <div className={cx('price')}>
                <h4>Ticket price</h4>
                <h3>${ticketPrice}</h3>
            </div>
            <div className={cx('slots')}>
                <h4>Available Time Slots:</h4>
                {timeSlots?.map((timeSlot, index) => (
                    <div
                        key={index}
                        className={cx('slot', { selected: selectedSlot === timeSlot })}
                        onClick={() => setSelectedSlot(timeSlot)}
                    >
                        {role === 'patient' && (
                            <input
                                type="radio"
                                name="timeSlot"
                                value={index}
                                checked={selectedSlot === timeSlot}
                                onChange={() => setSelectedSlot(timeSlot)}
                            />
                        )}

                        <p>{timeSlot.day}</p>
                        <p>
                            {convertTime(timeSlot.startingTime)} - {convertTime(timeSlot.endingTime)}
                        </p>
                    </div>
                ))}
            </div>
            {role === 'patient' && timeSlots.length > 0 && (
                <div className={cx('booking-btn-wrapper')}>
                    <button className={cx('booking-btn')} onClick={bookingHandler}>
                        {loading ? <SyncLoader size={8} color="#ffffff" /> : 'Book appointment'}
                    </button>
                </div>
            )}
        </div>
    );
};

SidePanel.propTypes = {
    doctorId: PropTypes.string.isRequired,
    ticketPrice: PropTypes.number.isRequired,
    timeSlots: PropTypes.array.isRequired,
    role: PropTypes.string.isRequired,
};

export default SidePanel;
