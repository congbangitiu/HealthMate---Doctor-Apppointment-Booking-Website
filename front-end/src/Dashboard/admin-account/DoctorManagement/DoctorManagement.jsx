import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { PropTypes } from 'prop-types';
import classNames from 'classnames/bind';
import styles from './DoctorManagement.module.scss';
import { BASE_URL, token } from '../../../../config';
import { FaStar, FaLongArrowAltRight } from 'react-icons/fa';
import { PiSmileySad } from 'react-icons/pi';
import { CiCirclePlus } from 'react-icons/ci';
import { Dialog, Slide, useMediaQuery } from '@mui/material';
import roundNumber from '../../../utils/roundNumber';
import Loader from '../../../components/Loader/Loader';
import Error from '../../../components/Error/Error';
import SyncLoader from 'react-spinners/SyncLoader';
import DoctorAppointmentBarChart from '../Charts/DoctorAppointmentBarChart/DoctorAppointmentBarChart';
import DoctorCreationForm from '../../../components/DoctorCreationForm/DoctorCreationForm';
import AdminSearch from '../AdminSearch/AdminSearch';
import { toast } from 'react-toastify';
import DefaultMaleDoctorAvatar from '../../../assets/images/default-male-doctor.png';
import DefaultFemaleDoctorAvatar from '../../../assets/images/default-female-doctor.png';

const cx = classNames.bind(styles);
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const DoctorManagement = ({ doctors, setDebouncedQuery, loading, error }) => {
    const isMobile = useMediaQuery('(max-width:768px)');
    const [query, setQuery] = useState('');
    const [doctorChart, setDoctorChart] = useState('');
    const [isActiveDoctor, setIsActiveDoctor] = useState();
    const [loadingApprove, setLoadingApprove] = useState(false);
    const [loadingReject, setLoadingReject] = useState(false);
    const [showChart, setShowChart] = useState(false);
    const [showDoctorCreationForm, setShowDoctorCreationForm] = useState(false);
    const chartRef = useRef(null);

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);

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
        setShowChart(true);
        chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleCloseChart = () => {
        setIsActiveDoctor(null);
        setShowChart(false);
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
            <div className={cx('upper-part')}>
                <AdminSearch
                    title="Doctors"
                    total={officialDoctors.length}
                    placeholder="Type doctor's name or subspecialty ..."
                    query={query}
                    setQuery={setQuery}
                />
                <button onClick={() => setShowDoctorCreationForm(true)}>
                    <CiCirclePlus className={cx('icon')} />
                    Add new doctor
                </button>
            </div>

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
                                                        <span>{doctor.subspecialty}</span>
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
                                                        <span>{doctor.subspecialty}</span>
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
                                        <img
                                            src={
                                                doctor.photo
                                                    ? doctor.photo
                                                    : doctor.gender === 'male'
                                                    ? DefaultMaleDoctorAvatar
                                                    : DefaultFemaleDoctorAvatar
                                            }
                                            alt=""
                                        />
                                        <div className={cx('rating')}>
                                            <FaStar className={cx('star')} />
                                            <span>{roundNumber(doctor.averageRating, 1)}</span>
                                        </div>
                                    </div>
                                    <div className={cx('info')}>
                                        <h4>Dr. {doctor.fullname}</h4>
                                        <p>{doctor.subspecialty}</p>
                                    </div>
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
                            open={showChart}
                            onClose={handleCloseChart}
                            maxWidth="xl"
                            sx={{
                                '& .MuiPaper-root': {
                                    borderRadius: '16px',
                                },
                            }}
                        >
                            {!isMobile ? (
                                <div ref={chartRef}>
                                    {doctorChart !== '' && <DoctorAppointmentBarChart doctorChart={doctorChart} />}
                                </div>
                            ) : (
                                <div className={cx('device-warning')}>
                                    <PiSmileySad className={cx('icon')} />
                                    <p>
                                        Chart analytics are NOT available on mobile devices. Please switch to a desktop
                                        for full access to data visualizations and in-depth insights to better manage
                                        the system.
                                    </p>
                                </div>
                            )}
                        </Dialog>
                    </div>
                </div>
            )}

            <Dialog
                open={showDoctorCreationForm}
                TransitionComponent={Transition}
                keepMounted
                onClose={() => setShowDoctorCreationForm(false)}
                aria-describedby="alert-dialog-slide-description"
                sx={{
                    '& .MuiPaper-root': {
                        borderRadius: '16px',
                        ...(isMobile && { minWidth: 'calc(100% - 40px)' }),
                    },
                }}
            >
                <div className={cx('doctor-creation-form')}>
                    <DoctorCreationForm setShowDoctorCreationForm={setShowDoctorCreationForm} />
                </div>
            </Dialog>
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
