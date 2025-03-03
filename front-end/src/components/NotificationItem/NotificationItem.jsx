import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import formatTimeAgo from '../../utils/formatTimeAgo';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './NotificationItem.module.scss';
import formatDate from '../../utils/formatDate';
import convertTime from '../../utils/convertTime';

const cx = classNames.bind(styles);

const NotificationItem = ({ notification, role, handleCloseNotifications }) => {
    const navigate = useNavigate();
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

    const handleMoveToPrescription = () => {
        if (notification.status === 'cancelled') return;
        if (notification.appointmentId) {
            navigate(
                `/${role === 'doctor' ? 'doctors' : 'users'}/appointments/my-appointments/${
                    notification.appointmentId
                }`,
            );
        }
        handleCloseNotifications();
    };

    return (
        <div
            className={cx('container', {
                cancelledStatus: notification.status === 'cancelled',
                doneStatus: notification.status === 'done',
            })}
            onClick={handleMoveToPrescription}
        >
            {role === 'doctor' && notification.type === 'booking' && notification.status !== 'done' && (
                <>
                    <img src={notification.user.photo} alt={notification.user.fullname} />
                    <div className={cx('details')}>
                        <p>
                            <b>{notification.user.fullname}</b> has{' '}
                            {notification.status === 'pending' ? <b>booked</b> : <b>cancelled</b>}{' '}
                            {notification.status === 'pending' ? 'an' : 'the'} appointment on{' '}
                            <b>{formatDate(notification.timeSlot?.day)}</b> at{' '}
                            <b>{convertTime(notification.timeSlot?.startingTime)}</b>
                        </p>
                        <p>{timeAgo}</p>
                    </div>
                </>
            )}

            {role === 'patient' && notification.type === 'prescription' && (
                <>
                    <img src={notification.doctor.photo} alt={notification.doctor.fullname} />
                    <div className={cx('details')}>
                        <p>
                            <b>Dr. {notification.doctor.fullname}</b> has{' '}
                            {notification.action === 'create' ? <b>issued</b> : <b>updated</b>} your prescription for
                            your appointment on <b>{formatDate(notification.timeSlot.day)}</b> at{' '}
                            <b>{convertTime(notification.timeSlot.startingTime)}</b>
                        </p>
                        <p>{timeAgo}</p>
                    </div>
                </>
            )}
        </div>
    );
};

NotificationItem.propTypes = {
    notification: PropTypes.object.isRequired,
    role: PropTypes.string.isRequired,
    handleCloseNotifications: PropTypes.func.isRequired,
};

export default NotificationItem;
