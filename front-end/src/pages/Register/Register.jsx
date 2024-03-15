import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Register.module.scss';
import { MdOutlineEmail } from 'react-icons/md';
import { RiLockPasswordLine } from 'react-icons/ri';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook, FaEye, FaEyeSlash } from 'react-icons/fa';
import { FaRegUser } from 'react-icons/fa6';
import { CiMobile3 } from 'react-icons/ci';
import Avatar from '../../assets/images/doctor-img01.png';

const cx = classNames.bind(styles);

const Register = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [passwordEmpty, setPasswordEmpty] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [formData, setFormData] = useState({
        fullname: '',
        username: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        photo: selectedFile,
        gender: '',
        role: 'patient',
    });

    const handleShowPassword = () => {
        setShowPassword((prevShowPassword) => !prevShowPassword);
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

    const handleFileInputChange = async (e) => {
        const file = e.target.files[0];
        console.log(file);
    };

    const submitHandler = async (e) => {
        e.preventDefault();
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
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Re-enter your password"
                                    value={formData.confirmPassword}
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
                            <img src={Avatar} alt="" />
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

                    <button className={cx('register-btn')}>Sign up</button>

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
