import React, { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './MyAccount.module.scss';
import { TbStatusChange } from 'react-icons/tb';
import { MdLogout } from 'react-icons/md';
import MyBookings from '../MyBookings/MyBookings';
import UpdateInformation from '../UpdateInformation/UpdateInformation';
import ChangePassword from '../ChangePassword/ChangePassword';
import Loader from '../../../components/Loader/Loader';
import Error from '../../../components/Error/Error';
import ConfirmLogout from '../../../components/ConfirmLogout/ConfirmLogout';
import { Dialog, Slide, Drawer, useMediaQuery } from '@mui/material';

import useFetchProfile from '../../../hooks/useFetchData';
import { BASE_URL } from '../../../../config';

const cx = classNames.bind(styles);
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const MyAccount = () => {
    const isMobile = useMediaQuery('(max-width:768px)');
    const { data: userData, loading, error } = useFetchProfile(`${BASE_URL}/users/profile/me`);
    const [showFormUpdateInfo, setShowFormUpdateInfo] = useState(false);
    const [showFormChangePassword, setShowFormChangePassword] = useState(false);
    const [showConfirmLogout, setShowConfirmLogout] = useState(false);
    const [showProfileMobile, setShowProfileMobile] = useState(false);

    return (
        <div className={cx('container-parent')}>
            {loading ? (
                <Loader />
            ) : error ? (
                <Error errorMessage={error} />
            ) : (
                <div className={cx('container')}>
                    {isMobile && (
                        <div className={cx('profile-mobile-btn')} onClick={() => setShowProfileMobile(true)}>
                            Profile {'>>'}
                        </div>
                    )}
                    {!loading && !error && !isMobile && (
                        <div className={cx('info')}>
                            <img src={userData.photo} alt="" />
                            <h1>{userData.fullname}</h1>
                            <h4>{userData.username}</h4>
                            {userData.dateOfBirth && (
                                <p>
                                    <b>Date of birth:</b> {userData.dateOfBirth}
                                </p>
                            )}
                            <p>
                                <b>Email:</b> {userData.email}
                            </p>
                            <p>
                                <b>Phone number:</b> (+84) {userData.phone}
                            </p>
                            {userData.address && (
                                <p>
                                    <b>Address:</b> {userData.address}
                                </p>
                            )}
                            {userData.bloodType ? (
                                <p>
                                    <b>Blood type:</b> {userData.bloodType}
                                </p>
                            ) : (
                                <p></p>
                            )}
                            <div>
                                <button onClick={() => setShowFormUpdateInfo(true)}>
                                    Change information <TbStatusChange />
                                </button>
                                <button onClick={() => setShowFormChangePassword(true)}>
                                    Change password <TbStatusChange />
                                </button>
                                <button onClick={() => setShowConfirmLogout(true)}>
                                    Logout <MdLogout />
                                </button>
                            </div>
                        </div>
                    )}
                    <div className={cx('bookings')}>
                        <h1>MY APPOINTMENTS</h1>
                        <MyBookings />
                    </div>

                    <Drawer
                        anchor="left"
                        open={showProfileMobile}
                        onClose={() => setShowProfileMobile(false)}
                        BackdropProps={{ style: { top: '60px' } }}
                        sx={{
                            '& .MuiPaper-root': {
                                width: '85%',
                                top: '60px',
                            },
                        }}
                    >
                        <div className={cx('info')}>
                            <img src={userData.photo} alt="" />
                            <h1>{userData.fullname}</h1>
                            <h4>{userData.username}</h4>
                            {userData.dateOfBirth && (
                                <p>
                                    <b>Date of birth:</b> {userData.dateOfBirth}
                                </p>
                            )}
                            <p>
                                <b>Email:</b> {userData.email}
                            </p>
                            <p>
                                <b>Phone number:</b> (+84) {userData.phone}
                            </p>
                            {userData.address && (
                                <p>
                                    <b>Address:</b> {userData.address}
                                </p>
                            )}
                            {userData.bloodType && (
                                <p>
                                    <b>Blood type:</b> {userData.bloodType}
                                </p>
                            )}
                            <div>
                                <button onClick={() => setShowFormUpdateInfo(true)}>
                                    Change information <TbStatusChange />
                                </button>
                                <button onClick={() => setShowFormChangePassword(true)}>
                                    Change password <TbStatusChange />
                                </button>
                                <button onClick={() => setShowConfirmLogout(true)}>
                                    Logout <MdLogout />
                                </button>
                            </div>
                        </div>
                    </Drawer>

                    <Dialog
                        open={showFormUpdateInfo}
                        TransitionComponent={Transition}
                        keepMounted
                        onClose={() => setShowFormUpdateInfo(false)}
                        aria-describedby="alert-dialog-slide-description"
                    >
                        <div className={cx('form-update', 'update-info')}>
                            <UpdateInformation setShowFormUpdateInfo={setShowFormUpdateInfo} userData={userData} />
                        </div>
                    </Dialog>

                    <Dialog
                        open={showFormChangePassword}
                        TransitionComponent={Transition}
                        keepMounted
                        onClose={() => setShowFormChangePassword(false)}
                        aria-describedby="alert-dialog-slide-description"
                    >
                        <div className={cx('form-update', 'change-password')}>
                            <ChangePassword setShowFormChangePassword={setShowFormChangePassword} userData={userData} />
                        </div>
                    </Dialog>

                    <Dialog
                        open={showConfirmLogout}
                        TransitionComponent={Transition}
                        keepMounted
                        onClose={() => setShowConfirmLogout(false)}
                        aria-describedby="alert-dialog-slide-description"
                    >
                        <div className={cx('form-update', 'logout')}>
                            <ConfirmLogout setShowConfirmLogout={setShowConfirmLogout} />
                        </div>
                    </Dialog>
                </div>
            )}
        </div>
    );
};

export default MyAccount;
