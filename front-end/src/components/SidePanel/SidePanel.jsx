import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './SidePanel.module.scss';
import convertTime from '../../utils/convertTime';

const cx = classNames.bind(styles);

const SidePanel = ({ ticketPrice, timeSlots }) => {
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
                <button className={cx('booking-btn')}>Book appointment</button>
            </div>
        </div>
    );
};

// Add PropTypes
SidePanel.propTypes = {
    ticketPrice: PropTypes.number.isRequired,
    timeSlots: PropTypes.array.isRequired,
};

export default SidePanel;
