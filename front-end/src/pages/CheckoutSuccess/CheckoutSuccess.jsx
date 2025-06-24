import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './CheckoutSuccess.module.scss';
import { MdDone } from 'react-icons/md';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { BASE_URL, token } from '../../../config';
import convertTime from '../../utils/date-time/convertTime';
import formatDate from '../../utils/date-time/formatDate';
import { useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const CheckoutSuccess = () => {
    const { t } = useTranslation('checkoutSuccess');
    const isMobile = useMediaQuery('(max-width:768px)');
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    // Get the session_id from the URL
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const sessionId = queryParams.get('session_id');

    const fetchAppointment = async () => {
        try {
            let appointmentId = localStorage.getItem('appointmentId');

            // Check if appointment data has sessionId (transfer form)
            if (sessionId) {
                const response = await fetch(`${BASE_URL}/bookings/appointment/${sessionId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error('Failed to fetch appointment details');

                const data = await response.json();
                setAppointment(data.appointment);
                return;
            } else if (appointmentId) {
                // Cash payment
                const response = await fetch(`${BASE_URL}/bookings/${appointmentId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error('Failed to fetch appointment details');

                const data = await response.json();
                setAppointment(data.appointment);
                return;
            }

            throw new Error('No appointmentId or sessionId found');
        } catch (error) {
            console.error('Error fetching appointment:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointment();
    }, [sessionId]);

    useEffect(() => {
        // Shoot from the left towards the center
        confetti({
            particleCount: 200,
            angle: 60,
            spread: 100,
            origin: { x: 0.2, y: 0.8 }, // The point starts at 20% of the width and 80% of the height
        });

        // Shoot from the right towards the center
        confetti({
            particleCount: 200,
            angle: 120,
            spread: 100,
            origin: { x: 0.8, y: 0.8 }, // The point starts at 20% of the width and 80% of the height
        });
    }, []);

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);

    return (
        <div className={cx('container')}>
            <div className={cx('left-part')}>
                <h1>{t('title')}</h1>
                <p>{t('description1')}</p>
                <p>
                    <b>{t('description2')}</b>
                </p>
                <p>
                    <b>{t('description3')}</b>
                </p>

                {isMobile && (
                    <div className={cx('lower-part')}>
                        <h2>{t('appointmentDetails')}</h2>
                        <div className={cx('appointment-details')}>
                            <span>
                                <p>{t('doctor')}</p>
                                <p>{appointment?.doctor?.fullname || 'N/A'}</p>
                            </span>
                            <span>
                                <p>{t('date')}</p>
                                <p>{formatDate(appointment?.timeSlot?.day) || 'N/A'}</p>
                            </span>
                            <span>
                                <p>{t('time')}</p>
                                <p>
                                    {appointment?.timeSlot?.startingTime
                                        ? convertTime(appointment.timeSlot.startingTime)
                                        : 'N/A'}{' '}
                                    -{' '}
                                    {appointment?.timeSlot?.endingTime
                                        ? convertTime(appointment.timeSlot.endingTime)
                                        : 'N/A'}
                                </p>
                            </span>

                            <span>
                                <p>{t('price')}</p>
                                <p>${appointment?.ticketPrice || 'N/A'}</p>
                            </span>
                            <span>
                                <p>{t('paymentMethod')}</p>
                                <p>{appointment?.paymentMethod.toUpperCase() || 'N/A'}</p>
                            </span>
                            <span>
                                <p>{t('paymentStatus')}</p>
                                <p>{appointment?.isPaid ? t('paid') : t('unpaid')}</p>
                            </span>
                        </div>
                    </div>
                )}
                <div className={cx('navigation-buttons')}>
                    <Link to="/users/profile/me" className={cx('button-1')}>
                        {t('viewAppointments')}
                    </Link>
                    <Link to="/home" className={cx('button-2')}>
                        {t('goHome')}
                    </Link>
                </div>
            </div>
            {!isMobile && (
                <div className={cx('right-part')}>
                    <div className={cx('upper-part')}>
                        <div>
                            {loading ? t('loading') : <h2>${appointment?.ticketPrice}</h2>}
                            <p>{t('paymentSuccess')}</p>
                        </div>
                        <div className={cx('icon-wrapper')}>
                            <MdDone className={cx('icon')} />
                        </div>
                    </div>
                    <div className={cx('lower-part')}>
                        <h2>{t('appointmentDetails')}</h2>
                        <div className={cx('appointment-details')}>
                            <span>
                                <p>{t('doctor')}</p>
                                <p>{appointment?.doctor?.fullname || 'N/A'}</p>
                            </span>
                            <span>
                                <p>{t('date')}</p>
                                <p>{formatDate(appointment?.timeSlot?.day) || 'N/A'}</p>
                            </span>
                            <span>
                                <p>{t('time')}</p>
                                <p>
                                    {appointment?.timeSlot?.startingTime
                                        ? convertTime(appointment.timeSlot.startingTime)
                                        : 'N/A'}{' '}
                                    -{' '}
                                    {appointment?.timeSlot?.endingTime
                                        ? convertTime(appointment.timeSlot.endingTime)
                                        : 'N/A'}
                                </p>
                            </span>

                            <span>
                                <p>{t('price')}</p>
                                <p>${appointment?.ticketPrice || 'N/A'}</p>
                            </span>
                            <span>
                                <p>{t('paymentMethod')}</p>
                                <p>{appointment?.paymentMethod.toUpperCase() || 'N/A'}</p>
                            </span>
                            <span>
                                <p>{t('paymentStatus')}</p>
                                <p>{appointment?.isPaid ? t('paid') : t('unpaid')}</p>
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckoutSuccess;
