import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Dialog, Slide } from '@mui/material';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const MyBookings = () => {
    const { t, i18n } = useTranslation('myBookings');
    const navigate = useNavigate();

    const { data: appointments, loading, error } = useFetchData(`${BASE_URL}/users/appointments/my-appointments`);
    const [showConfirmCancel, setShowConfirmCancel] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedAppointmentStatus, setSelectedAppointmentStatus] = useState(null);
    const [selectedSchedule, setSelectedSchedule] = useState({
        value: 'newest',
        label: t('filters.newest'),
    });
    const [filteredAppointments, setFilteredAppointments] = useState([]);

    const [currentPage, setCurrentPage] = useState(0);
    const [currentItems, setCurrentItems] = useState([]);
    const itemsPerPage = 5;

    useEffect(() => {
        let updatedAppointments = [...appointments];

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

        // Sort by Schedule
        if (selectedSchedule && selectedSchedule.value) {
            updatedAppointments.sort((a, b) => {
                if (selectedSchedule.value === 'newest') {
                    // Newest to Oldest
                    if (a.timeSlot.day !== b.timeSlot.day) {
                        return new Date(b.timeSlot.day) - new Date(a.timeSlot.day);
                    }
                    return (
                        new Date(`1970-01-01T${b.timeSlot.startingTime}:00Z`) -
                        new Date(`1970-01-01T${a.timeSlot.startingTime}:00Z`)
                    );
                } else if (selectedSchedule.value === 'oldest') {
                    // Oldest to Newest
                    if (a.timeSlot.day !== b.timeSlot.day) {
                        return new Date(a.timeSlot.day) - new Date(b.timeSlot.day);
                    }
                    return (
                        new Date(`1970-01-01T${a.timeSlot.startingTime}:00Z`) -
                        new Date(`1970-01-01T${b.timeSlot.startingTime}:00Z`)
                    );
                }
                return 0;
            });

            updatedAppointments = [...updatedAppointments];
        }

        setFilteredAppointments(updatedAppointments);
    }, [selectedDoctor, selectedAppointmentStatus, selectedSchedule, appointments]);

    const handleDelete = (appointment) => {
        setSelectedAppointment(appointment);
        setShowConfirmCancel(true);
    };

    const doctorsOptions = [
        { value: 'all', label: t('filters.allDoctors') },
        ...Array.from(new Set(appointments.map((appointment) => appointment.doctor?.fullname)))
            .filter((fullname) => fullname) // Remove value undefined/null
            .map((fullname) => ({
                value: fullname,
                label: `Dr. ${fullname}`,
            })),
    ];

    const appointmentsStatusOptions = [
        { value: 'all', label: t('filters.allStatuses') },
        { value: 'pending', label: t('filters.pending') },
        { value: 'done', label: t('filters.done') },
        { value: 'cancelled', label: t('filters.cancelled') },
    ];

    useEffect(() => {
        // Rebuild schedule option based on language
        if (selectedSchedule?.value) {
            setSelectedSchedule({
                value: selectedSchedule.value,
                label: t(`filters.${selectedSchedule.value}`),
            });
        }

        // Rebuild patient option
        if (selectedDoctor?.value === 'all') {
            setSelectedDoctor({
                value: 'all',
                label: t('filters.allPatients'),
            });
        }

        // Rebuild appointment status option
        if (selectedAppointmentStatus) {
            const statusMap = {
                all: t('filters.allStatuses'),
                pending: t('filters.pending'),
                done: t('filters.done'),
                cancelled: t('filters.cancelled'),
            };
            setSelectedAppointmentStatus({
                value: selectedAppointmentStatus.value,
                label: statusMap[selectedAppointmentStatus.value],
            });
        }
    }, [i18n.language]);

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
                    appointmentsStatusOptions={appointmentsStatusOptions}
                    selectedSchedule={selectedSchedule}
                    setSelectedSchedule={setSelectedSchedule}
                    hidePatient={true}
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
                                                <PatientAppointment
                                                    appointment={appointment}
                                                    handleDelete={handleDelete}
                                                />
                                            </div>
                                        ) : (
                                            <div
                                                className={cx('link', { pending: appointment?.status === 'pending' })}
                                                onClick={() =>
                                                    navigate(`/users/appointments/my-appointments/${appointment._id}`)
                                                }
                                            >
                                                <PatientAppointment
                                                    appointment={appointment}
                                                    handleDelete={handleDelete}
                                                />
                                            </div>
                                        )}
                                        {appointment?.status === 'pending' && (
                                            <span className={cx('icon')} onClick={() => handleDelete(appointment)}>
                                                <FaRegTrashAlt />
                                            </span>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <h4>{t('messages.noAppointmentsMatch')}</h4>
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
