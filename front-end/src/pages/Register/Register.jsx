import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import uploadImageToCloudinary from '../../utils/uploadCloudinary';
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
import { auth, RecaptchaVerifier, signInWithPhoneNumber, sendSignInLinkToEmail } from '../../utils/firebase';

const cx = classNames.bind(styles);

const Register = () => {
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

    const navigate = useNavigate();
    const [showVerifyOTP, setShowVerifyOTP] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [tab, setTab] = useState('email');

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
        try {
            const email = formData.email;

            if (!email) {
                throw new Error('Email is missing.');
            }

            const actionCodeSettings = {
                url: `${window.location.origin}/complete-sign-up`,
                handleCodeInApp: true,
            };

            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            window.localStorage.setItem('emailForSignIn', email);
            window.localStorage.setItem('formData', JSON.stringify(formData));
            setShowVerifyOTP(true);
            toast.success('Verification email sent');
        } catch (error) {
            console.log('Error sending email verification', error);
            toast.error('Failed to send verification email');
        }
    };

    const submitHandler = async (e) => {
        e.preventDefault();

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

    const verifyOTP = async (otp) => {
        setLoading(true);
        try {
            await confirmationResult.confirm(otp);
            const res = await fetch(`${BASE_URL}/auth/register`, {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const { message } = await res.json();
            if (!res.ok) {
                throw new Error(message);
            }
            setLoading(false);
            toast.success(message);
            navigate('/login');
        } catch (error) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    return (
        <div className={cx('container')}>
            <div className={cx('inner')}>
                <div className={cx('intro')}>
                    <h3>Sign up</h3>
                    <p>Create your account for more experiences</p>
                </div>

                <form action="" onSubmit={submitHandler}>
                    <div className={cx('fields')}>
                        <div className={cx('authentication')}>
                            <p>Fullname</p>
                            <div className={cx('info')}>
                                <input
                                    type="text"
                                    placeholder="Enter your fullname"
                                    name="fullname"
                                    value={formData.fullname}
                                    onChange={handleInputChange}
                                    required
                                />
                                <FaRegUser className={cx('icon')} />
                            </div>
                        </div>
                        <div className={cx('authentication')}>
                            <p>Username</p>
                            <div className={cx('info')}>
                                <input
                                    type="text"
                                    placeholder="Enter your username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    required
                                />
                                <FaRegUser className={cx('icon')} />
                            </div>
                        </div>
                        <div className={cx('authentication')}>
                            <p>Phone No.</p>
                            <div className={cx('info')}>
                                <input
                                    type="text"
                                    placeholder="Enter your phone number here"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required
                                />
                                <CiMobile3 className={cx('icon')} />
                            </div>
                        </div>
                        <div className={cx('authentication')}>
                            <p>Email</p>
                            <div className={cx('info')}>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                                <MdOutlineEmail className={cx('icon')} />
                            </div>
                        </div>

                        <div className={cx('authentication')}>
                            <p>Password</p>
                            <div className={cx('info')}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
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
                            <p>Confirm password</p>
                            <div className={cx('info')}>
                                <input
                                    type={showConfirmedPassword ? 'text' : 'password'}
                                    placeholder="Re-enter your password"
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
                            <h4>You are a: </h4>
                            <select name="role" value={formData.role} onChange={handleInputChange}>
                                <option value="patient">Patient</option>
                                <option value="doctor">Doctor</option>
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
                                    {isUploadingImg ? <SyncLoader size={6} color="#ffffff" /> : 'Upload photo'}
                                </label>
                            </div>
                            <p>(Notice: 1:1 scale photo)</p>
                        </div>
                        <div className={cx('choose')}>
                            <h4>Gender: </h4>
                            <select name="gender" value={formData.gender} onChange={handleInputChange}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className={cx('authenticators')}>
                        <h4>Choose an authenticator: </h4>
                        <div onClick={() => setTab('email')}>
                            <input
                                type="radio"
                                name="authenticator"
                                checked={tab === 'email'}
                                onChange={() => setTab('email')}
                            />
                            <label htmlFor="authenticators">Email Authenticator</label>
                        </div>
                        <div onClick={() => setTab('SMS')}>
                            <input
                                type="radio"
                                name="authenticator"
                                checked={tab === 'SMS'}
                                onChange={() => setTab('SMS')}
                            />
                            <label htmlFor="authenticators">SMS Authenticator</label>
                        </div>
                    </div>

                    <div className={cx('remember-container')}>
                        <input type="checkbox" />
                        <p className={cx('question')}>I agree with the terms of use</p>
                    </div>

                    <button disabled={loading} className={cx('register-btn')}>
                        {loading ? <SyncLoader size={10} color="#ffffff" /> : 'Sign up'}
                    </button>

                    <div className={cx('other-account')}>
                        <p>or sign in with other accounts?</p>
                        <div className={cx('social-network')}>
                            <FcGoogle className={cx('google')} />
                            <FaFacebook className={cx('facebook')} />
                        </div>
                    </div>
                    <div className={cx('have-account')}>
                        <p>You have already an account?</p>
                        <Link to="/login" className={cx('to-sign-in-page')}>
                            Sign in
                        </Link>
                    </div>
                </form>
            </div>

            <div id="recaptcha-container"></div>

            {showVerifyOTP && (
                <div className={cx('form-wrapper')}>
                    <div className={cx('overlay')} onClick={() => setShowVerifyOTP(false)}></div>
                    <div className={cx('form-update', 'verifyOTP')}>
                        <VerifyOTP phone={formData.phone} email={formData.email} verifyOTP={verifyOTP} tab={tab} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Register;
