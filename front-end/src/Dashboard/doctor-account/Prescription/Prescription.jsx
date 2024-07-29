import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Prescription.module.scss';
import Logo from '../../../assets/images/logo.png';
import Watermark from '../../../assets/images/watermark30.png';
import { FaRegTrashAlt } from 'react-icons/fa';
import { BASE_URL, token } from '../../../../config';
import { toast } from 'react-toastify';
import Loader from '../../../components/Loader/Loader';
import ErrorSign from '../../../components/Error/Error';
import SyncLoader from 'react-spinners/SyncLoader';
import formatDate from './../../../utils/formatDate';

const cx = classNames.bind(styles);

const Prescription = () => {
    const { id } = useParams();
    const [appointment, setAppointment] = useState(null);
    const [medications, setMedications] = useState([{ name: '', dosage: { timesPerDay: 0, quantityPerTime: 0 } }]);
    const [diseaseName, setDiseaseName] = useState('');
    const [createdTime, setCreatedTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [loadingBtnUploadSign, setLoadingBtnUploadSign] = useState(false);
    const [loadingBtnSavePres, setLoadingBtnSavePres] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const resAppointment = await fetch(`${BASE_URL}/doctors/appointments/my-appointments/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const appointmentData = await resAppointment.json();

                if (appointmentData.success) {
                    setAppointment(appointmentData.data);
                } else {
                    toast.error(appointmentData.message || 'Error fetching appointment data');
                    setLoading(false);
                    return;
                }

                const resPrescription = await fetch(`${BASE_URL}/prescriptions/${id}`);
                const prescriptionData = await resPrescription.json();

                if (prescriptionData.success) {
                    setMedications(prescriptionData.data.medications);
                    setDiseaseName(prescriptionData.data.diseaseName);
                    setCreatedTime(prescriptionData.data.updatedAt);
                } else {
                    console.log('Prescription not found, creating a new one.');
                }
                setLoading(false);
            } catch (error) {
                console.error('Fetch error:', error);
                toast.error('Error fetching data');
                setError(true);
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

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
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Error saving prescription');
            }

            toast.success('Prescription saved successfully!');
        } catch (error) {
            toast.error(error.message || 'An error occurred');
        } finally {
            setLoadingBtnSavePres(false);
        }
    };

    return (
        <div className={cx('container')}>
            <div className={cx('application')}>
                <div className={cx('info')}>
                    {loading ? (
                        <Loader />
                    ) : error ? (
                        <ErrorSign errorMessage={error} />
                    ) : (
                        <>
                            <img src={appointment?.user?.photo} alt="" />
                            <h1>{appointment?.user?.fullname}</h1>
                            <p>
                                <b>Email:</b> {appointment?.user?.email}
                            </p>
                            <p>
                                <b>Phone number:</b> {appointment?.user?.phone}
                            </p>
                            {appointment?.user?.dateOfBirth && (
                                <p>
                                    <b>Date of birth:</b> {appointment?.user?.dateOfBirth}
                                </p>
                            )}
                        </>
                    )}
                </div>
                <div className={cx('info')}>
                    {loading ? (
                        <Loader />
                    ) : error ? (
                        <ErrorSign errorMessage={error} />
                    ) : (
                        <>
                            <img src={appointment?.doctor?.photo} alt="" />
                            <h1>Dr. {appointment?.doctor?.fullname}</h1>
                            <p>
                                <b>Email:</b> {appointment?.doctor?.email}
                            </p>
                            <p>
                                <b>Phone number:</b> {appointment?.doctor?.phone}
                            </p>
                        </>
                    )}
                </div>
            </div>

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
                        <p>
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

export default Prescription;
