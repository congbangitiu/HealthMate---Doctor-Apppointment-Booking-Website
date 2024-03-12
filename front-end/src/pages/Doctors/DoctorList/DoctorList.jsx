import React from 'react';
import classNames from 'classnames/bind';
import styles from './DoctorList.module.scss';

import Search from '../../../components/Search/Search';
import DoctorCard from '../../../components/DoctorCard/DoctorCard';

const cx = classNames.bind(styles);

const DoctorList = () => {
    return (
        <div className={cx('container')}>
            <Search />

            <DoctorCard />
        </div>
    );
};

export default DoctorList;
