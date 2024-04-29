import React from 'react';
import classNames from 'classnames/bind';
import styles from './Dashboard.module.scss';

const cx = classNames.bind(styles);

const Dashboard = () => {
    return <div className={cx('container')}>Dashboard</div>;
};

export default Dashboard;
