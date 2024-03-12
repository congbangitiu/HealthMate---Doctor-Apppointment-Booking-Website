import React from 'react';
import classNames from 'classnames/bind';
import styles from './DoctorCard.module.scss';
import { FaStar } from 'react-icons/fa';
import { FaLongArrowAltRight } from 'react-icons/fa';
import Doctors from '../../assets/data/doctors';

const cx = classNames.bind(styles);

const DoctorCard = () => {
    return (
        <div className={cx('container')}>
            <h2>Our great doctors</h2>
            <p className={cx('description')}>
                World-class care for everyone. Our health System offers unmatched, expert health care.
            </p>
            <div className={cx('doctors')}>
                {Doctors.map((doctor) => (
                    <div key={doctor.id} className={cx('doctor')}>
                        <img src={doctor.photo} alt="" />
                        <h4>{doctor.name}</h4>
                        <div className={cx('expertise-rating')}>
                            <div className={cx('expertise')}>{doctor.specialty}</div>
                            <div className={cx('rating')}>
                                <FaStar className={cx('stars')} />
                                <p>{doctor.avgRating}</p>
                                <p>({doctor.totalRating})</p>
                            </div>
                        </div>
                        <div className={cx('details')}>
                            <div>
                                <p className={cx('patients')}>+{doctor.totalPatients} patients</p>
                                <p className={cx('office')}>{doctor.hospital}</p>
                            </div>
                            <div className={cx('icon-wrapper')}>
                                <FaLongArrowAltRight className={cx('arrow-icon')} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DoctorCard;
