import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './MyBookings.module.scss';
import useFetchData from '../../../hooks/useFetchData';
import { BASE_URL } from '../../../../config';
import Loader from '../../../components/Loader/Loader';
import Error from '../../../components/Error/Error';
import PatientAppointment from '../../../components/PatientAppointment/PatientAppointment';
import ConfirmCancel from '../ConfirmCancel/ConfirmCancel';
import { FaRegTrashAlt } from 'react-icons/fa';
import Dialog from '@mui/material/Dialog';
import Slide from '@mui/material/Slide';

const cx = classNames.bind(styles);
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const MyBookings = () => {
    const { data: appointments, loading, error } = useFetchData(`${BASE_URL}/users/appointments/my-appointments`);
    const [showConfirmCancel, setShowConfirmCancel] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    const handleDeleteClick = (appointment) => {
        setSelectedAppointment(appointment);
        setShowConfirmCancel(true);
    };

    return (
        <div className={cx('container')}>
            {loading ? (
                <Loader />
            ) : error ? (
                <Error errorMessage={error} />
            ) : (
                !loading &&
                !error && (
                    <div className={cx('appointments')}>
                        {appointments.map((appointment) => (
                            <div key={appointment._id}>
                                {appointment?.status === 'cancelled' ? (
                                    <div className={cx('link', 'cancelled')}>
                                        <PatientAppointment appointment={appointment} />
                                    </div>
                                ) : (
                                    <Link
                                        to={`/users/appointments/my-appointments/${appointment._id}`}
                                        className={cx('link', { pending: appointment?.status === 'pending' })}
                                    >
                                        <PatientAppointment appointment={appointment} />
                                    </Link>
                                )}
                                {appointment?.status === 'pending' && (
                                    <span className={cx('icon')} onClick={() => handleDeleteClick(appointment)}>
                                        <FaRegTrashAlt />
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )
            )}

            {!loading && !error && appointments.length === 0 && <h4>You did not book any doctor yet!</h4>}

            <Dialog
                open={showConfirmCancel && selectedAppointment}
                TransitionComponent={Transition}
                keepMounted
                onClose={() => setShowConfirmCancel(false)}
                aria-describedby="alert-dialog-slide-description"
                sx={{
                    '& .MuiPaper-root': {
                        borderRadius: '10px',
                    },
                }}
            >
                <div className={cx('cancel')}>
                    <ConfirmCancel setShowConfirmCancel={setShowConfirmCancel} appointment={selectedAppointment} />
                </div>
            </Dialog>
        </div>
    );
};

export default MyBookings;
