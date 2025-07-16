import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './ConfirmCancel.module.scss';
import { FaCircleExclamation } from 'react-icons/fa6';
import PropTypes from 'prop-types';
import formatDate from '../../../utils/date-time/formatDate';
import convertTime from '../../../utils/date-time/convertTime';
import { BASE_URL, token } from '../../../../config';
import { toast } from 'react-toastify';
import SyncLoader from 'react-spinners/SyncLoader';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const ConfirmCancel = ({ setShowConfirmCancel, appointment }) => {
    const { t } = useTranslation('myBookings');

    const [loading, setLoading] = useState(false);
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const handleConfirmCancel = async () => {
        setLoading(true);
        try {
            const resUpdateBooking = await fetch(`${BASE_URL}/bookings/${appointment._id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: 'cancelled' }),
            });

            const updateBookingData = await resUpdateBooking.json();
            if (!resUpdateBooking.ok) {
                throw new Error(updateBookingData.message || 'Error updating booking status');
            }

            toast.success(t('confirmCancel.success'));
            setLoading(false);
            await delay(2000);
            window.location.reload();
        } catch (error) {
            toast.error(error.message || t('confirmCancel.error'));
            setLoading(false);
        }
    };

    const appointmentDate = appointment?.timeSlot?.day ? formatDate(appointment.timeSlot.day) : t('confirmCancel.date');
    const startTime = appointment?.timeSlot?.startingTime
        ? convertTime(appointment.timeSlot.startingTime)
        : t('confirmCancel.time');
    const endTime = appointment?.timeSlot?.endingTime
        ? convertTime(appointment.timeSlot.endingTime)
        : t('confirmCancel.time');

    return (
        <div className={cx('container')}>
            <FaCircleExclamation className={cx('icon')} />
            <h1>{t('confirmCancel.title')}</h1>
            <div className={cx('appointment')}>
                <img src={appointment?.doctor?.photo} alt="" />
                <div>
                    <h1>
                        {t('prefix')} {appointment?.doctor?.fullname}
                    </h1>
                    <p>
                        <b>{t('confirmCancel.date')}: </b> {appointmentDate}
                    </p>
                    <p>
                        <b>{t('confirmCancel.time')}: </b> {startTime} - {endTime}
                    </p>
                </div>
            </div>
            <div className={cx('buttons')}>
                <button onClick={() => setShowConfirmCancel(false)}>{t('confirmCancel.quit')}</button>
                <button onClick={handleConfirmCancel}>
                    {loading ? <SyncLoader size={7} color="#ffffff" /> : t('confirmCancel.confirm')}
                </button>
            </div>
        </div>
    );
};

ConfirmCancel.propTypes = {
    setShowConfirmCancel: PropTypes.func.isRequired,
    appointment: PropTypes.object.isRequired,
};

export default ConfirmCancel;
