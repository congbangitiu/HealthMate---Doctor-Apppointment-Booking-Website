import { useState } from 'react';
import { PropTypes } from 'prop-types';
import classNames from 'classnames/bind';
import styles from './VerifyOTP.module.scss';
import { LiaSmsSolid } from 'react-icons/lia';
import SyncLoader from 'react-spinners/SyncLoader';
import truncateNumber from '../../utils/truncateNumber';

const cx = classNames.bind(styles);

const VerifyOTP = ({ phone, verifyOTP }) => {
    const [OTP, setOTP] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setOTP(e.target.value);
    };

    const handleVerify = () => {
        setIsLoading(true);
        verifyOTP(OTP);
        setIsLoading(false);
    };

    return (
        <div className={cx('container')}>
            <LiaSmsSolid className={cx('icon')} />
            <h4>
                Please enter the OTP code sent to phone number <b>{truncateNumber(phone)}</b>
            </h4>
            <div>
                <input type="text" value={OTP} onChange={handleChange} />
                <button onClick={handleVerify}>
                    {isLoading ? <SyncLoader size={7} color="#ffffff" /> : 'Verify OTP'}
                </button>
            </div>
        </div>
    );
};

VerifyOTP.propTypes = {
    phone: PropTypes.string.isRequired,
    verifyOTP: PropTypes.func.isRequired,
};

export default VerifyOTP;
