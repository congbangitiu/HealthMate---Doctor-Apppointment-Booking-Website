import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Prescription.module.scss';
import { BASE_URL, token } from '../../../../config';
import { toast } from 'react-toastify';
import Loader from '../../../components/Loader/Loader';
import ErrorSign from '../../../components/Error/Error';
import PrescriptionEdit from '../PrescriptionEdit/PrescriptionEdit';
import PrescriptionView from '../PrescriptionView/PrescriptionView';

const cx = classNames.bind(styles);

const Prescription = () => {
    const { id } = useParams();
    const [appointment, setAppointment] = useState(null);
    const [prescription, setPrescription] = useState(null);
    const [medications, setMedications] = useState([{ name: '', dosage: { timesPerDay: 0, quantityPerTime: 0 } }]);
    const [diseaseName, setDiseaseName] = useState('');
    const [note, setNote] = useState('');
    const [createdTime, setCreatedTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [toggle, setToggle] = useState(false);

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

                const resPrescription = await fetch(`${BASE_URL}/prescriptions/${id}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                const prescriptionData = await resPrescription.json();

                if (prescriptionData.success) {
                    setPrescription(prescriptionData.data);
                    setMedications(prescriptionData.data.medications);
                    setDiseaseName(prescriptionData.data.diseaseName);
                    setNote(prescriptionData.data.note);
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

            <div className={cx('prescription')}>
                <div className={cx('toggle')}>
                    {!toggle ? <h4>Edit mode</h4> : <h4>View mode</h4>}
                    <label className={cx('switch')}>
                        <input type="checkbox" checked={toggle} onChange={() => setToggle((prevState) => !prevState)} />
                        <div className={cx('slider')} />
                        <div className={cx('slider-card')}>
                            <div className={cx('slider-card-face', 'slider-card-front')} />
                            <div className={cx('slider-card-face', 'slider-card-back')} />
                        </div>
                    </label>
                </div>

                {!toggle ? (
                    <PrescriptionEdit
                        appointment={appointment}
                        setAppointment={setAppointment}
                        diseaseName={diseaseName}
                        setDiseaseName={setDiseaseName}
                        note={note}
                        setNote={setNote}
                        medications={medications}
                        setMedications={setMedications}
                        id={id}
                        createdTime={createdTime}
                    />
                ) : (
                    <PrescriptionView appointment={appointment} prescription={prescription} />
                )}
            </div>
        </div>
    );
};

export default Prescription;
