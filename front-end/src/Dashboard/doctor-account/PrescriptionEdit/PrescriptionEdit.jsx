import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './PrescriptionEdit.module.scss';
import Logo from '../../../assets/images/logo.png';
import Watermark from '../../../assets/images/watermark30.png';
import { FaRegTrashAlt } from 'react-icons/fa';
import SyncLoader from 'react-spinners/SyncLoader';
import formatDate from './../../../utils/formatDate';
import { toast } from 'react-toastify';
import { BASE_URL, token } from '../../../../config';
import { PropTypes } from 'prop-types';

const cx = classNames.bind(styles);

const PrescriptionEdit = ({
    appointment,
    setAppointment,
    diseaseName,
    setDiseaseName,
    note,
    setNote,
    medications,
    setMedications,
    id,
    createdTime,
}) => {
    const [loadingBtnUploadSign, setLoadingBtnUploadSign] = useState(false);
    const [loadingBtnSavePres, setLoadingBtnSavePres] = useState(false);

    const handleMedicationChange = (index, field, value) => {
        const newMedications = [...medications];
        if (field === 'name') {
            newMedications[index][field] = value;
        } else {
            newMedications[index].dosage[field] = value;
        }
        setMedications(newMedications);
    };

    const addMedication = () => {
        setMedications([...medications, { name: '', dosage: { timesPerDay: 0, quantityPerTime: 0 } }]);
    };

    const removeMedication = (index) => {
        setMedications(medications.filter((_, i) => i !== index));
    };

    const handleUploadSignature = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setLoadingBtnUploadSign(true);

            const formData = new FormData();
            formData.append('signature', file);

            const res = await fetch(`${BASE_URL}/doctors/upload-signature/${appointment.doctor._id}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('Signature uploaded successfully!');
                setAppointment((prev) => ({ ...prev, doctor: { ...prev.doctor, signature: data.data.signature } }));
            } else {
                throw new Error(data.message);
            }

            setLoadingBtnUploadSign(false);
        } catch (error) {
            toast.error(error.message);
            setLoadingBtnUploadSign(false);
        }
    };

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const submitPrescription = async (e) => {
        e.preventDefault();

        const urlPOST = `${BASE_URL}/prescriptions`;
        const urlPUT = `${BASE_URL}/prescriptions/${id}`;
        const finalUrl = createdTime ? urlPUT : urlPOST;

        const method = createdTime ? 'PUT' : 'POST';

        try {
            setLoadingBtnSavePres(true);

            const res = await fetch(finalUrl, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    appointment: id,
                    diseaseName,
                    medications,
                    note,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Error saving prescription');
            }

            toast.success('Prescription saved successfully!');

            // Update booking status to "done"
            const resUpdateBooking = await fetch(`${BASE_URL}/bookings/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    status: 'done',
                }),
            });

            const updateBookingData = await resUpdateBooking.json();
            if (!resUpdateBooking.ok) {
                throw new Error(updateBookingData.message || 'Error updating booking status');
            }

            toast.success('Appointment status updated successfully!');
        } catch (error) {
            toast.error(error.message || 'An error occurred');
        } finally {
            setLoadingBtnSavePres(false);
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
            <form className={cx('prescription')} onSubmit={submitPrescription}>
                <div className={cx('brand')}>
                    <img src={Logo} alt="" />
                    <div>
                        <h4>HEALTHMATE</h4>
                        <p>Your Wellness - Our Priority</p>
                    </div>
                </div>
                <h1>PRESCRIPTION</h1>
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
                            <b>Phone number:</b> {appointment?.user?.phone}
                        </p>
                    </span>
                    <div className={cx('disease')}>
                        <b>Disease:</b>
                        <input
                            type="text"
                            name="diseaseName"
                            value={diseaseName}
                            onChange={(e) => setDiseaseName(e.target.value)}
                            required
                        />
                    </div>
                    <div className={cx('medications')}>
                        {medications.map((medication, index) => (
                            <div key={index} className={cx('medication')}>
                                <div>
                                    <div>
                                        <p>{index + 1}.</p>
                                        <p>Name of medicine: </p>
                                        <input
                                            type="text"
                                            value={medication.name}
                                            onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <p>Take</p>
                                        <input
                                            type="number"
                                            value={medication.dosage.quantityPerTime}
                                            onChange={(e) =>
                                                handleMedicationChange(index, 'quantityPerTime', e.target.value)
                                            }
                                            required
                                        />
                                        <p>tablet(s) </p>
                                        <input
                                            type="number"
                                            value={medication.dosage.timesPerDay}
                                            onChange={(e) =>
                                                handleMedicationChange(index, 'timesPerDay', e.target.value)
                                            }
                                            required
                                        />
                                        <p>time(s) a day</p>
                                    </div>
                                </div>
                                <div className={cx('delete')} onClick={() => removeMedication(index)}>
                                    <FaRegTrashAlt className={cx('icon')} />
                                    <p className={cx('text')}>Delete</p>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addMedication}>
                            Add medication
                        </button>
                        <h4>Total types of medication: {medications.length}</h4>
                    </div>
                    <div className={cx('note')}>
                        <b>Note:</b>
                        <textarea
                            type="text"
                            name="note"
                            rows="3"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                </div>
                <div className={cx('confirmation')}>
                    <div>
                        <h4>HealthMate{createdTime && ', ' + formatDate(createdTime)}</h4>
                        <span>
                            <img src={Watermark} alt="" />
                            <img src={appointment?.doctor?.signature} alt="" />
                        </span>
                        <p>{appointment?.doctor?.fullname}</p>
                        <div>
                            <input
                                type="file"
                                name="signature"
                                id="customSignature"
                                accept=".jpg, .png, .jpeg, .webp"
                                onChange={handleUploadSignature}
                            />
                            <label htmlFor="customSignature">
                                {loadingBtnUploadSign ? (
                                    <button>
                                        <SyncLoader size={10} color="#ffffff" />
                                    </button>
                                ) : appointment?.doctor?.signature ? (
                                    'Replace signature'
                                ) : (
                                    'Upload signature'
                                )}
                            </label>
                        </div>
                    </div>
                </div>
                <button type="submit" className={cx('submit-btn')}>
                    {loadingBtnSavePres ? <SyncLoader size={10} color="#ffffff" /> : 'Save prescription'}
                </button>
            </form>
        </div>
    );
};

PrescriptionEdit.propTypes = {
    appointment: PropTypes.object.isRequired,
    setAppointment: PropTypes.func.isRequired,
    diseaseName: PropTypes.string.isRequired,
    setDiseaseName: PropTypes.func.isRequired,
    note: PropTypes.string.isRequired,
    setNote: PropTypes.func.isRequired,
    medications: PropTypes.array.isRequired,
    setMedications: PropTypes.func.isRequired,
    id: PropTypes.string.isRequired,
    createdTime: PropTypes.string,
};

export default PrescriptionEdit;
