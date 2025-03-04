import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './Notifications.module.scss';
import formatTimeAgo from '../../utils/formatTimeAgo';
import formatDate from '../../utils/formatDate';
import convertTime from '../../utils/convertTime';
import { IoIosNotifications } from 'react-icons/io';

const cx = classNames.bind(styles);

const Notifications = ({ notifications, role, handleCloseNotifications }) => {
    const navigate = useNavigate();
    const [timeAgoMap, setTimeAgoMap] = useState({});

    useEffect(() => {
        const updateTimes = () => {
            const newTimeAgoMap = {};
            notifications.forEach((notification) => {
                newTimeAgoMap[notification.id] = formatTimeAgo(notification.createdAt);
            });
            setTimeAgoMap(newTimeAgoMap);
        };

        updateTimes();
        const interval = setInterval(updateTimes, 60000);

        return () => clearInterval(interval);
    }, [notifications]);

    const handleMoveToPrescription = (notification) => {
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

    console.log('notifications: ', notifications);

    return (
        <div className={cx('container')}>
            <header>Notifications</header>
            {notifications.length > 0 ? (
                <div className={cx('notifications')}>
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={cx('notification', {
                                cancelledStatus: notification.status === 'cancelled',
                                doneStatus: notification.status === 'done',
                            })}
                            onClick={() => handleMoveToPrescription(notification)}
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
                                        <p>{timeAgoMap[notification.id]}</p>
                                    </div>
                                </>
                            )}

                            {role === 'patient' && notification.type === 'prescription' && (
                                <>
                                    <img src={notification.doctor.photo} alt={notification.doctor.fullname} />
                                    <div className={cx('details')}>
                                        <p>
                                            <b>Dr. {notification.doctor.fullname}</b> has{' '}
                                            {notification.action === 'create' ? <b>issued</b> : <b>updated</b>} the
                                            prescription for your appointment on{' '}
                                            <b>{formatDate(notification.timeSlot.day)}</b> at{' '}
                                            <b>{convertTime(notification.timeSlot.startingTime)}</b>
                                        </p>
                                        <p>{timeAgoMap[notification.id]}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className={cx('no-noti')}>
                    <div>
                        <IoIosNotifications className={cx('icon')} />
                    </div>
                    {role === 'doctor' ? (
                        <p>
                            No new notifications for now. You&apos;ll receive updates here when a patient books or
                            cancels an appointment.
                        </p>
                    ) : (
                        <p>
                            You have no new notifications at the moment. Stay updated here for appointment confirmations
                            and prescription updates from your doctor.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

Notifications.propTypes = {
    notifications: PropTypes.array.isRequired,
    role: PropTypes.string.isRequired,
    handleCloseNotifications: PropTypes.func.isRequired,
};

export default Notifications;
