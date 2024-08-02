import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './ConfirmCancel.module.scss';
import { FaCircleExclamation } from 'react-icons/fa6';
import PropTypes from 'prop-types';
import formatDate from '../../../utils/formatDate';
import convertTime from '../../../utils/convertTime';
import { token } from '../../../../config';
import { BASE_URL } from '../../../../config';
import { toast } from 'react-toastify';
import SyncLoader from 'react-spinners/SyncLoader';

const cx = classNames.bind(styles);

const ConfirmCancel = ({ setShowConfirmCancel, appointment }) => {
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
                body: JSON.stringify({
                    status: 'cancelled',
                }),
            });

            const updateBookingData = await resUpdateBooking.json();
            if (!resUpdateBooking.ok) {
                throw new Error(updateBookingData.message || 'Error updating booking status');
            }

            toast.success('Appointment cancelled successfully!');
            setLoading(false);
            await delay(2000);
            window.location.reload();
        } catch (error) {
            toast.error(error.message || 'An error occurred');
            setLoading(false);
        }
    };

    return (
        <div className={cx('container')}>
            <FaCircleExclamation className={cx('icon')} />
            <h1>Are you sure you want to cancel this appointment?</h1>
            <div className={cx('appointment')}>
                <img src={appointment?.doctor?.photo} alt="" />
                <div>
                    <h1>Dr. {appointment?.doctor?.fullname}</h1>
                    <p>
                        <b>Date: </b>
                        {formatDate(appointment?.timeSlot?.day)}
                    </p>
                    <p>
                        <b>Time: </b>
                        {convertTime(appointment?.timeSlot?.startingTime)} -{' '}
                        {convertTime(appointment?.timeSlot?.endingTime)}
                    </p>
                </div>
            </div>
            <div className={cx('buttons')}>
                <button onClick={() => setShowConfirmCancel(false)}>Quit</button>
                <button onClick={handleConfirmCancel}>
                    {loading ? <SyncLoader size={7} color="#ffffff" /> : 'Confirm'}
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
