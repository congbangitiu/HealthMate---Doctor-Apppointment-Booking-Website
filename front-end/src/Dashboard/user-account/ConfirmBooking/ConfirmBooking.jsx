import { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './ConfirmBooking.module.scss';
import { BASE_URL, token } from '../../../../config';
import { toast } from 'react-toastify';
import SyncLoader from 'react-spinners/SyncLoader';
import convertTime from '../../../utils/convertTime';
import formatDate from '../../../utils/formatDate';

const cx = classNames.bind(styles);

const ConfirmBooking = ({ doctorId, doctorName, doctorPhoto, selectedSlot, ticketPrice, setTimeSlots }) => {
    const [loading, setLoading] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

    const bookingHandler = async () => {
        if (!selectedSlot) {
            toast.error('Please select a time slot');
            return;
        }

        setLoading(true);

        try {
            const appointmentRes = await fetch(`${BASE_URL}/bookings/checkout-session/${doctorId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ timeSlot: selectedSlot }),
            });

            const appointmentData = await appointmentRes.json();
            if (!appointmentRes.ok) {
                throw new Error(appointmentData.message + '! Please try again !!!');
            }

            if (appointmentData.session.url) {
                // Remove the booked time slot from the available time slots
                setTimeSlots((prevSlots) => prevSlots.filter((slot) => slot !== selectedSlot));
                window.location.href = appointmentData.session.url;
            }

            // Create the chat after a successful booking
            const user = JSON.parse(localStorage.getItem('user'));

            const chatRes = await fetch(`${BASE_URL}/chats/create-chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ doctorId, userId: user._id }),
            });

            const chatData = await chatRes.json();
            if (!chatRes.ok) {
                throw new Error(chatData.message || 'Failed to create chat. Please try again.');
            }

            setLoading(false);
        } catch (error) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    return (
        <div className={cx('container')}>
            <h1>BOOKING CONFIRMATION</h1>
            <div className={cx('appointment')}>
                <img src={doctorPhoto} alt="" />
                {selectedSlot && (
                    <div>
                        <h2>Dr. {doctorName}</h2>
                        <p>
                            <b>Date: </b>
                            {formatDate(selectedSlot.day)}
                        </p>
                        <p>
                            <b>Time: </b>
                            {convertTime(selectedSlot.startingTime)} - {convertTime(selectedSlot.endingTime)}
                        </p>
                    </div>
                )}
            </div>
            <div className={cx('payment-method')}>
                <p>
                    <b>Price: </b>${ticketPrice}
                </p>
                <span>
                    <b>Payment method: </b>
                    <p>
                        <input
                            type="radio"
                            name="payment"
                            value="E-Wallet"
                            checked={selectedPaymentMethod === 'E-Wallet'}
                            onChange={() => setSelectedPaymentMethod('E-Wallet')}
                        />
                        E-Wallet
                    </p>
                    <p>
                        <input
                            type="radio"
                            name="payment"
                            value="Cash"
                            checked={selectedPaymentMethod === 'Cash'}
                            onChange={() => setSelectedPaymentMethod('Cash')}
                        />
                        Cash
                    </p>
                </span>
            </div>

            <button
                className={cx({ disabled: !selectedPaymentMethod })}
                onClick={bookingHandler}
                disabled={!selectedPaymentMethod}
            >
                {loading ? <SyncLoader size={8} color="#ffffff" /> : 'Confirm'}
            </button>
        </div>
    );
};

ConfirmBooking.propTypes = {
    doctorId: PropTypes.string.isRequired,
    doctorName: PropTypes.string.isRequired,
    doctorPhoto: PropTypes.string.isRequired,
    selectedSlot: PropTypes.object.isRequired,
    ticketPrice: PropTypes.number.isRequired,
    setTimeSlots: PropTypes.func.isRequired,
};

export default ConfirmBooking;
