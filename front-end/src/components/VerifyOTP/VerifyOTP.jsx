import { useState } from 'react';
import { PropTypes } from 'prop-types';
import classNames from 'classnames/bind';
import styles from './VerifyOTP.module.scss';
import { LiaSmsSolid } from 'react-icons/lia';
import SyncLoader from 'react-spinners/SyncLoader';
import truncateNumber from '../../utils/truncateNumber';
import OTPInput from 'otp-input-react';

const cx = classNames.bind(styles);

const VerifyOTP = ({ phone, verifyOTP }) => {
    const [OTP, setOTP] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const isButtonDisabled = OTP.length !== 6;

    const handleChange = (otp) => {
        setOTP(otp);
    };

    const handleVerify = () => {
        setIsLoading(true);
        verifyOTP(OTP).finally(() => setIsLoading(false));
    };

    return (
        <div className={cx('container')}>
            <LiaSmsSolid className={cx('icon')} />
            <h4>
                Please enter the OTP code sent to phone number <b>{truncateNumber(phone)}</b>
            </h4>
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
            <button onClick={handleVerify} disabled={isButtonDisabled} className={cx({ disabled: isButtonDisabled })}>
                {isLoading ? <SyncLoader size={7} color="#ffffff" /> : 'Verify OTP'}
            </button>
        </div>
    );
};

VerifyOTP.propTypes = {
    phone: PropTypes.string.isRequired,
    verifyOTP: PropTypes.func.isRequired,
};

export default VerifyOTP;
