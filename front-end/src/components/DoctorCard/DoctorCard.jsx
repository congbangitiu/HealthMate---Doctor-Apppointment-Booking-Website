import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './DoctorCard.module.scss';
import { FaStar } from 'react-icons/fa';
import { FaLongArrowAltRight } from 'react-icons/fa';
import Doctors from '../../assets/data/doctors';

const cx = classNames.bind(styles);

const DoctorCard = ({ doctor }) => {
    return (
        <div className={cx('container')}>
            <img src={doctor.photo} alt="" />
            <h4>Dr. {doctor.fullname}</h4>
            <div className={cx('expertise-rating')}>
                <div className={cx('expertise')}>{doctor.specialization}</div>
                <div className={cx('rating')}>
                    <FaStar className={cx('stars')} />
                    <p>{doctor.avgRating}</p>
                    <p>({doctor.totalRating})</p>
                </div>
            </div>
            <div className={cx('details')}>
                <div>
                    <p className={cx('patients')}>+{doctor.totalPatients} patients</p>
                    <p className={cx('office')}>
                        {doctor.experiences[0]?.hospital.length > 25
                            ? doctor.experiences[0]?.hospital.slice(0, 25) + ' ...'
                            : doctor.experiences[0]?.hospital}
                    </p>
                </div>
                <Link to={`/doctors/${doctor._id}`} className={cx('icon-wrapper')}>
                    <FaLongArrowAltRight className={cx('arrow-icon')} />
                </Link>
            </div>
        </div>
    );
};

DoctorCard.propTypes = {
    doctor: PropTypes.object.isRequired,
};

export default DoctorCard;
