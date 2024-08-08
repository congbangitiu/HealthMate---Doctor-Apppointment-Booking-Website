import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './Tabs.module.scss';
import { BiSolidDashboard } from 'react-icons/bi';
import { FaUserDoctor, FaHospitalUser } from 'react-icons/fa6';
import { FaCalendarAlt } from 'react-icons/fa';
import PropTypes from 'prop-types';

const cx = classNames.bind(styles);

const Tabs = ({ activeTab, setActiveTab }) => {
    return (
        <div className={cx('container')}>
            <div className={cx('tab', { active: activeTab === 'dashboard' })} onClick={() => setActiveTab('dashboard')}>
                <BiSolidDashboard className={cx('icon')} />
                <h4>Dashboard</h4>
            </div>
            <div className={cx('tab', { active: activeTab === 'doctor' })} onClick={() => setActiveTab('doctor')}>
                <FaUserDoctor className={cx('icon')} />
                <h4>Doctor</h4>
            </div>
            <div className={cx('tab', { active: activeTab === 'patient' })} onClick={() => setActiveTab('patient')}>
                <FaHospitalUser className={cx('icon')} />
                <h4>Patient</h4>
            </div>
            <div
                className={cx('tab', { active: activeTab === 'appointment' })}
                onClick={() => setActiveTab('appointment')}
            >
                <FaCalendarAlt className={cx('icon')} />
                <h4>Appointment</h4>
            </div>
        </div>
    );
};

Tabs.propTypes = {
    activeTab: PropTypes.string.isRequired,
    setActiveTab: PropTypes.func.isRequired,
};

export default Tabs;
