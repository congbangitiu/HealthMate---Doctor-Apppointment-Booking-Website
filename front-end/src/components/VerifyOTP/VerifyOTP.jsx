import { useState, useEffect } from 'react';
import { PropTypes } from 'prop-types';
import classNames from 'classnames/bind';
import styles from './VerifyOTP.module.scss';
import { LiaSmsSolid } from 'react-icons/lia';
import { MdOutlineEmail } from 'react-icons/md';
import SyncLoader from 'react-spinners/SyncLoader';
import truncateNumber from '../../utils/number/truncateNumber';
import OTPInput from 'otp-input-react';
import { toast } from 'react-toastify';
import { BASE_URL } from '../../../config';
import parseJsonResponse from '../../utils/services/parseJsonResponse';

const cx = classNames.bind(styles);

const VerifyOTP = ({
    formData,
    tab,
    endpoint = '/auth/register-verify-otp',
    buildPayload,
    onVerified,
    onResend,
    resendCooldown = 60,
    initialCooldown,
    heading,
    verifyLabel = 'Verify OTP',
    resendLabel = 'Resend OTP',
    resendCountdownLabel = (seconds) => `Resend OTP in ${seconds}s`,
}) => {
    const [OTP, setOTP] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    // OTP vừa được gửi trước khi component mount nên bắt đầu đếm ngược ngay
    const [secondsLeft, setSecondsLeft] = useState(onResend ? (initialCooldown ?? resendCooldown) : 0);
    const isButtonDisabled = OTP.length !== 6;
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    useEffect(() => {
        if (secondsLeft <= 0) return;

        const timer = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [secondsLeft]);

    const handleChange = (otp) => {
        setOTP(otp);
    };

    const handleVerify = async () => {
        setIsLoading(true);

        try {
            const payload = buildPayload
                ? buildPayload(OTP)
                : {
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
                  };

            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await parseJsonResponse(response);

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Verification failed');
            }

            if (onVerified) {
                onVerified(data);
            } else {
                toast.success('Account created successfully!');
                await delay(2000);
                window.location.href = '/login';
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);

        try {
            const result = await onResend();
            setOTP('');
            const cooldown = Number.isFinite(result?.retryAfter) && result.retryAfter >= 0
                ? Math.ceil(result.retryAfter) : resendCooldown;
            setSecondsLeft(cooldown);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className={cx('container')}>
            {tab === 'email' ? (
                <>
                    <MdOutlineEmail className={cx('icon')} />
                    <h4>
                        {heading || (
                            <>
                                Please check email <b>{formData.email}</b> <br />
                                (including spam) <br />
                            </>
                        )}
                    </h4>
                </>
            ) : (
                <>
                    <LiaSmsSolid className={cx('icon')} />
                    <h4>
                        {heading || (
                            <>
                                Please enter the OTP code sent to phone number <b>{truncateNumber(formData.phone)}</b>
                            </>
                        )}
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
                {isLoading ? <SyncLoader size={7} color="#ffffff" /> : verifyLabel}
            </button>

            {onResend && (
                <div className={cx('resend-otp')}>
                    {secondsLeft > 0 ? (
                        <span>{resendCountdownLabel(secondsLeft)}</span>
                    ) : (
                        <button onClick={handleResend} disabled={isResending}>
                            {isResending ? <SyncLoader size={7} color="#ffffff" /> : resendLabel}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

VerifyOTP.propTypes = {
    formData: PropTypes.object.isRequired,
    tab: PropTypes.string.isRequired,
    endpoint: PropTypes.string,
    buildPayload: PropTypes.func,
    onVerified: PropTypes.func,
    onResend: PropTypes.func,
    resendCooldown: PropTypes.number,
    initialCooldown: PropTypes.number,
    heading: PropTypes.node,
    verifyLabel: PropTypes.string,
    resendLabel: PropTypes.string,
    resendCountdownLabel: PropTypes.func,
};

export default VerifyOTP;
