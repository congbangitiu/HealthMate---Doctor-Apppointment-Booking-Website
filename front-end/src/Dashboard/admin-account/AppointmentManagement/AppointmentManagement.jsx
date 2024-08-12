import React from 'react';
import classNames from 'classnames/bind';
import styles from './AppointmentManagement.module.scss';
import Select from 'react-select';

const cx = classNames.bind(styles);

const AppointmentManagement = () => {
    const options = [
        { value: 'chocolate', label: 'Chocolate' },
        { value: 'strawberry', label: 'Strawberry' },
        { value: 'vanilla', label: 'Vanilla' },
    ];

    return (
        <div className={cx('container')}>
            <div className={cx('upper-part')}>
                <h4>Appointments (100)</h4>
                <div className={cx('selections')}>
                    <Select options={options} />
                </div>
            </div>
        </div>
    );
};

export default AppointmentManagement;
