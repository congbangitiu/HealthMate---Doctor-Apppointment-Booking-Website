import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Prescription.module.scss';
import Logo from '../../../assets/images/logo.png';
import Watermark from '../../../assets/images/watermark30.png';
import { BASE_URL } from '../../../../config';
import useFetchData from '../../../hooks/useFetchData';
import Loader from '../../../components/Loader/Loader';
import formatDate from '../../../utils/date-time/formatDate';
import { TbDownload } from 'react-icons/tb';
import SyncLoader from 'react-spinners/SyncLoader';
import { FaCircleExclamation } from 'react-icons/fa6';
import { QRCodeSVG } from 'qrcode.react';
import { generateAndDownloadPDF } from '../../../utils/file/handlePDF';
import { useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import capitalizeFirstLetter from '../../../utils/text/capitalizeFirstLetter';
import translateDosageForm from '../../../utils/translation/translateDosageForm';
import translateTimeOfDay from '../../../utils/translation/translateTimeOfDay';
import translateMealRelation from '../../../utils/translation/translateMealRelation';
import translateGender from '../../../utils/translation/translateGender';

const cx = classNames.bind(styles);

const Prescription = () => {
    const { t: tMedicalRecords } = useTranslation('medicalRecords');
    const { t: tPrescription } = useTranslation('prescription');
    const isMobile = useMediaQuery('(max-width:768px)');
    const { id: appointmentId } = useParams();
    const { data: appointment, loading } = useFetchData(
        `${BASE_URL}/users/appointments/my-appointments/${appointmentId}`,
    );
    const { data: prescription } = useFetchData(`${BASE_URL}/prescriptions/${appointmentId}`);
    const [loadingBtn, setLoadingBtn] = useState(false);

    const handleDownloadPDF = async () => {
        try {
            await generateAndDownloadPDF(
                'prescription',
                `HEALTHMATE - PRESCRIPTION - ${appointment?.user?.fullname}`,
                setLoadingBtn,
            );
        } catch (error) {
            console.error('Error downloading PDF:', error);
        }
    };

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    return (
        <>
            {loading ? (
                <Loader />
            ) : (
                <div className={cx('container')}>
                    {!prescription?.createdAt && (
                        <div className={cx('pending-noti')}>
                            <FaCircleExclamation className={cx('icon')} />
                            {tPrescription('pendingMessage', { name: appointment?.doctor?.fullname })}
                        </div>
                    )}
                    <div id="prescription" className={cx('prescription')}>
                        <div>
                            <div className={cx('brand')}>
                                <img src={Logo} alt="" />
                                <div>
                                    <h4>HEALTHMATE</h4>
                                    <p>Your Wellness - Our Priority</p>
                                </div>
                            </div>
                            {prescription?.pdfInfo?.url && (
                                <div className={cx('qr-code')}>
                                    <QRCodeSVG value={prescription?.pdfInfo?.url} size={isMobile ? 45 : 60} />
                                </div>
                            )}
                        </div>
                        <h1>{tPrescription('title')}</h1>
                        <div className={cx('patient-info')}>
                            <p>
                                <b>{tMedicalRecords('patient.fullname')}:</b> {appointment?.user?.fullname}
                            </p>
                            <span>
                                <p>
                                    <b>{tMedicalRecords('patient.dob')}:</b> {appointment?.user?.dateOfBirth}
                                </p>
                                <p>
                                    <b>{tMedicalRecords('patient.genderLabel')}:</b>{' '}
                                    {capitalizeFirstLetter(translateGender(appointment?.user?.gender, tMedicalRecords))}
                                </p>
                            </span>
                            <span>
                                <p>
                                    <b>{tMedicalRecords('patient.address')}:</b> {appointment?.user?.address}
                                </p>
                                <p>
                                    <b>{tMedicalRecords('patient.phone')}:</b> 0{appointment?.user?.phone}
                                </p>
                            </span>

                            {prescription?.createdAt && (
                                <>
                                    <p>
                                        <b>{tPrescription('disease')}:</b> {prescription?.diseaseName}
                                    </p>
                                    <div className={cx('medications')}>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>{tPrescription('table.no')}</th>
                                                    <th>{tPrescription('table.medicine')}</th>
                                                    <th>{tPrescription('table.quantity')}</th>
                                                    <th>{tPrescription('table.timesPerDay')}</th>
                                                    <th>{tPrescription('table.timeOfDay')}</th>
                                                    <th>{tPrescription('table.mealRelation')}</th>
                                                    <th>{tPrescription('table.totalUnits')}</th>
                                                    <th>{tPrescription('table.dosageForm')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {prescription?.medications?.map((medication, index) => (
                                                    <tr key={index}>
                                                        <td>{index + 1}</td>
                                                        <td>{medication.name}</td>
                                                        <td>{medication.dosage?.quantityPerTime}</td>
                                                        <td>{medication.dosage?.timesPerDay}</td>
                                                        <td>
                                                            {translateTimeOfDay(
                                                                medication.dosage?.timeOfDay.join(', '),
                                                                tPrescription,
                                                            )}
                                                        </td>
                                                        <td>
                                                            {translateMealRelation(
                                                                medication.dosage?.mealRelation,
                                                                tPrescription,
                                                            )}
                                                        </td>
                                                        <td>{medication.dosage?.totalUnits}</td>
                                                        <td>
                                                            {translateDosageForm(
                                                                medication.dosage?.dosageForm,
                                                                tPrescription,
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <h4>
                                        <b>{tPrescription('totalTypes')}:</b> {prescription?.medications?.length}
                                    </h4>
                                    <p>
                                        <b>{tPrescription('doctorAdvice')}:</b> {prescription?.doctorAdvice}
                                    </p>

                                    <div className={cx('notes')}>
                                        <b>{tPrescription('notesTitle')}:</b>
                                        <ul>
                                            {tPrescription('notes', { returnObjects: true }).map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </>
                            )}
                        </div>

                        {prescription?.createdAt && (
                            <div className={cx('confirmation')}>
                                <div>
                                    <h4>HealthMate, {formatDate(prescription?.updatedAt)}</h4>
                                    <span>
                                        <img src={Watermark} alt="" />
                                        <img src={appointment?.doctor?.signature} alt="" />
                                    </span>
                                    <p>{appointment?.doctor?.fullname}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {prescription?.createdAt && (
                        <button onClick={handleDownloadPDF}>
                            {loadingBtn ? (
                                <SyncLoader size={10} color="#ffffff" />
                            ) : (
                                <p>
                                    {tPrescription('button.download')} <TbDownload className={cx('icon')} />
                                </p>
                            )}
                        </button>
                    )}
                </div>
            )}
        </>
    );
};

export default Prescription;
