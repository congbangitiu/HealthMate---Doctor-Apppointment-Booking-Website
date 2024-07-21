import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './MyAccount.module.scss';
import { TbStatusChange } from 'react-icons/tb';
import { MdLogout } from 'react-icons/md';
import { FaRegTrashAlt } from 'react-icons/fa';
import MyBookings from '../MyBookings/MyBookings';
import UpdateInformation from '../UpdateInformation/UpdateInformation';
import ChangePassword from '../ChangePassword/ChangePassword';
import Loader from '../../../components/Loader/Loader';
import Error from '../../../components/Error/Error';
import ConfirmLogout from '../../../components/ConfirmLogout/ConfirmLogout';

import useFetchProfile from '../../../hooks/useFetchData';
import { BASE_URL } from '../../../../config';

const cx = classNames.bind(styles);

const MyAccount = () => {
    const { data: userData, loading, error } = useFetchProfile(`${BASE_URL}/users/profile/me`);
    const [showFormUpdateInfo, setShowFormUpdateInfo] = useState(false);
    const [showFormChangePassword, setShowFormChangePassword] = useState(false);
    const [showConfirmLogout, setShowConfirmLogout] = useState(false);

    return (
        <div className={cx('container-parent')}>
            {loading ? (
                <Loader />
            ) : error ? (
                <Error errorMessage={error} />
            ) : (
                <div className={cx('container')}>
                    {!loading && !error && (
                        <div className={cx('info')}>
                            <img src={userData.photo} alt="" />
                            <h1>{userData.fullname}</h1>
                            <h4>{userData.username}</h4>
                            <p>Email: {userData.email}</p>
                            <p>Phone number: {userData.phone}</p>
                            {userData.bloodType ? <p>Blood type: {userData.bloodType}</p> : <p></p>}
                            <button onClick={() => setShowFormUpdateInfo(true)}>
                                Change information <TbStatusChange />
                            </button>
                            <button onClick={() => setShowFormChangePassword(true)}>
                                Change password <TbStatusChange />
                            </button>
                            <button onClick={() => setShowConfirmLogout(true)}>
                                Logout <MdLogout />
                            </button>
                            <button>
                                Delete account <FaRegTrashAlt />
                            </button>
                        </div>
                    )}
                    <div className={cx('bookings')}>
                        <h1>MY APPOINTMENTS</h1>
                        <MyBookings />
                    </div>

                    {showFormUpdateInfo && (
                        <div className={cx('form-wrapper')}>
                            <div className={cx('overlay')} onClick={() => setShowFormUpdateInfo(false)}></div>
                            <div className={cx('form-update', 'update-info')}>
                                <UpdateInformation setShowFormUpdateInfo={setShowFormUpdateInfo} userData={userData} />
                            </div>
                        </div>
                    )}

                    {showFormChangePassword && (
                        <div className={cx('form-wrapper')}>
                            <div className={cx('overlay')} onClick={() => setShowFormChangePassword(false)}></div>
                            <div className={cx('form-update', 'change-password')}>
                                <ChangePassword
                                    setShowFormChangePassword={setShowFormChangePassword}
                                    userData={userData}
                                />
                            </div>
                        </div>
                    )}

                    {showConfirmLogout && (
                        <div className={cx('form-wrapper')}>
                            <div className={cx('overlay')} onClick={() => setShowFormChangePassword(false)}></div>
                            <div className={cx('form-update', 'logout')}>
                                <ConfirmLogout setShowConfirmLogout={setShowConfirmLogout} />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MyAccount;
