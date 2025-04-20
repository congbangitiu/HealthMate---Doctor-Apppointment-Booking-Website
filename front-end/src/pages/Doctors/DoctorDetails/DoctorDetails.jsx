import React, { useState, useContext, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './DoctorDetails.module.scss';
import axios from 'axios';
import Doctor from '../../../components/Doctor/Doctor';
import SidePanel from '../../../components/SidePanel/SidePanel';
import AboutDoctor from '../../../components/AboutDoctor/AboutDoctor';
import FeedbackDoctor from '../../../components/FeedbackDoctor/FeedbackDoctor';
import { BASE_URL, token } from '../../../../config';
import useFetchData from '../../../hooks/useFetchData';
import Loader from '../../../components/Loader/Loader';
import Error from '../../../components/Error/Error';
import { useParams } from 'react-router-dom';
import { authContext } from '../../../context/AuthContext';
import { toast } from 'react-toastify';
import SyncLoader from 'react-spinners/SyncLoader';
import { Dialog, useMediaQuery } from '@mui/material';

const cx = classNames.bind(styles);

const DoctorDetails = () => {
    const [activeTab, setActiveTab] = useState('about');
    const { id } = useParams();
    const isMobile = useMediaQuery('(max-width:768px)');
    const { data: doctor, loading, error } = useFetchData(`${BASE_URL}/doctors/${id}`);
    const { role } = useContext(authContext);
    const [loadingApprove, setLoadingApprove] = useState(false);
    const [loadingReject, setLoadingReject] = useState(false);
    const [expandeSidePanel, setExpandeSidePanel] = useState(false);

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);

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
            window.location.href = '/admins/management';
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
            window.location.href = '/admins/management';
        } catch (error) {
            toast.error('Fail to approved doctor');
            setLoadingReject(false);
            console.error('Error rejecting doctor:', error);
        }
    };

    return (
        <div className={cx('container-parent')}>
            {doctor.isApproved === 'pending' && role === 'admin' && (
                <div className={cx('verification', 'pending')}>
                    <h4>Do you want to approve this doctor&apos;s account ?</h4>
                    <div className={cx('buttons')}>
                        <button onClick={() => handleReject(doctor._id)}>
                            {loadingReject ? <SyncLoader size={7} color="#30d5c8" /> : 'Reject'}
                        </button>
                        <button onClick={() => handleApprove(doctor._id)}>
                            {loadingApprove ? <SyncLoader size={7} color="#ffffff" /> : 'Approve'}
                        </button>
                    </div>
                </div>
            )}

            {doctor.isApproved === 'rejected' && role === 'admin' && (
                <div className={cx('verification', 'rejected')}>
                    <h4>Do you want to approve this doctor&apos;s account ?</h4>
                    <div className={cx('buttons')}>
                        <button onClick={() => handleApprove(doctor._id)}>
                            {loadingApprove ? <SyncLoader size={7} color="#ffffff" /> : 'Approve'}
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <Loader />
            ) : error ? (
                <Error errorMessage={error} />
            ) : (
                <div className={cx('container')}>
                    <div className={cx('doctor-slots')}>
                        <span>
                            <Doctor {...doctor} />
                        </span>

                        {expandeSidePanel ? (
                            <Dialog
                                open={expandeSidePanel}
                                keepMounted
                                onClose={() => setExpandeSidePanel(false)}
                                fullWidth
                                maxWidth={false}
                                sx={{
                                    '& .MuiPaper-root': {
                                        borderRadius: '16px',
                                        height: 'max-content',
                                        width: isMobile ? '100%' : '800px',
                                        padding: isMobile ? '20px' : '30px',
                                        boxShadow: isMobile ? 'none' : '0 10px 30px var(--black-08)',
                                        border: isMobile ? 'none' : '1px solid var(--black-05)',
                                        margin: '0',
                                    },
                                }}
                            >
                                <SidePanel
                                    doctorId={doctor._id}
                                    ticketPrice={doctor.ticketPrice}
                                    timeSlots={doctor.timeSlots}
                                    doctorPhoto={doctor.photo}
                                    doctorName={doctor.fullname}
                                    role={role}
                                    expandeSidePanel={expandeSidePanel}
                                    setExpandeSidePanel={setExpandeSidePanel}
                                />
                            </Dialog>
                        ) : (
                            <div
                                style={{
                                    width: isMobile ? '100%' : '450px',
                                    padding: isMobile ? '10px 0' : '20px',
                                    boxShadow: isMobile ? 'none' : '0 10px 30px var(--black-08)',
                                    border: isMobile ? 'none' : '1px solid var(--black-05)',
                                    borderTop: isMobile ? '1px solid var(--darkGrayColor)' : 'none',
                                    borderBottom: isMobile ? '1px solid var(--darkGrayColor)' : 'none',
                                    borderRadius: isMobile ? '0' : '16px',
                                    margin: isMobile ? '20px 0' : '0',
                                }}
                            >
                                <SidePanel
                                    doctorId={doctor._id}
                                    ticketPrice={doctor.ticketPrice}
                                    timeSlots={doctor.timeSlots}
                                    doctorPhoto={doctor.photo}
                                    doctorName={doctor.fullname}
                                    role={role}
                                    expandeSidePanel={expandeSidePanel}
                                    setExpandeSidePanel={setExpandeSidePanel}
                                />
                            </div>
                        )}
                    </div>
                    <div className={cx('bar')}>
                        <div className={cx({ active: activeTab === 'about' })} onClick={() => setActiveTab('about')}>
                            About
                            <div></div>
                        </div>
                        <div
                            className={cx({ active: activeTab === 'feedback' })}
                            onClick={() => setActiveTab('feedback')}
                        >
                            Feedback
                            <div></div>
                        </div>
                    </div>
                    {activeTab === 'about' ? <AboutDoctor {...doctor} /> : <FeedbackDoctor {...doctor} role={role} />}
                </div>
            )}
        </div>
    );
};

export default DoctorDetails;
