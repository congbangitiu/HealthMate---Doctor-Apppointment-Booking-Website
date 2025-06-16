import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { uploadImageToCloudinary } from '../../utils/services/uploadCloudinary.js';
import { BASE_URL } from '../../../config';
import classNames from 'classnames/bind';
import styles from './Register.module.scss';
import { MdOutlineEmail } from 'react-icons/md';
import { RiLockPasswordLine } from 'react-icons/ri';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook, FaEye, FaEyeSlash } from 'react-icons/fa';
import { FaRegUser } from 'react-icons/fa6';
import { CiMobile3 } from 'react-icons/ci';
import { toast } from 'react-toastify';
import SyncLoader from 'react-spinners/SyncLoader';
import VerifyOTP from '../../components/VerifyOTP/VerifyOTP.jsx';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../../utils/services/firebase';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const Register = () => {
    const { t } = useTranslation('register');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmedPassword, setShowConfirmedPassword] = useState(false);
    const [passwordEmpty, setPasswordEmpty] = useState(true);
    const [confirmedPasswordEmpty, setConfirmedPasswordEmpty] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [isUploadingImg, setIsUploadingImg] = useState(false);
    const [formData, setFormData] = useState({
        fullname: '',
        username: '',
        phone: '',
        email: '',
        password: '',
        confirmedPassword: '',
        photo: selectedFile,
        gender: 'male',
        role: 'patient',
    });

    const [showVerifyOTP, setShowVerifyOTP] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [tab, setTab] = useState('');

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });

        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
                callback: (response) => {
                    console.log('ReCaptcha response: ', response);
                },
                'expired-callback': () => {
                    toast.error('reCAPTCHA expired. Please try again.');
                },
            });

            window.recaptchaVerifier.render().then((widgetId) => {
                window.recaptchaWidgetId = widgetId;
            });
        }
    }, []);

    const handleShowPassword = () => {
        setShowPassword((prevShowPassword) => !prevShowPassword);
    };
    const handleShowConfirmedPassword = () => {
        setShowConfirmedPassword((prevShowConfirmedPassword) => !prevShowConfirmedPassword);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        if (e.target.value === '' && showPassword === true) {
            setShowPassword(false);
        }
        setPasswordEmpty(e.target.value === '');
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleConfirmedPasswordChange = (e) => {
        if (e.target.value === '' && showConfirmedPassword === true) {
            setShowConfirmedPassword(false);
        }
        setConfirmedPasswordEmpty(e.target.value === '');
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileInputChange = async (e) => {
        setIsUploadingImg(true);
        const file = e.target.files[0];
        const data = await uploadImageToCloudinary(file);

        setPreviewUrl(data.url);
        setSelectedFile(data.url);
        setFormData({ ...formData, photo: data.url });
        setIsUploadingImg(false);
    };

    // Send SMS by Twilio (but not work due to country)

    // const sendOTPBySMS = async () => {
    //     setLoading(true);

    //     const phoneNumber = formData.phone.startsWith('+') ? formData.phone : `+84${formData.phone.replace(/^0/, '')}`;

    //     try {
    //         const res = await fetch(`${BASE_URL}/auth/send-sms-otp`, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({ phoneNumber }),
    //         });

    //         const data = await res.json();

    //         if (!res.ok) {
    //             throw new Error(data.error || 'Failed to send OTP');
    //         }

    //         toast.success('OTP sent successfully to your phone!');
    //         setShowVerifyOTP(true);
    //     } catch (error) {
    //         toast.error(error.message || 'Failed to send OTP. Please try again.');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const sendOTPBySMS = async () => {
        const phoneNumber = formData.phone.startsWith('+') ? formData.phone : `+84${formData.phone.replace(/^0/, '')}`;

        try {
            const appVerifier = window.recaptchaVerifier;
            const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            setConfirmationResult(confirmationResult);
            setShowVerifyOTP(true);
        } catch (error) {
            console.log('Error during send OTP:', error);
            toast.error('Failed to send OTP. Please try again.');
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.reset(window.recaptchaWidgetId);
            }
        }
    };

    const sendOTPByEmail = async () => {
        setLoading(true);

        try {
            const res = await fetch(`${BASE_URL}/auth/send-email-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fullname: formData.fullname, email: formData.email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send OTP');
            }

            toast.success('OTP sent successfully to your email!');
            setShowVerifyOTP(true);
        } catch (error) {
            toast.error(error.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const submitHandler = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmedPassword) {
            toast.error('Passwords do not match. Please try again.');
            return;
        }

        try {
            if (tab === 'email') {
                await sendOTPByEmail();
            } else {
                await sendOTPBySMS();
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <div className={cx('container')}>
            <div className={cx('inner')}>
                <div className={cx('intro')}>
                    <h3>{t('title')}</h3>
                    <p>{t('subtitle')}</p>
                </div>

                <form action="" onSubmit={submitHandler}>
                    <div className={cx('fields')}>
                        <div className={cx('authentication')}>
                            <p>{t('fields.fullname')}</p>
                            <div className={cx('info')}>
                                <input
                                    type="text"
                                    placeholder={t('fields.enterFullname')}
                                    name="fullname"
                                    value={formData.fullname}
                                    onChange={handleInputChange}
                                    required
                                />
                                <FaRegUser className={cx('icon')} />
                            </div>
                        </div>
                        <div className={cx('authentication')}>
                            <p>{t('fields.username')}</p>
                            <div className={cx('info')}>
                                <input
                                    type="text"
                                    placeholder={t('fields.enterUsername')}
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    required
                                />
                                <FaRegUser className={cx('icon')} />
                            </div>
                        </div>
                        <div className={cx('authentication')}>
                            <p>{t('fields.phone')}</p>
                            <div className={cx('info')}>
                                <input
                                    type="text"
                                    placeholder={t('fields.enterPhone')}
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required
                                />
                                <CiMobile3 className={cx('icon')} />
                            </div>
                        </div>
                        <div className={cx('authentication')}>
                            <p>{t('fields.email')}</p>
                            <div className={cx('info')}>
                                <input
                                    type="email"
                                    placeholder={t('fields.enterEmail')}
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                                <MdOutlineEmail className={cx('icon')} />
                            </div>
                        </div>

                        <div className={cx('authentication')}>
                            <p>{t('fields.password')}</p>
                            <div className={cx('info')}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={t('fields.enterPassword')}
                                    value={formData.password}
                                    name="password"
                                    onChange={handlePasswordChange}
                                    required
                                />
                                {passwordEmpty ? (
                                    <RiLockPasswordLine className={cx('icon')} />
                                ) : showPassword ? (
                                    <FaEyeSlash className={cx('icon', 'eye')} onClick={handleShowPassword} />
                                ) : (
                                    <FaEye className={cx('icon', 'eye')} onClick={handleShowPassword} />
                                )}
                            </div>
                        </div>
                        <div className={cx('authentication')}>
                            <p>{t('fields.confirmPassword')}</p>
                            <div className={cx('info')}>
                                <input
                                    type={showConfirmedPassword ? 'text' : 'password'}
                                    placeholder={t('fields.reenterPassword')}
                                    value={formData.confirmedPassword}
                                    name="confirmedPassword"
                                    onChange={handleConfirmedPasswordChange}
                                    required
                                />
                                {confirmedPasswordEmpty ? (
                                    <RiLockPasswordLine className={cx('icon')} />
                                ) : showConfirmedPassword ? (
                                    <FaEyeSlash className={cx('icon', 'eye')} onClick={handleShowConfirmedPassword} />
                                ) : (
                                    <FaEye className={cx('icon', 'eye')} onClick={handleShowConfirmedPassword} />
                                )}
                            </div>
                        </div>
                    </div>
                    <div className={cx('selection')}>
                        <div className={cx('choose')}>
                            <h4>{t('select.role')}</h4>
                            <select name="role" value={formData.role} onChange={handleInputChange}>
                                <option value="patient">{t('select.patient')}</option>
                                <option value="doctor">{t('select.doctor')}</option>
                            </select>
                        </div>
                        <div className={cx('upload-photo')}>
                            <div>
                                {selectedFile && <img src={previewUrl} alt="" />}
                                <input
                                    type="file"
                                    name="photo"
                                    id="customFile"
                                    accept=".jpg, .png, .jpeg, .webp"
                                    onChange={handleFileInputChange}
                                />
                                <label htmlFor="customFile">
                                    {isUploadingImg ? <SyncLoader size={6} color="#ffffff" /> : t('photo.upload')}
                                </label>
                            </div>
                            <p>{t('photo.notice')}</p>
                        </div>
                        <div className={cx('choose')}>
                            <h4>{t('select.gender')}</h4>
                            <select name="gender" value={formData.gender} onChange={handleInputChange}>
                                <option value="male">{t('select.male')}</option>
                                <option value="female">{t('select.female')}</option>
                                <option value="other">{t('select.other')}</option>
                            </select>
                        </div>
                    </div>

                    <div className={cx('authenticators')}>
                        <h4>{t('authenticator.choose')}</h4>
                        <div onClick={() => setTab('email')}>
                            <input
                                type="radio"
                                name="authenticator"
                                required
                                checked={tab === 'email'}
                                onChange={() => setTab('email')}
                            />
                            <label htmlFor="authenticators">{t('authenticator.email')}</label>
                        </div>
                        <div onClick={() => setTab('SMS')}>
                            <input
                                type="radio"
                                name="authenticator"
                                required
                                checked={tab === 'SMS'}
                                onChange={() => setTab('SMS')}
                            />
                            <label htmlFor="authenticators">{t('authenticator.sms')}</label>
                        </div>
                    </div>

                    <div className={cx('remember-container')}>
                        <input type="checkbox" />
                        <p className={cx('question')}>{t('agreement')}</p>
                    </div>

                    <button disabled={loading} className={cx('register-btn')}>
                        {loading ? <SyncLoader size={8} color="#ffffff" /> : t('button.register')}
                    </button>

                    <div className={cx('other-account')}>
                        <p>{t('other.orLogin')}</p>
                        <div className={cx('social-network')}>
                            <FcGoogle className={cx('google')} />
                            <FaFacebook className={cx('facebook')} />
                        </div>
                    </div>
                    <div className={cx('have-account')}>
                        <p>{t('other.haveAccount')}</p>
                        <Link to="/login" className={cx('to-sign-in-page')}>
                            {t('other.signIn')}
                        </Link>
                    </div>
                </form>
            </div>

            <div id="recaptcha-container"></div>

            {showVerifyOTP && (
                <div className={cx('form-wrapper')}>
                    <div className={cx('overlay')} onClick={() => setShowVerifyOTP(false)}></div>
                    <div className={cx('form-update', 'verifyOTP')}>
                        <VerifyOTP formData={formData} tab={tab} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Register;
