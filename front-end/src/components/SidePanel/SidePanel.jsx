import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './SidePanel.module.scss';
import convertTime from '../../utils/convertTime';
import { BASE_URL, token } from './../../../config';
import { toast } from 'react-toastify';

const cx = classNames.bind(styles);

const SidePanel = ({ doctorId, ticketPrice, timeSlots }) => {
    const bookingHandler = async () => {
        try {
            const res = await fetch(`${BASE_URL}/bookings/checkout-session/${doctorId}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message + '! Please try again !!!');
            }
            if (data.session.url) {
                window.location.href = data.session.url;
            }
        } catch (error) {
            toast.error(error.message);
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
                    <div key={index} className={cx('slot')}>
                        <p>{timeSlot.day}</p>
                        <p>
                            {convertTime(timeSlot.startingTime)} - {convertTime(timeSlot.endingTime)}
                        </p>
                    </div>
                ))}
            </div>
            <div className={cx('booking-btn-wrapper')}>
                <button className={cx('booking-btn')} onClick={bookingHandler}>
                    Book appointment
                </button>
            </div>
        </div>
    );
};

SidePanel.propTypes = {
    doctorId: PropTypes.string.isRequired,
    ticketPrice: PropTypes.number.isRequired,
    timeSlots: PropTypes.array.isRequired,
};

export default SidePanel;
