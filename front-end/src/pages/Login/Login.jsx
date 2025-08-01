import { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Login.module.scss';
import { MdOutlineEmail } from 'react-icons/md';
import { RiLockPasswordLine } from 'react-icons/ri';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook, FaEye, FaEyeSlash } from 'react-icons/fa';
import { BASE_URL } from '../../../config';
import SyncLoader from 'react-spinners/SyncLoader';
import { toast } from 'react-toastify';
import { authContext } from '../../context/AuthContext.jsx';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const Login = () => {
    const { t } = useTranslation('login');

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordEmpty, setPasswordEmpty] = useState(true);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const { dispatch } = useContext(authContext);

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

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/auth/login`, {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.message);
            }

            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: {
                    user: result.data,
                    role: result.role,
                    token: result.token,
                },
            });
            setLoading(false);
            toast.success(result.message);
            setTimeout(() => {
                window.location.href = '/home';
            }, 1000);
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
                    <p>{t('subtitle')}</p>
                </div>

                <form action="" onSubmit={submitHandler}>
                    <div className={cx('authentication')}>
                        <p>{t('emailLabel')}</p>
                        <div className={cx('info')}>
                            <input
                                type="email"
                                placeholder={t('emailPlaceholder')}
                                name="email"
                                value={formData.email}
                                onChange={handleEmailChange}
                                required
                            />
                            <MdOutlineEmail className={cx('icon')} />
                        </div>
                    </div>
                    <div className={cx('authentication')}>
                        <p>{t('passwordLabel')}</p>
                        <div className={cx('info')}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder={t('passwordPlaceholder')}
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
                            <p className={cx('question')}>{t('remember')}</p>
                        </div>
                        <p className={cx('forgot')}>{t('forgot')}</p>
                    </div>
                    <button disabled={loading} className={cx('login-btn')}>
                        {loading ? <SyncLoader size={8} color="#ffffff" /> : t('signIn')}
                    </button>

                    <div className={cx('other-account')}>
                        <p>{t('or')}</p>
                        <div className={cx('social-network')}>
                            <FcGoogle className={cx('google')} />
                            <FaFacebook className={cx('facebook')} />
                        </div>
                    </div>
                    <div className={cx('do-not-have-account')}>
                        <p>{t('noAccount')}</p>
                        <Link to="/register" className={cx('to-sign-up-page')}>
                            {t('signup')}
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
