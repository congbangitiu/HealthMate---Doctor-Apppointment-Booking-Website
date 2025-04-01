import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './ReExaminationAppointment.module.scss';
import { FaCircleExclamation } from 'react-icons/fa6';
import useFetchData from '../../../hooks/useFetchData';
import { BASE_URL, token } from '../../../../config';
import Loader from '../../../components/Loader/Loader';
import { toast } from 'react-toastify';
import ToggleButton from '../../../components/ToggleButton/ToggleButton';
import ReExaminationAppointmentEdit from '../ReExaminationAppointmentEdit/ReExaminationAppointmentEdit';
import ReExaminationAppointmentView from '../ReExaminationAppointmentView/ReExaminationAppointmentView';

const cx = classNames.bind(styles);

const ReExaminationAppointment = () => {
    const { id } = useParams();
    const [appointment, setAppointment] = useState(null);
    const [toggle, setToggle] = useState(false);
    const [schedule, setSchedule] = useState({
        day: '',
        startingTime: '',
        endingTime: '',
    });

    const { data: prescription, loading } = useFetchData(
        appointment?._id ? `${BASE_URL}/prescriptions/${appointment._id}` : null,
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resAppointment = await fetch(`${BASE_URL}/doctors/appointments/my-appointments/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const appointmentData = await resAppointment.json();

                if (appointmentData.success) {
                    setAppointment(appointmentData.data);
                } else {
                    toast.error(appointmentData.message || 'Error fetching appointment data');
                }
            } catch (error) {
                console.error('Fetch error:', error);
                toast.error('Error fetching data');
            }
        };

        fetchData();
    }, [id]);

    useEffect(() => {
        if (appointment?.nextAppointment?.timeSlot) {
            setSchedule({
                day: appointment.nextAppointment.timeSlot.day,
                startingTime: appointment.nextAppointment.timeSlot.startingTime,
                endingTime: appointment.nextAppointment.timeSlot.endingTime,
            });
        }
    }, [appointment]);

    if (!appointment) {
        return <Loader />;
    }

    return (
        <div className={cx('container')}>
            {appointment.status === 'pending' && (
                <div className={cx('pending-noti')}>
                    <FaCircleExclamation className={cx('icon')} />
                    You can only schedule a follow-up once both the examination form and prescription are available.
                </div>
            )}

            <ToggleButton toggle={toggle} setToggle={setToggle} />

            {loading ? (
                <Loader />
            ) : !toggle ? (
                <ReExaminationAppointmentEdit
                    appointment={appointment}
                    prescription={prescription}
                    schedule={schedule}
                    setSchedule={setSchedule}
                />
            ) : (
                <ReExaminationAppointmentView
                    appointment={appointment}
                    prescription={prescription}
                    onPDFUploadSuccess={(pdfInfo) => {
                        setAppointment((prev) => ({
                            ...prev,
                            nextAppointment: {
                                ...prev.nextAppointment,
                                pdfInfo,
                            },
                        }));
                    }}
                />
            )}
        </div>
    );
};

export default ReExaminationAppointment;
