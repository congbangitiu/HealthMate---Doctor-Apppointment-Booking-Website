import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './ExaminationForm.module.scss';
import ExaminationFormEdit from '../ExaminationFormEdit/ExaminationFormEdit';
import ExaminationFormView from '../ExaminationFormView/ExaminationFormView';
import { BASE_URL, token } from '../../../../config';
import { toast } from 'react-toastify';
import Loader from '../../../components/Loader/Loader';
import ErrorSign from '../../../components/Error/Error';
import ToggleButton from '../../../components/ToggleButton/ToggleButton';

const cx = classNames.bind(styles);

const ExaminationForm = () => {
    const { id } = useParams();
    const [toggle, setToggle] = useState(false);
    const [appointment, setAppointment] = useState(null);
    const [examination, setExamination] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [chiefComplaint, setChiefComplaint] = useState('');
    const [clinicalIndications, setClinicalIndications] = useState('');
    const [ultrasoundRequest, setUltrasoundRequest] = useState([]);
    const [ultrasoundPhotos, setUltrasoundPhotos] = useState([]);
    const [ultrasoundResults, setUltrasoundResults] = useState({
        Liver: '',
        Gallbladder: '',
        Pancreas: '',
        'Right Kidney': '',
        'Left Kidney': '',
        Spleen: '',
        Bladder: '',
        'Abdominal Cavity': '',
    });
    const [conclusion, setConclusion] = useState('');
    const [isSigned, setIsSigned] = useState(false);
    const [createdTime, setCreatedTime] = useState('');

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

                const resExamination = await fetch(`${BASE_URL}/examinations/${id}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                const examinationData = await resExamination.json();

                if (examinationData.success) {
                    const exam = examinationData.data;
                    setExamination(exam);
                    setChiefComplaint(exam.chiefComplaint || '');
                    setClinicalIndications(exam.clinicalIndications || '');
                    setUltrasoundPhotos(exam.ultrasoundPhotos || []);
                    setUltrasoundRequest(exam.ultrasoundRequest || []);
                    setUltrasoundResults((prev) => ({
                        ...prev,
                        ...exam.ultrasoundResults,
                    }));
                    setConclusion(exam.conclusion || '');
                    setIsSigned(exam.isSigned);
                    setCreatedTime(exam.updatedAt || '');
                } else {
                    console.log('Examination not found, creating a new one.');
                }
            } catch (error) {
                console.error('Fetch error:', error);
                toast.error('Error fetching data');
                setError(true);
            } finally {
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
                <ErrorSign errorMessage="Examination form not found!" />
            ) : !toggle ? (
                <ExaminationFormEdit
                    appointmentId={id}
                    appointment={appointment}
                    setAppointment={setAppointment}
                    chiefComplaint={chiefComplaint}
                    setChiefComplaint={setChiefComplaint}
                    clinicalIndications={clinicalIndications}
                    setClinicalIndications={setClinicalIndications}
                    ultrasoundRequest={ultrasoundRequest}
                    setUltrasoundRequest={setUltrasoundRequest}
                    ultrasoundPhotos={ultrasoundPhotos}
                    setUltrasoundPhotos={setUltrasoundPhotos}
                    ultrasoundResults={ultrasoundResults}
                    setUltrasoundResults={setUltrasoundResults}
                    conclusion={conclusion}
                    setConclusion={setConclusion}
                    isSigned={isSigned}
                    setIsSigned={setIsSigned}
                    createdTime={createdTime}
                />
            ) : (
                <ExaminationFormView
                    appointment={appointment}
                    examination={examination}
                    onPDFUploadSuccess={(pdfInfo) => {
                        setExamination((prev) => ({ ...prev, pdfInfo }));
                    }}
                />
            )}
        </div>
    );
};

ExaminationForm.propTypes = {
    appointment: PropTypes.object.isRequired,
};

export default ExaminationForm;
