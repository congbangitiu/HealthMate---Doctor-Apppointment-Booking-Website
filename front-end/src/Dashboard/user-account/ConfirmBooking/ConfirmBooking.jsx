import { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './ConfirmBooking.module.scss';
import { BASE_URL, token } from '../../../../config';
import { toast } from 'react-toastify';
import SyncLoader from 'react-spinners/SyncLoader';
import convertTime from '../../../utils/date-time/convertTime';
import formatDate from '../../../utils/date-time/formatDate';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const ConfirmBooking = ({ doctorId, doctorName, doctorPhoto, selectedSlot, ticketPrice, setTimeSlots }) => {
    const { t } = useTranslation('doctorDetails');
    const [loading, setLoading] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

    const bookingHandler = async () => {
        if (!selectedSlot) {
            toast.error(t('confirmBooking.toast.noSlot'));
            return;
        }

        if (!selectedPaymentMethod) {
            toast.error(t('confirmBooking.toast.noPayment'));
            return;
        }

        setLoading(true);

        try {
            const user = JSON.parse(localStorage.getItem('user'));

            if (selectedPaymentMethod === 'Cash') {
                // 💡 If payment method is Cash, create booking directly without Stripe
                const bookingRes = await fetch(`${BASE_URL}/bookings/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        doctorId,
                        userId: user._id,
                        timeSlot: selectedSlot,
                        ticketPrice,
                        paymentMethod: 'cash',
                        isPaid: false,
                    }),
                });

                const bookingData = await bookingRes.json();
                if (!bookingRes.ok) {
                    throw new Error(bookingData.message || t('confirmBooking.toast.createBookingFail'));
                }

                localStorage.setItem('appointmentId', bookingData.booking._id);

                toast.success(t('confirmBooking.toast.bookingSuccess'));
                setTimeSlots((prevSlots) => prevSlots.filter((slot) => slot !== selectedSlot));

                // Redirect to success page immediately
                window.location.href = '/checkout-success';
            } else if (selectedPaymentMethod === 'E-Wallet') {
                // 💡 If payment method is E-Wallet, go to Stripe Checkout
                const appointmentRes = await fetch(`${BASE_URL}/bookings/checkout-session/${doctorId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ timeSlot: selectedSlot, paymentMethod: 'e-wallet' }),
                });

                const appointmentData = await appointmentRes.json();
                if (!appointmentRes.ok) {
                    throw new Error(appointmentData.message || t('confirmBooking.toast.checkoutFail'));
                }

                if (appointmentData.session.url) {
                    // Remove booked time slot from available slots
                    setTimeSlots((prevSlots) => prevSlots.filter((slot) => slot !== selectedSlot));

                    // Redirect to Stripe payment page
                    window.location.href = appointmentData.session.url;
                }
            }

            // Create the chat after a successful booking
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
                throw new Error(chatData.message || t('confirmBooking.toast.chatFail'));
            }

            setLoading(false);
        } catch (error) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    return (
        <div className={cx('container')}>
            <h1>{t('confirmBooking.title')}</h1>
            <div className={cx('appointment')}>
                <img src={doctorPhoto} alt="" />
                {selectedSlot && (
                    <div>
                        <h2>{`${t('confirmBooking.doctorPrefix')} ${doctorName}`}</h2>
                        <p>
                            <b>{t('confirmBooking.date')}: </b>
                            {formatDate(selectedSlot.day)}
                        </p>
                        <p>
                            <b>{t('confirmBooking.time')}: </b>
                            {convertTime(selectedSlot.startingTime)} - {convertTime(selectedSlot.endingTime)}
                        </p>
                    </div>
                )}
            </div>
            <div className={cx('payment-method')}>
                <p>
                    <b>{t('confirmBooking.price')}: </b>${ticketPrice}
                </p>
                <span>
                    <b>{t('confirmBooking.paymentMethod')}: </b>
                    <span>
                        <p onClick={() => setSelectedPaymentMethod('E-Wallet')}>
                            <input
                                type="radio"
                                name="payment"
                                value="E-Wallet"
                                checked={selectedPaymentMethod === 'E-Wallet'}
                                onChange={() => setSelectedPaymentMethod('E-Wallet')}
                            />
                            {t('confirmBooking.eWallet')}
                        </p>
                        <p onClick={() => setSelectedPaymentMethod('Cash')}>
                            <input
                                type="radio"
                                name="payment"
                                value="Cash"
                                checked={selectedPaymentMethod === 'Cash'}
                                onChange={() => setSelectedPaymentMethod('Cash')}
                            />
                            {t('confirmBooking.cash')}
                        </p>
                    </span>
                </span>
            </div>

            <button
                className={cx({ disabled: !selectedPaymentMethod })}
                onClick={bookingHandler}
                disabled={!selectedPaymentMethod}
            >
                {loading ? <SyncLoader size={8} color="#ffffff" /> : t('confirmBooking.confirmButton')}
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
