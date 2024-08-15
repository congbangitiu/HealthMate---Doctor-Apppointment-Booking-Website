import { useState } from 'react';
import { PropTypes } from 'prop-types';
import classNames from 'classnames/bind';
import styles from './VerifyOTP.module.scss';
import { LiaSmsSolid } from 'react-icons/lia';
import { MdOutlineEmail } from 'react-icons/md';
import SyncLoader from 'react-spinners/SyncLoader';
import truncateNumber from '../../utils/truncateNumber';
import OTPInput from 'otp-input-react';
import { toast } from 'react-toastify';
import { BASE_URL } from '../../../config';

const cx = classNames.bind(styles);

const VerifyOTP = ({ formData, tab }) => {
    const [OTP, setOTP] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const isButtonDisabled = OTP.length !== 6;
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const handleChange = (otp) => {
        setOTP(otp);
    };

    const handleVerify = async () => {
        setIsLoading(true);

        try {
            const response = await fetch(`${BASE_URL}/auth/register-verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    otp: OTP,
                    fullname: formData.fullname,
                    username: formData.username,
                    phone: formData.phone,
                    password: formData.password,
                    confirmedPassword: formData.confirmedPassword,
                    role: formData.role,
                    photo: formData.photo,
                    gender: formData.gender,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            toast.success('Account created successfully!');
            await delay(2000);
            window.location.href = '/login';
        } catch (error) {
            toast.error(`Verification failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cx('container')}>
            {tab === 'email' ? (
                <>
                    <MdOutlineEmail className={cx('icon')} />
                    <h4>
                        Please check email <b>{formData.email}</b> <br />
                        (including spam) <br />
                    </h4>
                </>
            ) : (
                <>
                    <LiaSmsSolid className={cx('icon')} />
                    <h4>
                        Please enter the OTP code sent to phone number <b>{truncateNumber(formData.phone)}</b>
                    </h4>
                </>
            )}
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
    formData: PropTypes.object.isRequired,
    tab: PropTypes.string.isRequired,
};

export default VerifyOTP;
