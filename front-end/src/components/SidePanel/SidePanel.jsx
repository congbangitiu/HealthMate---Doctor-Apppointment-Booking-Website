import React from 'react';
import classNames from 'classnames/bind';
import styles from './SidePanel.module.scss';

const cx = classNames.bind(styles);

const SidePanel = () => {
    return (
        <div className={cx('container')}>
            <div className={cx('price')}>
                <h4>Ticket price</h4>
                <h3>$500</h3>
            </div>
            <div className={cx('slots')}>
                <h4>Available Time Slots:</h4>
                <div className={cx('slot')}>
                    <p>Sunday</p>
                    <p>4:00 PM - 9:30PM</p>
                </div>
                <div className={cx('slot')}>
                    <p>Sunday</p>
                    <p>4:00 PM - 9:30PM</p>
                </div>
                <div className={cx('slot')}>
                    <p>Sunday</p>
                    <p>4:00 PM - 9:30PM</p>
                </div>
            </div>
            <div className={cx('booking-btn-wrapper')}>
                <button className={cx('booking-btn')}>Book appointment</button>
            </div>
        </div>
    );
};

export default SidePanel;
