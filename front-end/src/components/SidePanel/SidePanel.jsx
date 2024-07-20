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
            const res = await fetch(`${BASE_URL}/bookings/checkout-session/${doctorId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ timeSlot: selectedSlot }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message + '! Please try again !!!');
            }
            if (data.session.url) {
                // Remove the booked time slot from the available time slots
                setTimeSlots((prevSlots) => prevSlots.filter((slot) => slot !== selectedSlot));
                window.location.href = data.session.url;
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
