import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './Notifications.module.scss';
import formatTimeAgo from '../../utils/date-time/formatTimeAgo';
import formatDate from '../../utils/date-time/formatDate';
import convertTime from '../../utils/date-time/convertTime';
import { IoIosNotifications, IoIosArrowBack } from 'react-icons/io';
import { useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const Notifications = ({ notifications, role, handleCloseNotifications }) => {
    const { t, i18n } = useTranslation('notification');
    const navigate = useNavigate();
    const isMobile = useMediaQuery('(max-width:768px)');
    const [timeAgoMap, setTimeAgoMap] = useState({});

    useEffect(() => {
        const updateTimes = () => {
            const newTimeAgoMap = {};
            notifications.forEach((notification) => {
                newTimeAgoMap[notification.id] = formatTimeAgo(notification.createdAt, i18n);
            });
            setTimeAgoMap(newTimeAgoMap);
        };

        updateTimes();
        const interval = setInterval(updateTimes, 60000);

        return () => clearInterval(interval);
    }, [notifications, i18n]);

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

    const getNotificationMessage = (notification) => {
        let key = '';
        let name = '';
        let date = '';
        let time = '';

        if (role === 'doctor' && notification.type === 'booking' && !notification.isReExamination) {
            key = notification.status === 'pending' ? 'doctorBooked' : 'doctorCancelled';
            name = notification.user.fullname;
            date = notification.timeSlot?.day;
            time = notification.timeSlot?.startingTime;
        } else if (role === 'patient' && notification.type === 'prescription') {
            key = notification.action === 'create' ? 'prescriptionIssued' : 'prescriptionUpdated';
            name = notification.doctor.fullname;
            date = notification.timeSlot?.day;
            time = notification.timeSlot?.startingTime;
        } else if (role === 'patient' && notification.isReExamination) {
            key = 'reExamination';
            name = notification.doctor.fullname;
            date = notification.timeSlot?.day;
            time = notification.timeSlot?.startingTime;
        }

        return (
            <p>
                {t(`${key}.prefix`)} {name} <b>{t(`${key}.action`)}</b>
                {t(`${key}.suffix`) && <> {t(`${key}.suffix`)}</>} <b>{formatDate(date)}</b> {t('at')}{' '}
                <b>{convertTime(time)}</b>
            </p>
        );
    };

    return (
        <div className={cx('container')}>
            <header>
                {isMobile && <IoIosArrowBack className={cx('icon')} onClick={handleCloseNotifications} />}
                {t('title')}
            </header>

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
                            <img
                                src={role === 'doctor' ? notification.user.photo : notification.doctor.photo}
                                alt={role === 'doctor' ? notification.user.fullname : notification.doctor.fullname}
                            />
                            <div className={cx('details')}>
                                {getNotificationMessage(notification)}
                                <p>{timeAgoMap[notification.id]}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={cx('no-noti')}>
                    <div>
                        <IoIosNotifications className={cx('icon')} />
                    </div>
                    <p>{role === 'doctor' ? t('emptyDescriptionDoctor') : t('emptyDescriptionPatient')}</p>
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
