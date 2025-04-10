import React, { useState } from 'react';
import PropTypes from 'prop-types';

import classNames from 'classnames/bind';
import styles from './Tabs.module.scss';

import Doctor from '../../../assets/images/about.png';
import { MdLogout } from 'react-icons/md';
import { TbStatusChange } from 'react-icons/tb';

import ChangePassword from '../ChangePassword/ChangePassword';
import ConfirmLogout from '../../../components/ConfirmLogout/ConfirmLogout';

import Dialog from '@mui/material/Dialog';
import Slide from '@mui/material/Slide';

const cx = classNames.bind(styles);
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const Tabs = ({ tab, setTab, doctorData, setShowProfileMobile }) => {
    const [showFormChangePassword, setShowFormChangePassword] = useState(false);
    const [showConfirmLogout, setShowConfirmLogout] = useState(false);

    return (
        <div className={cx('container')}>
            <img src={doctorData.photo || Doctor} alt="" />
            <h4>Dr. {doctorData.fullname}</h4>
            <div className={cx('modes')}>
                <button
                    className={cx('mode', tab === 'overview' && 'active')}
                    onClick={() => {
                        setTab('overview');
                        setShowProfileMobile(false);
                    }}
                >
                    Overview
                </button>
                {doctorData.isApproved === 'approved' && (
                    <button
                        className={cx('mode', tab === 'appointments' && 'active')}
                        onClick={() => {
                            setTab('appointments');
                            setShowProfileMobile(false);
                        }}
                    >
                        Appointments
                    </button>
                )}
                <button
                    className={cx('mode', tab === 'setting' && 'active')}
                    onClick={() => {
                        setTab('setting');
                        setShowProfileMobile(false);
                    }}
                >
                    Profile Setting
                </button>
            </div>

            <div className={cx('account')}>
                <button onClick={() => setShowFormChangePassword(true)}>
                    Change password <TbStatusChange />
                </button>
                <button onClick={() => setShowConfirmLogout(true)}>
                    Logout <MdLogout />
                </button>
            </div>

            <Dialog
                open={showFormChangePassword}
                TransitionComponent={Transition}
                keepMounted
                onClose={() => setShowFormChangePassword(false)}
                sx={{
                    '& .MuiPaper-root': {
                        width: '100%',
                        borderRadius: '10px',
                    },
                }}
                aria-describedby="alert-dialog-slide-description"
            >
                <ChangePassword setShowFormChangePassword={setShowFormChangePassword} doctorData={doctorData} />
            </Dialog>

            <Dialog
                open={showConfirmLogout}
                TransitionComponent={Transition}
                keepMounted
                onClose={() => setShowConfirmLogout(false)}
                sx={{
                    '& .MuiPaper-root': {
                        width: '100%',
                        borderRadius: '10px',
                    },
                }}
                aria-describedby="alert-dialog-slide-description"
            >
                <ConfirmLogout setShowConfirmLogout={setShowConfirmLogout} />
            </Dialog>
        </div>
    );
};

Tabs.propTypes = {
    tab: PropTypes.string.isRequired,
    setTab: PropTypes.func.isRequired,
    doctorData: PropTypes.object.isRequired,
    setShowProfileMobile: PropTypes.object.isRequired,
};

export default Tabs;
