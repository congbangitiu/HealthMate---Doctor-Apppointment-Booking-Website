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

const Tabs = ({ tab, setTab, doctorData }) => {
    const [showFormChangePassword, setShowFormChangePassword] = useState(false);
    const [showConfirmLogout, setShowConfirmLogout] = useState(false);

    return (
        <div className={cx('container')}>
            <img src={doctorData.photo || Doctor} alt="" />
            <h4>Dr. {doctorData.fullname}</h4>
            <div className={cx('modes')}>
                <button className={cx('mode', tab === 'overview' && 'active')} onClick={() => setTab('overview')}>
                    Overview
                </button>
                <button
                    className={cx('mode', tab === 'appointments' && 'active')}
                    onClick={() => setTab('appointments')}
                >
                    Appointments
                </button>
                <button className={cx('mode', tab === 'setting' && 'active')} onClick={() => setTab('setting')}>
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
                aria-describedby="alert-dialog-slide-description"
            >
                <div className={cx('dialog', 'change-password')}>
                    <ChangePassword setShowFormChangePassword={setShowFormChangePassword} doctorData={doctorData} />
                </div>
            </Dialog>

            <Dialog
                open={showConfirmLogout}
                TransitionComponent={Transition}
                keepMounted
                onClose={() => setShowConfirmLogout(false)}
                aria-describedby="alert-dialog-slide-description"
            >
                <div className={cx('dialog', 'logout')}>
                    <ConfirmLogout setShowConfirmLogout={setShowConfirmLogout} />
                </div>
            </Dialog>
        </div>
    );
};

Tabs.propTypes = {
    tab: PropTypes.string.isRequired,
    setTab: PropTypes.func.isRequired,
    doctorData: PropTypes.object.isRequired,
};

export default Tabs;
