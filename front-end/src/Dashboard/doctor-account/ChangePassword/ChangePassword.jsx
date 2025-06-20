import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './ChangePassword.module.scss';
import { RiLockPasswordLine } from 'react-icons/ri';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import { toast } from 'react-toastify';
import SyncLoader from 'react-spinners/SyncLoader';
import { BASE_URL, token } from '../../../../config';
import { PropTypes } from 'prop-types';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const ChangePassword = ({ setShowFormChangePassword, doctorData }) => {
    const { t } = useTranslation('changePassword');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmedNewPassword, setShowConfirmedNewPassword] = useState(false);
    const [oldPasswordEmpty, setOldPasswordEmpty] = useState(true);
    const [newPasswordEmpty, setNewPasswordEmpty] = useState(true);
    const [confirmedPasswordEmpty, setConfirmedPasswordEmpty] = useState(true);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmedNewPassword: '',
    });

    const handleShowOldPassword = () => {
        setShowOldPassword((prevShowOldPassword) => !prevShowOldPassword);
    };

    const handleShowNewPassword = () => {
        setShowNewPassword((prevShowNewPassword) => !prevShowNewPassword);
    };

    const handleShowConfirmedNewPassword = () => {
        setShowConfirmedNewPassword((prevShowConfirmedNewPassword) => !prevShowConfirmedNewPassword);
    };

    const handleOldPasswordChange = (e) => {
        if (e.target.value === '' && showOldPassword === true) {
            setShowOldPassword(false);
        }
        setOldPasswordEmpty(e.target.value === '');
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNewPasswordChange = (e) => {
        if (e.target.value === '' && showNewPassword === true) {
            setShowNewPassword(false);
        }
        setNewPasswordEmpty(e.target.value === '');
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleConfirmedNewPasswordChange = (e) => {
        if (e.target.value === '' && showConfirmedNewPassword === true) {
            setShowConfirmedNewPassword(false);
        }
        setConfirmedPasswordEmpty(e.target.value === '');
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/doctors/change-password/${doctorData._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const responseText = await res.text();
            try {
                const data = JSON.parse(responseText);
                if (!res.ok) {
                    throw new Error(data.message);
                }
                setLoading(false);
                setShowFormChangePassword(false);
                toast.success(data.message);
                window.location.reload();
            } catch (error) {
                console.error('Response is not JSON:', responseText);
                throw new Error('The old password is incorrect or The new passwords do not match !!!');
            }
        } catch (error) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    return (
        <div className={cx('container')}>
            <div className={cx('close-icon-wrapper')}>
                <IoMdClose className={cx('close-icon')} onClick={() => setShowFormChangePassword(false)} />
            </div>
            <h1>{t('title')}</h1>
            <form onSubmit={submitHandler}>
                <div className={cx('fields')}>
                    <div className={cx('authentication')}>
                        <p>{t('oldPassword')}</p>
                        <div className={cx('info')}>
                            <input
                                type={showOldPassword ? 'text' : 'password'}
                                placeholder={t('oldPasswordPlaceholder')}
                                value={formData.oldPassword}
                                name="oldPassword"
                                onChange={handleOldPasswordChange}
                                required
                            />
                            {oldPasswordEmpty ? (
                                <RiLockPasswordLine className={cx('icon')} />
                            ) : showOldPassword ? (
                                <FaEyeSlash className={cx('icon', 'eye')} onClick={handleShowOldPassword} />
                            ) : (
                                <FaEye className={cx('icon', 'eye')} onClick={handleShowOldPassword} />
                            )}
                        </div>
                    </div>

                    <div className={cx('authentication')}>
                        <p>{t('newPassword')}</p>
                        <div className={cx('info')}>
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                placeholder={t('newPasswordPlaceholder')}
                                value={formData.newPassword}
                                name="newPassword"
                                onChange={handleNewPasswordChange}
                                required
                            />
                            {newPasswordEmpty ? (
                                <RiLockPasswordLine className={cx('icon')} />
                            ) : showNewPassword ? (
                                <FaEyeSlash className={cx('icon', 'eye')} onClick={handleShowNewPassword} />
                            ) : (
                                <FaEye className={cx('icon', 'eye')} onClick={handleShowNewPassword} />
                            )}
                        </div>
                    </div>

                    <div className={cx('authentication')}>
                        <p>{t('confirmPassword')}</p>
                        <div className={cx('info')}>
                            <input
                                type={showConfirmedNewPassword ? 'text' : 'password'}
                                placeholder={t('confirmPasswordPlaceholder')}
                                value={formData.confirmedNewPassword}
                                name="confirmedNewPassword"
                                onChange={handleConfirmedNewPasswordChange}
                                required
                            />
                            {confirmedPasswordEmpty ? (
                                <RiLockPasswordLine className={cx('icon')} />
                            ) : showConfirmedNewPassword ? (
                                <FaEyeSlash className={cx('icon', 'eye')} onClick={handleShowConfirmedNewPassword} />
                            ) : (
                                <FaEye className={cx('icon', 'eye')} onClick={handleShowConfirmedNewPassword} />
                            )}
                        </div>
                    </div>
                </div>

                <button disabled={loading} className={cx('submit-btn')}>
                    {loading ? <SyncLoader size={10} color="#ffffff" /> : t('submit')}
                </button>
            </form>
        </div>
    );
};

ChangePassword.propTypes = {
    setShowFormChangePassword: PropTypes.func.isRequired,
    doctorData: PropTypes.object.isRequired,
};

export default ChangePassword;
