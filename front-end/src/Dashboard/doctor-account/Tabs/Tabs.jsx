import { useContext } from 'react';
import PropTypes from 'prop-types';

import classNames from 'classnames/bind';
import styles from './Tabs.module.scss';

import Doctor from '../../../assets/images/about.png';
import { MdLogout } from 'react-icons/md';
import { FaRegTrashAlt } from 'react-icons/fa';

import { authContext } from '../../../context/AuthContext';

const cx = classNames.bind(styles);

const Tabs = ({ tab, setTab, doctorData }) => {
    const { dispatch } = useContext(authContext);
    const handleLogout = () => {
        dispatch({ type: 'LOGOUT' });
        window.location.href = '/login';
    };
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
                <button onClick={handleLogout}>
                    Logout <MdLogout />
                </button>
                <button>
                    Delete account <FaRegTrashAlt />
                </button>
            </div>
        </div>
    );
};

Tabs.propTypes = {
    tab: PropTypes.string.isRequired,
    setTab: PropTypes.func.isRequired,
    doctorData: PropTypes.object.isRequired,
};

export default Tabs;
