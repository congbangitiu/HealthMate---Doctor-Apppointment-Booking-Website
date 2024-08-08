import React from 'react';
import classNames from 'classnames/bind';
import styles from './PatientManagement.module.scss';

const cx = classNames.bind(styles);

const PatientManagement = () => {
    return <div className={cx('container')}>PatientManagement</div>;
};

export default PatientManagement;
