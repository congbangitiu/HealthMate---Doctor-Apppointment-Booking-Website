import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './ChangePassword.module.scss';

import { RiLockPasswordLine } from 'react-icons/ri';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import { toast } from 'react-toastify';
import SyncLoader from 'react-spinners/SyncLoader';

import { BASE_URL, token } from '../../../../config';
import { PropTypes } from 'prop-types';

const cx = classNames.bind(styles);

const ChangePassword = ({ setShowFormChangePassword, userData }) => {
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

    useEffect(() => {
        setFormData({
            password: userData.password,
            confirmedPassword: userData.password,
        });
    }, [userData]);

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

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/users/${userData._id}`, {
                method: 'put',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const { message } = await res.json();
            if (!res.ok) {
                throw new Error(message);
            }
            setLoading(false);
            setShowFormChangePassword(false);
            toast.success(message);
            await delay(2000);
            window.location.reload();
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
            <h1>Change your password</h1>
            <form action="" onSubmit={submitHandler}>
                <div className={cx('fields')}>
                    <div className={cx('authentication')}>
                        <p>Old Password</p>
                        <div className={cx('info')}>
                            <input
                                type={showOldPassword ? 'text' : 'password'}
                                placeholder="Enter your old password"
                                value={formData.oldPassword}
                                name="oldPassword"
                                onChange={handleOldPasswordChange}
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
                        <p>New Password</p>
                        <div className={cx('info')}>
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                placeholder="Enter your new password"
                                value={formData.newPassword}
                                name="newPassword"
                                onChange={handleNewPasswordChange}
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
                        <p>Confirm New Password</p>
                        <div className={cx('info')}>
                            <input
                                type={showConfirmedNewPassword ? 'text' : 'password'}
                                placeholder="Re-enter your new password"
                                value={formData.confirmedNewPassword}
                                name="confirmedNewPassword"
                                onChange={handleConfirmedNewPasswordChange}
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

                <button disabled={loading && true} className={cx('submit-btn')}>
                    {loading ? <SyncLoader size={10} color="#ffffff" /> : 'Update'}
                </button>
            </form>
        </div>
    );
};

ChangePassword.propTypes = {
    setShowFormChangePassword: PropTypes.func.isRequired,
    userData: PropTypes.object.isRequired,
};

export default ChangePassword;
