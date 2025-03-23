import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './CheckoutSuccess.module.scss';
import { MdDone } from 'react-icons/md';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { BASE_URL, token } from '../../../config';
import convertTime from '../../utils/convertTime';
import formatDate from '../../utils/formatDate';
import { useMediaQuery } from '@mui/material';

const cx = classNames.bind(styles);

const CheckoutSuccess = () => {
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
                <h1>Booking confirmed successfully!</h1>
                <p>Thank you for choosing HealthMate. Your reservation is confirmed. We’re excited to see you soon!</p>
                <p>
                    <b>📩 Please check your email</b> for the booking details, including the appointment time, doctor’s
                    information, and payment confirmation.
                </p>
                <p>
                    <b>🔔 Reminder:</b> Kindly arrive on time for your appointment to ensure a smooth experience.
                </p>

                {isMobile && (
                    <div className={cx('lower-part')}>
                        <h2>Appointment details</h2>
                        <div className={cx('appointment-details')}>
                            <span>
                                <p>Doctor</p>
                                <p>{appointment?.doctor?.fullname || 'N/A'}</p>
                            </span>
                            <span>
                                <p>Date</p>
                                <p>{formatDate(appointment?.timeSlot?.day) || 'N/A'}</p>
                            </span>
                            <span>
                                <p>Time</p>
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
                                <p>Price</p>
                                <p>${appointment?.ticketPrice || 'N/A'}</p>
                            </span>
                            <span>
                                <p>Payment Method</p>
                                <p>{appointment?.paymentMethod.toUpperCase() || 'N/A'}</p>
                            </span>
                            <span>
                                <p>Payment Status</p>
                                <p>{appointment?.isPaid ? 'Paid' : 'Unpaid'}</p>
                            </span>
                        </div>
                    </div>
                )}
                <div className={cx('navigation-buttons')}>
                    <Link to="/users/profile/me" className={cx('button-1')}>
                        View all appointments
                    </Link>
                    <Link to="/home" className={cx('button-2')}>
                        Go back to home
                    </Link>
                </div>
            </div>
            {!isMobile && (
                <div className={cx('right-part')}>
                    <div className={cx('upper-part')}>
                        <div>
                            {loading ? <p>Loading...</p> : <h2>${appointment?.ticketPrice}</h2>}
                            <p>Payment success!</p>
                        </div>
                        <div className={cx('icon-wrapper')}>
                            <MdDone className={cx('icon')} />
                        </div>
                    </div>
                    <div className={cx('lower-part')}>
                        <h2>Appointment details</h2>
                        <div className={cx('appointment-details')}>
                            <span>
                                <p>Doctor</p>
                                <p>{appointment?.doctor?.fullname || 'N/A'}</p>
                            </span>
                            <span>
                                <p>Date</p>
                                <p>{formatDate(appointment?.timeSlot?.day) || 'N/A'}</p>
                            </span>
                            <span>
                                <p>Time</p>
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
                                <p>Price</p>
                                <p>${appointment?.ticketPrice || 'N/A'}</p>
                            </span>
                            <span>
                                <p>Payment Method</p>
                                <p>{appointment?.paymentMethod.toUpperCase() || 'N/A'}</p>
                            </span>
                            <span>
                                <p>Payment Status</p>
                                <p>{appointment?.isPaid ? 'Paid' : 'Unpaid'}</p>
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckoutSuccess;
