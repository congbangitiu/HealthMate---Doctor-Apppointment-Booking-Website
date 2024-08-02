import { useState } from 'react';
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

const cx = classNames.bind(styles);

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

            {showConfirmCancel && selectedAppointment && (
                <div className={cx('form-wrapper')}>
                    <div className={cx('overlay')}></div>
                    <div className={cx('cancel')}>
                        <ConfirmCancel setShowConfirmCancel={setShowConfirmCancel} appointment={selectedAppointment} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyBookings;
