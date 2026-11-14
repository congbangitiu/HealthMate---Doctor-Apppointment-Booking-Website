import defaultAvatar from '../../assets/images/default-notification-avatar.svg';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './Notifications.module.scss';
import formatTimeAgo from '../../utils/date-time/formatTimeAgo';
import formatDateForDisplay from '../../utils/date-time/formatDateForDisplay';
import convertTime from '../../utils/date-time/convertTime';
import { IoIosNotifications, IoIosArrowBack } from 'react-icons/io';
import useResponsive from '../../hooks/useResponsive';
import { Trans, useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const Notifications = ({ notifications, role, handleCloseNotifications, loadError = false, onSupportRead }) => {
    const { t, i18n } = useTranslation('notification');
    const navigate = useNavigate();
    const { isMobile } = useResponsive();
    const [timeAgoMap, setTimeAgoMap] = useState({});
    const visibleNotifications = notifications.filter((item) => item.status !== 'done').slice(0, 6);
    const handleViewAll = () => {
        navigate(
            role === 'admin'
                ? '/admins/management/support'
                : role === 'doctor'
                ? '/doctors/profile/me?tab=appointments'
                : '/users/profile/me',
        );
        handleCloseNotifications();
    };

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
    }, [notifications, i18n, i18n.resolvedLanguage]);

    const handleMoveToPrescription = (notification) => {
        if (notification.type === 'support-update') {
            void onSupportRead?.(notification);
            navigate('/support-requests?request=' + notification.requestId);
            handleCloseNotifications();
            return;
        }
        if (role === 'admin') {
            navigate('/admins/management/support?request=' + notification.requestId);
            handleCloseNotifications();
            return;
        }
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
        if (notification.type === 'support-update') {
            return (
                <p>
                    <Trans
                        t={t}
                        i18nKey={notification.kind === 'status' ? 'supportStatusUpdated' : 'supportReplyReceived'}
                        components={{ bold: <b /> }}
                        values={{
                            requestId: '#' + notification.requestId,
                            status: t('supportManagement:statuses.' + notification.supportStatus),
                        }}
                    />
                </p>
            );
        }
        if (role === 'admin') {
            const subject =
                notification.category === 'other'
                    ? notification.subject
                    : t('contact:categories.' + notification.category);
            const isVietnamese = i18n.resolvedLanguage?.startsWith('vi');
            const name =
                (notification.senderRole === 'doctor' ? (isVietnamese ? 'BS. ' : 'Dr. ') : '') + notification.fullname;
            const submittedAt = new Date(notification.requestCreatedAt || notification.createdAt);
            const locale = isVietnamese ? 'vi-VN' : 'en-US';
            const date = submittedAt.toLocaleDateString(locale, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                timeZone: 'Asia/Ho_Chi_Minh',
            });
            const time = submittedAt.toLocaleTimeString(locale, {
                hour: '2-digit',
                minute: '2-digit',
                hour12: locale === 'en-US',
                timeZone: 'Asia/Ho_Chi_Minh',
            });
            return (
                <p>
                    <Trans
                        t={t}
                        i18nKey={notification.kind === 'message' ? 'supportMessage' : 'supportRequest'}
                        components={{ bold: <b /> }}
                        values={{ name, subject, requestId: '#' + notification.requestId, date, time }}
                    />
                </p>
            );
        }
        let key = '';
        let name = '';
        let date = '';
        let time = '';

        if (role === 'doctor' && notification.type === 'booking' && !notification.isReExamination) {
            key = notification.status === 'pending' ? 'doctorBooked' : 'doctorCancelled';
            name = notification.user.fullname;
            date = notification.timeSlot?.day;
            time = notification.timeSlot?.startingTime;
        } else if (role === 'patient' && notification.type === 'reschedule') {
            return (
                <p>
                    <Trans
                        i18nKey="rescheduled"
                        t={t}
                        components={{ bold: <b /> }}
                        values={{
                            name: notification.doctor?.fullname || '',
                            oldDate: formatDateForDisplay(notification.from?.day),
                            oldTime: `${notification.from?.startingTime}–${notification.from?.endingTime}`,
                            newDate: formatDateForDisplay(notification.timeSlot?.day),
                            newTime: `${notification.timeSlot?.startingTime}–${notification.timeSlot?.endingTime}`,
                        }}
                    />
                </p>
            );
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
                {t(`${key}.suffix`) && <> {t(`${key}.suffix`)}</>} <b>{formatDateForDisplay(date)}</b> {t('at')}{' '}
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

            {loadError && (
                <p className={cx('load-error')} role="alert">
                    {t('supportRealtime:loadFailed')}
                </p>
            )}
            {visibleNotifications.length > 0 ? (
                <div className={cx('notifications')}>
                    {visibleNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={cx('notification', {
                                'support-notification': role === 'admin' || notification.type === 'support-update',
                                unread: notification.isRead === false,
                                cancelledStatus: notification.status === 'cancelled',
                                doneStatus: notification.status === 'done',
                            })}
                            role="button"
                            tabIndex={notification.status === 'cancelled' ? -1 : 0}
                            aria-disabled={notification.status === 'cancelled'}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    handleMoveToPrescription(notification);
                                }
                            }}
                            onClick={() => handleMoveToPrescription(notification)}
                        >
                            <img
                                src={
                                    (notification.type === 'support-update'
                                        ? notification.photo
                                        : role === 'admin'
                                        ? notification.senderRole === 'guest'
                                            ? null
                                            : notification.photo
                                        : role === 'doctor'
                                        ? notification.user?.photo
                                        : notification.doctor?.photo) || defaultAvatar
                                }
                                alt={
                                    notification.type === 'support-update'
                                        ? notification.actorName || t('supportRealtime:supportTeam')
                                        : role === 'admin'
                                        ? notification.fullname
                                        : role === 'doctor'
                                        ? notification.user?.fullname
                                        : notification.doctor?.fullname
                                }
                                onError={(event) => {
                                    event.currentTarget.onerror = null;
                                    if (event.currentTarget.getAttribute('src') !== defaultAvatar)
                                        event.currentTarget.src = defaultAvatar;
                                }}
                            />
                            <div className={cx('details')}>
                                {getNotificationMessage(notification)}
                                <p>
                                    {timeAgoMap[notification.id]}
                                    {notification.isRead === false && (
                                        <span>
                                            {' \u00b7 '}
                                            {t('unread')}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={cx('no-noti')}>
                    <div>
                        <IoIosNotifications className={cx('icon')} />
                    </div>
                    <p>
                        {role === 'admin'
                            ? t('supportRealtime:noNotifications')
                            : role === 'doctor'
                            ? t('emptyDescriptionDoctor')
                            : t('emptyDescriptionPatient')}
                    </p>
                </div>
            )}
            <button type="button" className={cx('view-all')} onClick={handleViewAll}>
                {t('viewAll')}
            </button>
        </div>
    );
};

Notifications.propTypes = {
    onSupportRead: PropTypes.func,
    notifications: PropTypes.array.isRequired,
    loadError: PropTypes.bool,
    role: PropTypes.string.isRequired,
    handleCloseNotifications: PropTypes.func.isRequired,
};

export default Notifications;
