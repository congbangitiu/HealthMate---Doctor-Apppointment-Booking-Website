import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './DashboardManagement.module.scss';
import { FaUserDoctor, FaHospitalUser, FaMoneyBill1Wave } from 'react-icons/fa6';
import { FaCalendarAlt } from 'react-icons/fa';
import CountUp from 'react-countup';
import TimeAppointmentBarChart from './../Charts/TimeAppointmentBarChart/TimeAppointmentBarChart';
import GenderDonutChart from '../Charts/GenderDonutChart/GenderDonutChart';
import { FaStar } from 'react-icons/fa';
import { PropTypes } from 'prop-types';
import roundNumber from '../../../utils/roundNumber';

const cx = classNames.bind(styles);

const DashboardManagement = ({ users, doctors, appointments }) => {
    const calculateRevenue = () => {
        const totalRevenue = appointments.reduce((acc, appointment) => acc + parseFloat(appointment.ticketPrice), 0);
        return totalRevenue;
    };

    const patients = users.filter((user) => user.role === 'patient');
    const officialDoctors = doctors.filter((doctor) => doctor.isApproved === 'approved');

    const topDoctors = () => {
        if (!doctors || doctors.length === 0) {
            return [];
        }
        const sortedDoctors = [...doctors].sort((a, b) => b.averageRating - a.averageRating);
        return sortedDoctors.slice(0, 3);
    };

    const topDoctorsList = topDoctors();

    const countGenderByRole = (users, doctors) => {
        const genderCount = {
            users: {
                male: 0,
                female: 0,
            },
            doctors: {
                male: 0,
                female: 0,
            },
        };

        users.forEach((user) => {
            if (user.role === 'patient') {
                if (user.gender === 'male') {
                    genderCount.users.male += 1;
                } else if (user.gender === 'female') {
                    genderCount.users.female += 1;
                }
            }
        });

        doctors.forEach((doctor) => {
            if (doctor.role === 'doctor') {
                if (doctor.gender === 'male') {
                    genderCount.doctors.male += 1;
                } else if (doctor.gender === 'female') {
                    genderCount.doctors.female += 1;
                }
            }
        });

        return genderCount;
    };
    const genderCount = countGenderByRole(patients, officialDoctors);

    return (
        <div className={cx('container')}>
            <div className={cx('items')}>
                <div className={cx('item')}>
                    <FaUserDoctor className={cx('icon')} />
                    <svg
                        version="1.1"
                        viewBox="0 0 2048 1047"
                        width="150"
                        height="150"
                        xmlns="http://www.w3.org/2000/svg"
                        className={cx('svg-img')}
                    >
                        <path
                            transform="translate(1899,266)"
                            d="m0 0h9l4 4 1 2v8l-5 5-128 19-39 7-38 9-31 9-26 10-20 9-17 9-21 13-18 13-10 8-14 12-12 11-3 3h-2l-2 4-16 16-7 8-9 11-13 16-21 28-10 16-9 12-13 20-14 22-8 11-7 11-3 2 9 14 5 16 1 11-3 14-7 14-8 10-9 6-8 4-17 4-8 2-12 16-7 9-9 10-10 9-14 11-11 8-15 8-17 6-21 5-20 2-21-2-22-5-18-6-27-11-16-8-31-16-20-11-24-14-25-14-16-9-28-15-34-16-29-11-21-7-14-3-20-1-10 2-12 5-13 10-9 10-13 18-16 24-12 20-10 17-13 21-11 18-8 12-13 18-9 11-11 12-20 20-8 7-10 9-19 14-21 14-19 11-28 13-26 10-34 10-24 6-29 5-36 3h-50l-37-3-27-4-36-8-36-9-25-9-21-9-9-7-5-9-1-9 5-10 9-8 9-1 37 13 32 10 44 11 26 4 28 3 24 1h22l33-2 28-4 28-6 27-8 26-10 25-12 19-10 16-12 14-11 14-12 12-11 19-19 8-10 10-13 8-12 14-22 14-24 10-17 11-18 16-25 10-13 11-13 16-16 14-9 10-5 12-4 19-2 22 1 22 4 19 5 31 11 32 14 29 14 22 12 27 16 21 12 27 15 28 16 20 9 21 8 20 6 12 2 17 1 14-1 19-5 12-5 11-7 12-11 14-14 7-10 3-6-1-7-7-17-1-5v-9l5-17 5-10 7-9 12-9 10-5 10-2h9l14 3 9 1 6-11 26-39 19-29 14-20 8-11 11-14 14-18 11-14 13-14 7-8 12-12 8-7 10-9 17-12 20-13 17-10 22-12 30-13 30-11 38-11 27-6 39-7 49-7 45-5z"
                            fill="#2BB8F9"
                        />
                    </svg>
                    <div className={cx('content')}>
                        <p>Total Doctors</p>
                        <h4>
                            <CountUp duration={5} end={officialDoctors.length} />
                        </h4>
                    </div>
                </div>
                <div className={cx('item')}>
                    <FaHospitalUser className={cx('icon')} />
                    <svg
                        version="1.1"
                        viewBox="0 0 2048 1019"
                        width="150"
                        height="150"
                        xmlns="http://www.w3.org/2000/svg"
                        className={cx('svg-img')}
                    >
                        <path
                            transform="translate(1631,187)"
                            d="m0 0h54l27 3 28 6 27 8 40 14 24 10 21 10 23 13 30 16 13 8 7 6 2 8-1 7-1 5-5-1-11-6-15-9-25-14-17-10-28-13-27-12-24-9-37-10-32-6-27-3-19-1h-12l-29 2-29 4-21 5-33 11-21 9-23 13-14 9-24 15-14 11-11 9-14 12-16 15-7 8-11 12-9 11-12 16-13 16-14 19-7 10-5 3-4 4 9 7 7 7 8 13 5 12 2 11-1 10-4 10-7 11-12 13-10 6-10 3-19 1-20 34-7 10-8 12-12 16-11 13-7 8-5 6-8 7-12 10-24 16-19 9-21 6-17 3h-34l-21-3-22-6-30-11-33-14-34-16-28-13-25-10-26-8-22-4-11-1-12 3-13 7-13 12-10 12-10 15-9 14-13 21-16 26-12 19-10 16-16 24-11 14-12 13-11 12-16 15-8 7-11 9-17 12-17 11-21 12-21 10-29 11-18 6-28 7-27 5-33 4-14 1h-53l-46-4-50-10-35-10-38-13-14-7-5-5-4-5-1-10 3-9 7-8 7-3 8 1 27 10 32 10 45 11 31 5 28 3 19 1h33l26-2 28-4 24-5 27-8 26-9 29-14 17-10 17-12 16-12 11-9 13-12 12-12 7-8 10-12 10-14 24-38 12-20 15-24 18-27 11-16 13-16 13-13 18-11 15-6 16-3h24l25 5 25 7 24 9 23 10 34 16 27 12 24 10 27 9 25 5 8 1h24l19-4 17-7 18-12 14-12 15-15 9-11 10-13 14-21 8-13 10-19 1-4-6-14-2-16 3-17 6-12 10-10 11-7 11-5 9-2h16l7 1-2-5 3-9 11-18 8-11 12-17 11-14 11-13 10-11 7-8 23-23 8-7 14-12 19-14 20-13 21-12 16-8 19-9 34-13 21-6 20-4z"
                            fill="#4974F3"
                        />
                    </svg>
                    <div className={cx('content')}>
                        <p>Total Patients</p>
                        <h4>
                            <CountUp duration={5} end={patients.length} />
                        </h4>
                    </div>
                </div>
                <div className={cx('item')}>
                    <FaCalendarAlt className={cx('icon')} />
                    <svg
                        version="1.1"
                        viewBox="0 0 2048 1019"
                        width="150"
                        height="150"
                        xmlns="http://www.w3.org/2000/svg"
                        className={cx('svg-img')}
                    >
                        <path
                            transform="translate(1919,106)"
                            d="m0 0 7 1 3 4-1 8-5 15-26 53-12 21-9 14-8 12-9 12-13 15-14 14-14 11-13 9-20 12-17 9-17 6-23 6-29 5-19 2-16 1h-28l-43-3-35-4-45-6-40-4-17-1h-18l-24 2-25 5-20 7-17 9-12 9-12 11-9 8-5 5h-2l10 13 11 19 5 15 1 5v11l-3 10-4 8-8 10-9 8-10 5-7 2-16 2-4 2-11 17-16 25-10 14-11 13-11 12-9 10-11 11-11 9-15 12-18 11-27 13-21 7-23 4-21 2h-31l-23-3-25-5-26-8-22-8-32-13-29-13-37-15-33-11-10-2h-22l-13 4-12 7-11 11-10 13-9 13-11 17-14 22-12 20-10 15-12 20-12 18-14 19-11 12-7 8-21 21-8 7-13 11-15 11-15 10-19 11-16 8-21 10-30 10-24 6-25 4-21 2-29 1-35-2-33-4-29-6-25-7-37-12-28-11-19-10-9-9-3-6v-8l5-9 9-7 2-1h8l19 7 25 10 28 10 34 10 29 6 28 4 10 1h43l27-2 25-4 26-7 24-9 25-12 19-12 17-12 11-9 14-12 25-25 9-11 10-13 10-15 15-24 14-24 17-28 12-19 12-17 10-13 12-13 11-10 18-11 14-5 12-2h26l21 3 26 7 24 9 25 11 28 13 28 12 19 7 30 9 19 4 26 3h32l25-4 15-5 21-11 16-10 13-11 10-9 8-7 8-8 7-8 14-18 13-19 18-27 1-6-6-19-1-5v-9l3-15 6-12 9-10 11-7 17-6 16-5 5-5 9-11 8-8 16-12 14-9 23-12 15-5 14-3 27-2 36 1 41 3 90 10 50 4h31l38-4 16-4 20-7 20-9 17-10 17-12 11-9 15-14 7-7 9-11 13-17 14-22 14-26 11-23 13-31 5-8z"
                            fill="#59931E"
                        />
                        <path
                            transform="translate(1919,106)"
                            d="m0 0 7 1 3 4-1 8-5 15-26 53-12 21-9 14-8 12-9 12-13 15-14 14-14 11-13 9-20 12-17 9-17 6-23 6-29 5-19 2-16 1h-28l-43-3-35-4-45-6-40-4-17-1h-18l-24 2-25 5-20 7-17 9-12 9-12 11-9 8-5 5h-2l5 7-13-3-8-3-2-1v-2l6-3 6-8 9-10 9-8 18-13 18-10 17-8 19-5 14-2 18-1 36 1 41 3 90 10 50 4h31l38-4 16-4 20-7 20-9 17-10 17-12 11-9 15-14 7-7 9-11 13-17 14-22 14-26 11-23 13-31 5-8z"
                            fill="#96BB74"
                        />
                    </svg>

                    <div className={cx('content')}>
                        <p>Total Appointments</p>
                        <h4>
                            <CountUp duration={5} end={appointments.length} />
                        </h4>
                    </div>
                </div>
                <div className={cx('item')}>
                    <FaMoneyBill1Wave className={cx('icon')} />
                    <svg
                        version="1.1"
                        viewBox="0 0 2048 1019"
                        width="150"
                        height="150"
                        xmlns="http://www.w3.org/2000/svg"
                        className={cx('svg-img')}
                    >
                        <path
                            transform="translate(1636,104)"
                            d="m0 0h56l35 3 27 4 27 7 33 11 28 11 30 13 21 11 50 30 12 9 2 3v8l-5 10-9-3-14-8-25-15-18-10-24-12-30-13-26-10-26-8-29-8-25-5-23-3-10-1-24-1h-14l-34 2-26 4-24 6-22 7-22 8-29 14-20 12-21 14-21 16-11 9-13 11-7 7-8 7-13 13-9 11-13 15-13 17-9 12-10 13-11 16-8 10-3 3 2 4 8 9 9 13 5 12 2 9v13l-3 13-8 14-11 12-10 6-11 4-26 4-13 15-14 14-15 11-18 10-21 8-22 5-24 3h-36l-26-3-46-8-50-10-43-9-43-7-15-2-13-1h-31l-21 3-17 4-15 6-12 6-12 9-11 10-15 20-9 15-16 27-15 22-10 13-13 15-12 13-14 14-11 9-16 13-15 10-18 10-19 9-24 9-28 8-27 5-25 3-15 1h-61l-56-3-42-3h-42l-31 3-21 5-16 6-16 8-14 9-11 9-14 14-13 17-9 11-9 8-6 1-10-5-9-8-4-8 1-9 8-16 10-14 13-15 13-13 17-13 16-10 16-8 16-6 28-7 28-4 10-1h59l61 4 45 2h41l26-2 24-4 27-7 21-8 18-8 19-11 16-11 13-11 12-11 8-8 7-8 12-14 10-13 12-18 14-24 13-21 9-12 11-13 14-14 15-11 23-12 19-7 21-5 22-3h45l34 4 41 7 52 11 56 11 37 5 26 2h10l26-3 17-4 18-7 13-9 12-10 7-9 2-6-6-22v-15l3-12 6-12 9-10 9-8 13-6 11-3 21-1 2-1 1-7 8-16 10-16 12-16 11-13 24-28 11-12 7-8 13-13 11-9 12-11 14-11 13-10 15-10 17-11 29-16 26-12 24-9 21-6 32-6 17-2z"
                            fill="#CE34ED"
                        />
                    </svg>

                    <div className={cx('content')}>
                        <p>Total Revenue</p>
                        <h4>
                            $<CountUp duration={5} end={calculateRevenue()} />
                        </h4>
                    </div>
                </div>
            </div>

            <div className={cx('wrapper')}>
                <TimeAppointmentBarChart />

                <div className={cx('wrapper-childrens')}>
                    <div className={cx('top-doctors')}>
                        <div className={cx('intro')}>
                            <h4>Top Doctors</h4>
                            <p>View All</p>
                        </div>
                        <div className={cx('doctors')}>
                            {topDoctorsList.map((topDoctor, index) => (
                                <Link to={`/doctors/${topDoctor._id}`} key={index} className={cx('doctor')}>
                                    <img src={topDoctor.photo} alt="" />
                                    <div>
                                        <span>
                                            <h4>Dr. {topDoctor.fullname}</h4>
                                            <span>
                                                <FaStar className={cx('stars')} />(
                                                {roundNumber(topDoctor.averageRating, 2)})
                                            </span>
                                        </span>
                                        <p>{topDoctor.specialization}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <GenderDonutChart genderCount={genderCount} />
                </div>
            </div>
        </div>
    );
};

DashboardManagement.propTypes = {
    users: PropTypes.array.isRequired,
    doctors: PropTypes.array.isRequired,
    appointments: PropTypes.array.isRequired,
};

export default DashboardManagement;
