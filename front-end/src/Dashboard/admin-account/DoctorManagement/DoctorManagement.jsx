import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import classNames from 'classnames/bind';
import styles from './DoctorManagement.module.scss';
import { BASE_URL, token } from '../../../../config';
import { FaStar, FaLongArrowAltRight } from 'react-icons/fa';
import { Dialog } from '@mui/material';
import roundNumber from '../../../utils/roundNumber';
import Loader from '../../../components/Loader/Loader';
import Error from '../../../components/Error/Error';
import DoctorAppointmentBarChart from '../Charts/DoctorAppointmentBarChart/DoctorAppointmentBarChart';
import AdminSearch from '../AdminSearch/AdminSearch';
import { toast } from 'react-toastify';
import SyncLoader from 'react-spinners/SyncLoader';
import { PropTypes } from 'prop-types';

const cx = classNames.bind(styles);

const DoctorManagement = ({ doctors, setDebouncedQuery, loading, error }) => {
    const [query, setQuery] = useState('');
    const [doctorChart, setDoctorChart] = useState('');
    const [isActiveDoctor, setIsActiveDoctor] = useState();
    const [loadingApprove, setLoadingApprove] = useState(false);
    const [loadingReject, setLoadingReject] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const chartRef = useRef(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedQuery(query);
        }, 600);
        return () => {
            clearTimeout(timeout);
        };
    }, [query]);

    const handleVisualizeChart = (selectedName, activeIndex) => {
        setIsActiveDoctor(activeIndex);
        setDoctorChart(selectedName);
        setOpenDialog(true);
        chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleCloseDialog = () => {
        setIsActiveDoctor(null);
        setOpenDialog(false);
    };

    const pendingDoctors = doctors.filter((doctor) => doctor.isApproved === 'pending');
    const officialDoctors = doctors.filter((doctor) => doctor.isApproved === 'approved');
    const rejectedDoctors = doctors.filter((doctor) => doctor.isApproved === 'rejected');

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const handleApprove = async (doctorId) => {
        try {
            setLoadingApprove(true);
            await axios.put(
                `${BASE_URL}/doctors/${doctorId}`,
                {
                    isApproved: 'approved',
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            toast.success('Doctor approved successfully');
            setLoadingApprove(false);
            await delay(2000);
            window.location.reload();
        } catch (error) {
            setLoadingApprove(false);
            toast.error('Fail to approved doctor');
            console.error('Error approving doctor:', error);
        }
    };

    const handleReject = async (doctorId) => {
        try {
            setLoadingReject(true);

            await axios.put(
                `${BASE_URL}/doctors/${doctorId}`,
                {
                    isApproved: 'rejected',
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            toast.success('Doctor rejected successfully');
            setLoadingReject(false);
            await delay(2000);
            window.location.reload();
        } catch (error) {
            toast.error('Fail to approved doctor');
            setLoadingReject(false);
            console.error('Error rejecting doctor:', error);
        }
    };

    return (
        <div className={cx('container')}>
            <AdminSearch
                title="Doctors"
                total={officialDoctors.length}
                placeholder="Type doctor's name or specialization ..."
                query={query}
                setQuery={setQuery}
            />

            {loading ? (
                <Loader />
            ) : error ? (
                <Error errorMessage={error} />
            ) : (
                <div className={cx('lower-part')}>
                    {pendingDoctors.length > 0 && (
                        <div className={cx('pending-doctors')}>
                            <h4 className={cx('title')}>Pending Doctors</h4>
                            <div className={cx('doctors')}>
                                {pendingDoctors.map((doctor, index) => (
                                    <div key={index} className={cx('doctor-card')}>
                                        <div className={cx('doctor')}>
                                            <img src={doctor.photo} alt="" />
                                            <div className={cx('info')}>
                                                <div>
                                                    <div>
                                                        <h4>Dr. {doctor.fullname}</h4>
                                                        <span>{doctor.specialization}</span>
                                                    </div>
                                                    <h4>PENDING</h4>
                                                </div>
                                                <div>
                                                    <div>
                                                        <p>
                                                            <b>Email: </b>
                                                            {doctor.email}
                                                        </p>
                                                        <p>
                                                            <b>Phone: </b>
                                                            {doctor.phone}
                                                        </p>
                                                    </div>
                                                    <Link to={`/doctors/${doctor._id}`} className={cx('icon-wrapper')}>
                                                        <FaLongArrowAltRight className={cx('arrow-icon')} />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={cx('buttons')}>
                                            <button onClick={() => handleReject(doctor._id)}>
                                                {loadingReject ? <SyncLoader size={6} color="#30d5c8" /> : 'Reject'}
                                            </button>
                                            <button onClick={() => handleApprove(doctor._id)}>
                                                {loadingApprove ? <SyncLoader size={6} color="#ffffff" /> : 'Approve'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {rejectedDoctors.length > 0 && (
                        <div className={cx('rejected-doctors')}>
                            <h4 className={cx('title')}>Rejected Doctors</h4>
                            <div className={cx('doctors')}>
                                {rejectedDoctors.map((doctor, index) => (
                                    <div key={index} className={cx('doctor-card')}>
                                        <div className={cx('doctor')}>
                                            <img src={doctor.photo} alt="" />
                                            <div className={cx('info')}>
                                                <div>
                                                    <div>
                                                        <h4>Dr. {doctor.fullname}</h4>
                                                        <span>{doctor.specialization}</span>
                                                    </div>
                                                    <h4>REJECTED</h4>
                                                </div>
                                                <div>
                                                    <div>
                                                        <p>
                                                            <b>Email: </b>
                                                            {doctor.email}
                                                        </p>
                                                        <p>
                                                            <b>Phone: </b>
                                                            {doctor.phone}
                                                        </p>
                                                    </div>
                                                    <Link to={`/doctors/${doctor._id}`} className={cx('icon-wrapper')}>
                                                        <FaLongArrowAltRight className={cx('arrow-icon')} />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={cx('buttons')}>
                                            <button onClick={() => handleApprove(doctor._id)}>
                                                {loadingApprove ? <SyncLoader size={6} color="#ffffff" /> : 'Approve'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={cx('official-doctors')}>
                        <h4 className={cx('title')}>Official Doctors</h4>
                        <div className={cx('doctors')}>
                            {officialDoctors.map((doctor, index) => (
                                <div key={index} className={cx('doctor', { activeDoctor: isActiveDoctor === index })}>
                                    <div>
                                        <img src={doctor.photo} alt="" />
                                        <div className={cx('rating')}>
                                            <FaStar className={cx('star')} />
                                            <span>{roundNumber(doctor.averageRating, 1)}</span>
                                        </div>
                                    </div>
                                    <h4>Dr. {doctor.fullname}</h4>
                                    <p>{doctor.specialization}</p>
                                    <div className={cx('buttons')}>
                                        <Link to={`/doctors/${doctor._id}`}>
                                            <button>Details</button>
                                        </Link>
                                        <button onClick={() => handleVisualizeChart(doctor.fullname, index)}>
                                            Analysis
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Dialog
                            open={openDialog}
                            onClose={handleCloseDialog}
                            maxWidth="xl"
                            sx={{
                                '& .MuiPaper-root': {
                                    borderRadius: '16px',
                                },
                            }}
                        >
                            <div ref={chartRef}>
                                {doctorChart !== '' && <DoctorAppointmentBarChart doctorChart={doctorChart} />}
                            </div>
                        </Dialog>
                    </div>
                </div>
            )}
        </div>
    );
};

DoctorManagement.propTypes = {
    doctors: PropTypes.array.isRequired,
    setDebouncedQuery: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.string,
};

export default DoctorManagement;
