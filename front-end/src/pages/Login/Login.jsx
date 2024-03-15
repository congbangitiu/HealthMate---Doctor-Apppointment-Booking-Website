import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Login.module.scss';
import { MdOutlineEmail } from 'react-icons/md';
import { RiLockPasswordLine } from 'react-icons/ri';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook, FaEye, FaEyeSlash } from 'react-icons/fa';

const cx = classNames.bind(styles);

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [passwordEmpty, setPasswordEmpty] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleShowPassword = () => {
        setShowPassword((prevShowPassword) => !prevShowPassword);
    };

    const handleEmailChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        if (e.target.value === '' && showPassword === true) {
            setShowPassword(false);
        }
        setPasswordEmpty(e.target.value === '');
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className={cx('container')}>
            <div className={cx('inner')}>
                <div className={cx('intro')}>
                    <h3>Sign in</h3>
                    <p>Sign in to stay connected</p>
                </div>

                <form action="">
                    <div className={cx('authentication')}>
                        <p>Email</p>
                        <div className={cx('info')}>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                name="email"
                                value={formData.email}
                                onChange={handleEmailChange}
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
                    <div className={cx('remember-forgot')}>
                        <div className={cx('remember-container')}>
                            <input type="checkbox" />
                            <p className={cx('question')}>Remember me ?</p>
                        </div>
                        <p className={cx('forgot')}>Forgot Password</p>
                    </div>
                    <button className={cx('login-btn')}>Sign in</button>

                    <div className={cx('other-account')}>
                        <p>or sign in with other accounts?</p>
                        <div className={cx('social-network')}>
                            <FcGoogle className={cx('google')} />
                            <FaFacebook className={cx('facebook')} />
                        </div>
                    </div>
                    <div className={cx('do-not-have-account')}>
                        <p>Don&apos;t you have account?</p>
                        <Link to="/register" className={cx('to-sign-up-page')}>
                            Sign up
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
