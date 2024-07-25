import { useState } from 'react';
import { PropTypes } from 'prop-types';
import classNames from 'classnames/bind';
import styles from './VerifyOTP.module.scss';
import { LiaSmsSolid } from 'react-icons/lia';
import { MdOutlineEmail } from 'react-icons/md';
import SyncLoader from 'react-spinners/SyncLoader';
import truncateNumber from '../../utils/truncateNumber';
import OTPInput, { ResendOTP } from 'otp-input-react';

const cx = classNames.bind(styles);

const VerifyOTP = ({ phone, email, verifyOTP, tab }) => {
    const [OTP, setOTP] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const isButtonDisabled = OTP.length !== 6;
    const [hideResendOTP, setHideResendOTP] = useState(true);

    const handleChange = (otp) => {
        setOTP(otp);
    };

    const handleVerify = () => {
        setIsLoading(true);
        setHideResendOTP(false);
        verifyOTP(OTP).finally(() => setIsLoading(false));
    };

    const renderButton = (buttonProps) => {
        return <button {...buttonProps}>Resend</button>;
    };

    const renderTime = (time) => {
        return <span>{time} seconds remaining</span>;
    };

    return (
        <div className={cx('container')}>
            {tab === 'email' ? (
                <>
                    <MdOutlineEmail className={cx('icon')} />
                    <h4>
                        Please check email <b>{email}</b> (including spam) and click the link to verify the account
                    </h4>
                </>
            ) : (
                <>
                    <LiaSmsSolid className={cx('icon')} />
                    <h4>
                        Please enter the OTP code sent to phone number <b>{truncateNumber(phone)}</b>
                    </h4>
                </>
            )}
            {tab === 'SMS' && (
                <OTPInput
                    value={OTP}
                    onChange={handleChange}
                    autoFocus
                    OTPLength={6}
                    otpType="number"
                    disabled={false}
                    secure
                    className={cx('otp-input')}
                />
            )}
            {tab === 'SMS' &&
                (hideResendOTP ? (
                    <button
                        onClick={handleVerify}
                        disabled={isButtonDisabled}
                        className={cx({ disabled: isButtonDisabled })}
                    >
                        {isLoading ? <SyncLoader size={7} color="#ffffff" /> : 'Verify OTP'}
                    </button>
                ) : (
                    <ResendOTP renderTime={renderTime} renderButton={renderButton} className={cx('resend-otp')} />
                ))}
        </div>
    );
};

VerifyOTP.propTypes = {
    phone: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    verifyOTP: PropTypes.func.isRequired,
    tab: PropTypes.string.isRequired,
};

export default VerifyOTP;
