import { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './ReExaminationAppointmentEdit.module.scss';
import Logo from '../../../assets/images/logo.png';
import Watermark from '../../../assets/images/watermark30.png';
import SyncLoader from 'react-spinners/SyncLoader';
import { BASE_URL, token } from '../../../../config';
import { toast } from 'react-toastify';
import formatDate from '../../../utils/formatDate';

const cx = classNames.bind(styles);

const ReExaminationAppointmentEdit = ({ appointment, prescription, schedule, setSchedule }) => {
    const [loadingBtnSave, setLoadingBtnSave] = useState(false);

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'signature') {
            setSchedule({ ...schedule, signature: files[0] });
        } else {
            setSchedule({ ...schedule, [name]: value });
        }
    };

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoadingBtnSave(true);

        try {
            // Check token
            if (!token) {
                throw new Error('Authentication token is missing. Please log in again.');
            }

            // Validation
            const today = new Date().toISOString().split('T')[0];
            if (schedule.day < today) {
                throw new Error('Re-examination date must be in the future');
            }

            if (schedule.startingTime >= schedule.endingTime) {
                throw new Error('Starting time must be earlier than ending time');
            }

            const timeSlot = {
                day: schedule.day,
                startingTime: schedule.startingTime,
                endingTime: schedule.endingTime,
            };

            if (appointment.nextAppointment?.timeSlot) {
                // Case 1: next Appointment Time Slot already exists
                // Update the nextAppointmentTimeSlot of the current appointment
                const updateCurrentBookingResponse = await fetch(
                    `${BASE_URL}/bookings/${appointment._id}/next-time-slot`,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            nextAppointmentTimeSlot: timeSlot,
                        }),
                    },
                );

                const updateCurrentBookingResult = await updateCurrentBookingResponse.json();
                if (!updateCurrentBookingResult.success) {
                    throw new Error(updateCurrentBookingResult.message || 'Error updating current booking');
                }
            } else {
                // Case 2: next Appointment Time Slot does not exist, create a new re-examination schedule
                const response = await fetch(`${BASE_URL}/bookings/re-examination`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        doctorId: appointment.doctor._id,
                        userId: appointment.user._id,
                        timeSlot,
                        paymentMethod: 'free',
                        currentBookingId: appointment._id,
                    }),
                });

                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.message || 'Error creating re-examination appointment');
                }
            }

            // If there is a new signature, send a request to update the doctor's signature
            if (schedule.signature) {
                const signatureFormData = new FormData();
                signatureFormData.append('signature', schedule.signature);

                const signatureResponse = await fetch(`${BASE_URL}/doctors/${appointment.doctor._id}/signature`, {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: signatureFormData,
                });

                const signatureResult = await signatureResponse.json();
                if (!signatureResult.success) {
                    throw new Error(signatureResult.message || 'Error updating doctor signature');
                }
            }

            toast.success('Re-examination appointment saved successfully!');
        } catch (error) {
            console.error('Error saving re-examination appointment:', error);
            toast.error(error.message || 'Error saving re-examination appointment');
        } finally {
            setLoadingBtnSave(false);
            window.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
            await delay(2000);
            window.location.reload();
        }
    };

    return (
        <div className={cx('container')}>
            <form className={cx('re-examination')} onSubmit={handleSubmit}>
                <div className={cx('brand')}>
                    <img src={Logo} alt="" />
                    <div>
                        <h4>HEALTHMATE</h4>
                        <p>Your Wellness - Our Priority</p>
                    </div>
                </div>
                <h1>RE-EXAMINATION APPOINTMENT FORM</h1>
                <div className={cx('patient-info')}>
                    <p>
                        <b>Patient&apos;s full name:</b> {appointment?.user?.fullname}
                    </p>
                    <span>
                        <p>
                            <b>Date of birth:</b> {appointment?.user?.dateOfBirth}
                        </p>
                        <p className={cx('gender')}>
                            <b>Gender:</b> {appointment?.user?.gender}
                        </p>
                    </span>
                    <span>
                        <p>
                            <b>Address:</b> {appointment?.user?.address}
                        </p>
                        <p>
                            <b>Phone number:</b> 0{appointment?.user?.phone}
                        </p>
                    </span>
                </div>

                {appointment.status === 'done' && (
                    <>
                        <div className={cx('notice')}>
                            <div>
                                <b>Diagnosis:</b>
                                <p>{prescription?.diseaseName || 'N/A'}</p>
                            </div>
                            <div>
                                <b>Schedule:</b>
                                <div className={cx('schedule')}>
                                    <div>
                                        <label htmlFor="startingDate">Date</label>
                                        <input
                                            type="date"
                                            id="startingDate"
                                            name="day"
                                            value={schedule?.day || ''}
                                            onChange={handleInputChange}
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="startingTime">Starting time</label>
                                        <input
                                            type="time"
                                            id="startingTime"
                                            name="startingTime"
                                            value={schedule?.startingTime || ''}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="endingTime">Ending time</label>
                                        <input
                                            type="time"
                                            id="endingTime"
                                            name="endingTime"
                                            value={schedule?.endingTime || ''}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <b>Notice: </b>The patient is requested to return for a re-examination on the specified
                                date and time or earlier if there are any abnormal symptoms. The re-examination should
                                be conducted within 10 working days from the date of this appointment, unless otherwise
                                specified.
                            </div>
                        </div>

                        <button type="submit" className={cx('submit-btn')} disabled={loadingBtnSave}>
                            {loadingBtnSave ? (
                                <SyncLoader size={10} color="#ffffff" />
                            ) : (
                                'Save re-examination appointment form'
                            )}
                        </button>
                    </>
                )}
            </form>
        </div>
    );
};

ReExaminationAppointmentEdit.propTypes = {
    appointment: PropTypes.object.isRequired,
    prescription: PropTypes.object,
    schedule: PropTypes.object.isRequired,
    setSchedule: PropTypes.func.isRequired,
};

export default ReExaminationAppointmentEdit;
