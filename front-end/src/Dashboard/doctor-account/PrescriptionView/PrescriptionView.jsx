import { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './PrescriptionView.module.scss';
import Logo from '../../../assets/images/logo.png';
import Watermark from '../../../assets/images/watermark30.png';
import { TbDownload } from 'react-icons/tb';
import formatDate from '../../../utils/date-time/formatDate';
import SyncLoader from 'react-spinners/SyncLoader';
import { BASE_URL, token } from '../../../../config';
import { PropTypes } from 'prop-types';
import Loader from '../../../components/Loader/Loader';
import { QRCodeSVG } from 'qrcode.react';
import { FaCircleExclamation } from 'react-icons/fa6';
import { generateAndDownloadPDF, generatePDFBlob } from '../../../utils/file/handlePDF';
import { useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import capitalizeFirstLetter from '../../../utils/text/capitalizeFirstLetter';
import translateDosageForm from '../../../utils/translation/translateDosageForm';
import translateTimeOfDay from '../../../utils/translation/translateTimeOfDay';
import translateMealRelation from '../../../utils/translation/translateMealRelation';
import translateGender from '../../../utils/translation/translateGender';

const cx = classNames.bind(styles);

const PrescriptionView = ({ appointment, prescription, onPDFUploadSuccess }) => {
    const { t: tMedicalRecords } = useTranslation('medicalRecords');
    const { t: tPrescription } = useTranslation('prescription');
    const isMobile = useMediaQuery('(max-width:768px)');
    const [loadingBtn, setLoadingBtn] = useState(false);
    const [loading, setLoading] = useState(false);

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

    // Upload PDF to Cloudinary and save the link to the backend
    useEffect(() => {
        if (!prescription || prescription.pdfInfo?.url) {
            setLoading(false);
            return;
        }

        const handleUploadPDF = async () => {
            // Set loading state to true to show loading indicator
            setLoading(true);

            try {
                // 1. Use the generatePDFBlob function to create a PDF blob from the prescription element
                const pdfBlob = await generatePDFBlob('prescription');

                // 2. Upload to Cloudinary
                const formData = new FormData();
                formData.append('file', pdfBlob, `prescription_${appointment._id}.pdf`);
                formData.append('upload_preset', import.meta.env.VITE_UPLOAD_PRESET);
                formData.append('cloud_name', import.meta.env.VITE_CLOUD_NAME);

                const cloudinaryRes = await fetch(
                    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUD_NAME}/raw/upload`,
                    { method: 'POST', body: formData },
                );

                if (!cloudinaryRes.ok) {
                    const errorData = await cloudinaryRes.json();
                    throw new Error(errorData.message || 'Cloudinary upload failed');
                }

                const cloudinaryData = await cloudinaryRes.json();

                // 3. Save PDF link to backend
                const saveRes = await fetch(`${BASE_URL}/prescriptions/${prescription?._id}/save-pdf-link`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        pdfUrl: cloudinaryData.secure_url,
                        publicId: cloudinaryData.public_id,
                    }),
                });

                if (saveRes.ok) {
                    await saveRes.json();

                    // Call the pdf upload success callback
                    onPDFUploadSuccess({
                        url: cloudinaryData.secure_url,
                        publicId: cloudinaryData.public_id,
                        createdAt: new Date().toISOString(),
                    });
                }

                setLoading(false);
            } catch (error) {
                console.error('PDF generation error:', error);
            } finally {
                setLoadingBtn(false);
            }
        };

        handleUploadPDF();
    }, [prescription?._id]);

    return (
        <>
            {loading ? (
                <Loader />
            ) : (
                <div className={cx('container')}>
                    {!prescription && (
                        <div className={cx('pending-noti')}>
                            <FaCircleExclamation className={cx('icon')} />
                            {tPrescription('pendingNoticeForDoctor')}
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
                            {prescription && (
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
                        {prescription && (
                            <div className={cx('confirmation')}>
                                <div>
                                    <h4>
                                        HealthMate
                                        {prescription?.updatedAt && ', ' + formatDate(prescription?.updatedAt)}
                                    </h4>
                                    <span>
                                        <img src={Watermark} alt="" />
                                        <img src={appointment?.doctor?.signature} alt="" />
                                    </span>
                                    <p>{appointment?.doctor?.fullname}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {prescription && (
                        <button onClick={handleDownloadPDF}>
                            {loadingBtn ? (
                                <SyncLoader size={10} color="#ffffff" />
                            ) : (
                                <p>
                                    Download to PDF <TbDownload className={cx('icon')} />
                                </p>
                            )}
                        </button>
                    )}
                </div>
            )}
        </>
    );
};

PrescriptionView.propTypes = {
    appointment: PropTypes.object,
    prescription: PropTypes.object,
    onPDFUploadSuccess: PropTypes.func,
};

export default PrescriptionView;
