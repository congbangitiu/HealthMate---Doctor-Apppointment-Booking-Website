import { useState } from 'react';
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

const cx = classNames.bind(styles);

const Register = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmedPassword, setShowConfirmedPassword] = useState(false);
    const [passwordEmpty, setPasswordEmpty] = useState(true);
    const [confirmedPasswordEmpty, setConfirmedPasswordEmpty] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [loading, setLoading] = useState(false);
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
        const file = e.target.files[0];
        const data = await uploadImageToCloudinary(file);

        setPreviewUrl(data.url);
        setSelectedFile(data.url);
        setFormData({ ...formData, photo: data.url });
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
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
                                    placeholder="Enter your phone number"
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
                            {selectedFile && <img src={previewUrl} alt="" />}
                            <input
                                type="file"
                                name="photo"
                                id="customFile"
                                accept=".jpg, .png"
                                onChange={handleFileInputChange}
                            />
                            <label htmlFor="customFile">Upload photo</label>
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
                    <div className={cx('remember-container')}>
                        <input type="checkbox" />
                        <p className={cx('question')}>I agree with the terms of use</p>
                    </div>

                    <button disabled={loading && true} className={cx('register-btn')}>
                        {loading  ? <SyncLoader size={10} color="#ffffff" /> : 'Sign up'}
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
        </div>
    );
};

export default Register;
