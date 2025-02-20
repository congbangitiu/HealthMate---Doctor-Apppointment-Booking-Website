import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './MyBookings.module.scss';
import useFetchData from '../../../hooks/useFetchData';
import { BASE_URL } from '../../../../config';
import Loader from '../../../components/Loader/Loader';
import Error from '../../../components/Error/Error';
import PatientAppointment from '../../../components/PatientAppointment/PatientAppointment';
import ConfirmCancel from '../ConfirmCancel/ConfirmCancel';
import Selections from '../../../components/Selections/Selections';
import Pagination from '../../../components/Pagination/Pagination';
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

    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedAppointmentStatus, setSelectedAppointmentStatus] = useState(null);
    const [filteredAppointments, setFilteredAppointments] = useState([]);

    const [currentPage, setCurrentPage] = useState(0);
    const [currentItems, setCurrentItems] = useState([]);
    const itemsPerPage = 5;

    useEffect(() => {
        let updatedAppointments = appointments;

        // Filter by doctor
        if (selectedDoctor && selectedDoctor.value !== 'all') {
            updatedAppointments = updatedAppointments.filter(
                (appointment) => appointment.doctor?.fullname === selectedDoctor.value,
            );
        }

        // Filter by appointment status
        if (selectedAppointmentStatus && selectedAppointmentStatus.value !== 'all') {
            updatedAppointments = updatedAppointments.filter(
                (appointment) => appointment.status === selectedAppointmentStatus.value,
            );
        }

        setFilteredAppointments(updatedAppointments);
    }, [selectedDoctor, selectedAppointmentStatus, appointments]);

    const handleDeleteClick = (appointment) => {
        setSelectedAppointment(appointment);
        setShowConfirmCancel(true);
    };

    const doctorsOptions = [
        { value: 'all', label: 'All Doctors' },
        ...Array.from(new Set(appointments.map((appointment) => appointment.doctor?.fullname)))
            .filter((fullname) => fullname) // Remove value undefined/null
            .map((fullname) => ({
                value: fullname,
                label: `Dr. ${fullname}`,
            })),
    ];

    const statusOptions = [
        { value: 'all', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'done', label: 'Done' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    useEffect(() => {
        const offset = currentPage * itemsPerPage;
        const items = filteredAppointments.slice(offset, offset + itemsPerPage);
        setCurrentItems(items);
    }, [currentPage, filteredAppointments, itemsPerPage]);

    return (
        <div className={cx('container')}>
            <div className={cx('selections')}>
                <Selections
                    selectedDoctor={selectedDoctor}
                    setSelectedDoctor={setSelectedDoctor}
                    doctorsOptions={doctorsOptions}
                    selectedAppointmentStatus={selectedAppointmentStatus}
                    setSelectedAppointmentStatus={setSelectedAppointmentStatus}
                    appointmentsOptions={statusOptions}
                    hidePatient={true}
                    justify="space-around"
                />
            </div>
            {loading ? (
                <Loader />
            ) : error ? (
                <Error errorMessage={error} />
            ) : (
                !loading &&
                !error && (
                    <>
                        <div className={cx('appointments')}>
                            {filteredAppointments.length > 0 ? (
                                currentItems.map((appointment) => (
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
                                ))
                            ) : (
                                <h4>You did not book any doctor yet!</h4>
                            )}
                        </div>

                        {!loading && filteredAppointments.length > itemsPerPage && (
                            <Pagination
                                data={filteredAppointments}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                setCurrentPage={setCurrentPage}
                            />
                        )}
                    </>
                )
            )}

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
