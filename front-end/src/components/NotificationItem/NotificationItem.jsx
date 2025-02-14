import { useState, useEffect } from 'react';
import formatTimeAgo from '../../utils/formatTimeAgo';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './NotificationItem.module.scss';
import formatDate from '../../utils/formatDate';
import convertTime from '../../utils/convertTime';

const cx = classNames.bind(styles);

const NotificationItem = ({ notification, role }) => {
    const [timeAgo, setTimeAgo] = useState(formatTimeAgo(notification.createdAt));

    useEffect(() => {
        // Update time ago immediately
        setTimeAgo(formatTimeAgo(notification.createdAt));

        // Update time ago every 60 seconds
        const interval = setInterval(() => {
            setTimeAgo(formatTimeAgo(notification.createdAt));
        }, 60000);

        // Cleanup when component unmounts
        return () => clearInterval(interval);
    }, [notification.createdAt]);

    return (
        <div className={cx('container')}>
            {role === 'doctor' && (
                <>
                    <img src={notification.user.photo} alt={notification.user.fullname} />
                    <div className={cx('details')}>
                        <p>
                            <b>{notification.user.fullname}</b> has booked an appointment on{' '}
                            <b>{formatDate(notification.timeSlot.day)}</b> at{' '}
                            <b>{convertTime(notification.timeSlot.startingTime)}</b>
                        </p>
                        <p>{timeAgo}</p>
                    </div>
                </>
            )}

            {role === 'patient' && (
                <>
                    <img
                        src="https://img.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg"
                        alt=""
                    />
                    <div className={cx('details')}>
                        <p>
                            <b>Dr. John Smith</b> has completed your appointment on <b>[Date]</b> at <b>[Time]</b> and
                            issued your prescription.
                        </p>
                        <p>10 minutes ago</p>
                    </div>
                </>
            )}
        </div>
    );
};

NotificationItem.propTypes = {
    notification: PropTypes.object.isRequired,
    role: PropTypes.string.isRequired,
};

export default NotificationItem;
