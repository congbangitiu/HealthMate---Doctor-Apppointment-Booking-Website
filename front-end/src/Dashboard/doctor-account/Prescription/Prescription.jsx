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
import ToggleButton from '../../../components/ToggleButton/ToggleButton';

const cx = classNames.bind(styles);

const Prescription = () => {
    const { id } = useParams();
    const [appointment, setAppointment] = useState(null);
    const [prescription, setPrescription] = useState(null);
    const [medications, setMedications] = useState([
        {
            name: '',
            dosage: {
                timesPerDay: 0,
                quantityPerTime: 0,
                totalUnits: 0,
                timeOfDay: ['Morning'],
                dosageForm: '',
                mealRelation: 'After meal',
            },
        },
    ]);
    const [diseaseName, setDiseaseName] = useState('');
    const [doctorAdvice, setDoctorAdvice] = useState('');
    const [isSigned, setIsSigned] = useState(false);
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
                    setDoctorAdvice(prescriptionData.data.doctorAdvice);
                    setCreatedTime(prescriptionData.data.updatedAt);
                    setIsSigned(prescriptionData.data.isSigned);
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
            <ToggleButton toggle={toggle} setToggle={setToggle} />

            {loading ? (
                <Loader />
            ) : error ? (
                <ErrorSign />
            ) : !toggle ? (
                <PrescriptionEdit
                    appointment={appointment}
                    setAppointment={setAppointment}
                    diseaseName={diseaseName}
                    setDiseaseName={setDiseaseName}
                    doctorAdvice={doctorAdvice}
                    setDoctorAdvice={setDoctorAdvice}
                    medications={medications}
                    setMedications={setMedications}
                    id={id}
                    createdTime={createdTime}
                    isSigned={isSigned}
                    setIsSigned={setIsSigned}
                />
            ) : (
                <PrescriptionView
                    appointment={appointment}
                    prescription={prescription}
                    onPDFUploadSuccess={(pdfInfo) => {
                        setPrescription((prev) => ({ ...prev, pdfInfo }));
                    }}
                />
            )}
        </div>
    );
};

export default Prescription;
