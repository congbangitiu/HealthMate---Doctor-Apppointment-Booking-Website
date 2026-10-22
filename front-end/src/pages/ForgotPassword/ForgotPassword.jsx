import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ForgotPassword.module.scss';
import { MdOutlineEmail } from 'react-icons/md';
import { RiLockPasswordLine } from 'react-icons/ri';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { BASE_URL } from '../../../config';
import SyncLoader from 'react-spinners/SyncLoader';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import VerifyOTP from '../../components/VerifyOTP/VerifyOTP.jsx';
import parseJsonResponse from '../../utils/services/parseJsonResponse.js';

const cx = classNames.bind(styles);

const STEPS = ['email', 'otp', 'reset'];
const RESEND_COOLDOWN = 60;

const ForgotPassword = () => {
    const { t } = useTranslation('forgotPassword');
    const location = useLocation();

    const [step, setStep] = useState('email');
    // Điền sẵn email người dùng đã nhập ở trang Login (truyền qua state của Link)
    const [email, setEmail] = useState(location.state?.email || '');
    const [resetToken, setResetToken] = useState('');
    const [loading, setLoading] = useState(false);
    // Khi quay lại trang trong thời gian chờ gửi lại, server trả về số giây còn lại
    const [initialCooldown, setInitialCooldown] = useState(RESEND_COOLDOWN);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmedPassword, setShowConfirmedPassword] = useState(false);
    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmedPassword: '',
    });

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);

    const handlePasswordChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const sendOTP = async () => {
        const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        const data = await parseJsonResponse(res);

        if (!res.ok) {
            // 429: OTP trước đó vẫn còn hiệu lực nên cho đi tiếp thay vì chặn người dùng
            if (res.status === 429) {
                const cooldown = Number.isFinite(data.retryAfter) && data.retryAfter >= 0
                    ? Math.ceil(data.retryAfter) : RESEND_COOLDOWN;
                setInitialCooldown(cooldown);
                toast.info(data.message);
                setStep('otp');
                return { retryAfter: cooldown };
            }
            throw new Error(data.message || 'Failed to send OTP');
        }

        setInitialCooldown(RESEND_COOLDOWN);
        toast.success(data.message);
        setStep('otp');
        return { retryAfter: RESEND_COOLDOWN };
    };

    const submitEmailHandler = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await sendOTP();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOtpVerified = (data) => {
        if (typeof data?.resetToken !== 'string' || !data.resetToken.trim()) {
            throw new Error(t('invalidVerification'));
        }
        setResetToken(data.resetToken);
        setStep('reset');
        toast.success(t('otpVerified'));
    };

    const submitResetHandler = async (e) => {
        e.preventDefault();

        if (passwords.newPassword !== passwords.confirmedPassword) {
            toast.error(t('mismatch'));
            return;
        }

        if (
            passwords.newPassword.length < 8 ||
            !/[a-zA-Z]/.test(passwords.newPassword) ||
            !/[0-9]/.test(passwords.newPassword)
        ) {
            toast.error(t('weakPassword'));
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${BASE_URL}/auth/forgot-password/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ resetToken, ...passwords }),
            });

            const data = await parseJsonResponse(res);

            if (!res.ok) {
                throw new Error(data.message || 'Failed to reset password');
            }

            toast.success(data.message);
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        } catch (error) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    return (
        <div className={cx('container')}>
            <div className={cx('inner')}>
                <div className={cx('intro')}>
                    <h3>{t('title')}</h3>
                    <p>{t(`subtitle.${step}`)}</p>
                </div>

                <div className={cx('stepper')}>
                    {STEPS.map((name, index) => (
                        <div
                            key={name}
                            className={cx('step', {
                                active: name === step,
                                done: STEPS.indexOf(step) > index,
                            })}
                        >
                            <span className={cx('bullet')}>{index + 1}</span>
                            <p>{t(`stepLabels.${name}`)}</p>
                        </div>
                    ))}
                </div>

                {step === 'email' && (
                    <form onSubmit={submitEmailHandler}>
                        <div className={cx('authentication')}>
                            <p>{t('emailLabel')}</p>
                            <div className={cx('info')}>
                                <input
                                    type="email"
                                    placeholder={t('emailPlaceholder')}
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <MdOutlineEmail className={cx('icon')} />
                            </div>
                        </div>

                        <button disabled={loading} className={cx('submit-btn')}>
                            {loading ? <SyncLoader size={8} color="#ffffff" /> : t('sendOtp')}
                        </button>
                    </form>
                )}

                {step === 'otp' && (
                    <div className={cx('otp-wrapper')}>
                        <VerifyOTP
                            formData={{ email }}
                            tab="email"
                            endpoint="/auth/forgot-password/verify"
                            buildPayload={(otp) => ({ email, otp })}
                            onVerified={handleOtpVerified}
                            onResend={sendOTP}
                            resendCooldown={RESEND_COOLDOWN}
                            initialCooldown={initialCooldown}
                            verifyLabel={t('verify')}
                            resendLabel={t('resend')}
                            resendCountdownLabel={(seconds) => t('resendIn', { seconds })}
                            heading={
                                <>
                                    {t('otpHeading')} <b>{email}</b> <br />
                                    {t('otpSpamNote')}
                                </>
                            }
                        />
                    </div>
                )}

                {step === 'reset' && (
                    <form onSubmit={submitResetHandler}>
                        <div className={cx('authentication')}>
                            <p>{t('newPassword')}</p>
                            <div className={cx('info')}>
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    placeholder={t('newPasswordPlaceholder')}
                                    name="newPassword"
                                    value={passwords.newPassword}
                                    onChange={handlePasswordChange}
                                    required
                                />
                                {passwords.newPassword === '' ? (
                                    <RiLockPasswordLine className={cx('icon')} />
                                ) : showNewPassword ? (
                                    <FaEyeSlash
                                        className={cx('icon', 'eye')}
                                        onClick={() => setShowNewPassword(false)}
                                    />
                                ) : (
                                    <FaEye className={cx('icon', 'eye')} onClick={() => setShowNewPassword(true)} />
                                )}
                            </div>
                            <span className={cx('hint')}>{t('passwordHint')}</span>
                        </div>

                        <div className={cx('authentication')}>
                            <p>{t('confirmPassword')}</p>
                            <div className={cx('info')}>
                                <input
                                    type={showConfirmedPassword ? 'text' : 'password'}
                                    placeholder={t('confirmPasswordPlaceholder')}
                                    name="confirmedPassword"
                                    value={passwords.confirmedPassword}
                                    onChange={handlePasswordChange}
                                    required
                                />
                                {passwords.confirmedPassword === '' ? (
                                    <RiLockPasswordLine className={cx('icon')} />
                                ) : showConfirmedPassword ? (
                                    <FaEyeSlash
                                        className={cx('icon', 'eye')}
                                        onClick={() => setShowConfirmedPassword(false)}
                                    />
                                ) : (
                                    <FaEye
                                        className={cx('icon', 'eye')}
                                        onClick={() => setShowConfirmedPassword(true)}
                                    />
                                )}
                            </div>
                        </div>

                        <button disabled={loading} className={cx('submit-btn')}>
                            {loading ? <SyncLoader size={8} color="#ffffff" /> : t('submit')}
                        </button>
                    </form>
                )}

                <div className={cx('back-to-login')}>
                    <p>{t('rememberPassword')}</p>
                    <Link to="/login" state={{ email }} className={cx('to-sign-in-page')}>
                        {t('backToLogin')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
