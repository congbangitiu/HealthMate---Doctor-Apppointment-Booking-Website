import { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './ExaminationFormView.module.scss';
import { PropTypes } from 'prop-types';
import { TbDownload } from 'react-icons/tb';
import Logo from '../../../assets/images/logo.png';
import Watermark from '../../../assets/images/watermark30.png';
import formatDate from '../../../utils/date-time/formatDate';
import SyncLoader from 'react-spinners/SyncLoader';
import { Image } from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import { BASE_URL, token } from '../../../../config';
import Loader from '../../../components/Loader/Loader';
import { FaCircleExclamation } from 'react-icons/fa6';
import { generateAndDownloadPDF, generatePDFBlob } from '../../../utils/file/handlePDF';
import { useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import translateOrganName from '../../../utils/translation/translateOrganName';
import capitalizeFirstLetter from '../../../utils/text/capitalizeFirstLetter';
import translateGender from '../../../utils/translation/translateGender';

const cx = classNames.bind(styles);

const ExaminationFormView = ({ appointment, examination, onPDFUploadSuccess }) => {
    const { t: tMedicalRecords } = useTranslation('medicalRecords');
    const { t: tExaminationForm } = useTranslation('examinationForm');
    const isMobile = useMediaQuery('(max-width:768px)');
    const [loadingBtn, setLoadingBtn] = useState(false);
    const [loading, setLoading] = useState(false);

    // Download PDF to system when user click on download button
    const handleDownloadPDF = async () => {
        try {
            await generateAndDownloadPDF(
                'examination',
                `HEALTHMATE - EXAMINATION FORM - ${appointment?.user?.fullname}`,
                setLoadingBtn,
            );
        } catch (error) {
            console.error('Error downloading PDF:', error);
        }
    };

    // Upload PDF to Cloudinary and save the link to the backend
    useEffect(() => {
        if (!examination || examination?.pdfInfo?.url) {
            setLoading(false);
            return;
        }

        const handleUploadPDF = async () => {
            // Set loading state to true to show loading indicator
            setLoading(true);

            try {
                // 1. Use the generatePDFBlob function to create a PDF blob from the examination element
                const pdfBlob = await generatePDFBlob('examination');

                // 2. Upload to Cloudinary
                const formData = new FormData();
                formData.append('file', pdfBlob, `examination_${appointment._id}.pdf`);
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
                const saveRes = await fetch(`${BASE_URL}/examinations/${examination?._id}/save-pdf-link`, {
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
    }, [examination?._id]);

    return (
        <>
            {loading ? (
                <Loader />
            ) : (
                <div className={cx('container')}>
                    {!examination && (
                        <div className={cx('pending-noti')}>
                            <FaCircleExclamation className={cx('icon')} />
                            {tExaminationForm('pendingNoticeForDoctor')}
                        </div>
                    )}
                    <div id="examination" className={cx('examination')}>
                        <div>
                            <div className={cx('brand')}>
                                <img src={Logo} alt="" />
                                <div>
                                    <h4>HEALTHMATE</h4>
                                    <p>Your Wellness - Our Priority</p>
                                </div>
                            </div>
                            {examination?.pdfInfo?.url && (
                                <div className={cx('qr-code')}>
                                    <QRCodeSVG value={examination?.pdfInfo?.url} size={isMobile ? 45 : 60} />
                                </div>
                            )}
                        </div>
                        <h1>{tExaminationForm('title')}</h1>
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
                        </div>
                        {examination && (
                            <>
                                <div className={cx('check-up')}>
                                    <span>
                                        <b>{tExaminationForm('checkup.chiefComplaint')}:</b>
                                        <p>{examination?.chiefComplaint}</p>
                                    </span>
                                    <span>
                                        <b>{tExaminationForm('checkup.clinicalIndications')}:</b>
                                        <p>{examination?.clinicalIndications}</p>
                                    </span>
                                    <span>
                                        <b>{tExaminationForm('checkup.ultrasoundRequest')}:</b>
                                        <p>
                                            {examination?.ultrasoundRequest
                                                ?.map((item) => translateOrganName(item, tExaminationForm))
                                                .join(', ')}
                                        </p>
                                    </span>
                                </div>
                                <h2>{tExaminationForm('ultrasoundResults.title')}</h2>
                                <div className={cx('ultrasound-photos')}>
                                    <Image.PreviewGroup>
                                        {examination.ultrasoundPhotos?.map((photo, index) => (
                                            <Image key={index} width={isMobile ? 170 : 160} height={120} src={photo} />
                                        ))}
                                    </Image.PreviewGroup>
                                </div>
                                <div className={cx('ultrasound-results')}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>{tExaminationForm('ultrasoundResults.organ')}</th>
                                                <th>{tExaminationForm('ultrasoundResults.result')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(examination.ultrasoundResults || '').map(
                                                ([organ, result], index) => (
                                                    <tr key={index}>
                                                        <td>{translateOrganName(organ, tExaminationForm)}</td>
                                                        <td>{result}</td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <p className={cx('conclusion')}>
                                    <b>{tExaminationForm('conclusion')}: </b>
                                    {examination?.conclusion}
                                </p>
                                <div className={cx('confirmation')}>
                                    <div>
                                        <h4>
                                            HealthMate
                                            {examination.updatedAt && ', ' + formatDate(examination.updatedAt)}
                                        </h4>
                                        <span>
                                            <img src={Watermark} alt="" />
                                            <img src={appointment?.doctor?.signature} alt="" />
                                        </span>
                                        <p>{appointment?.doctor?.fullname}</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {examination && (
                        <button onClick={handleDownloadPDF}>
                            {loadingBtn ? (
                                <SyncLoader size={10} color="#ffffff" />
                            ) : (
                                <p>
                                    {tExaminationForm('button.download')} <TbDownload className={cx('icon')} />
                                </p>
                            )}
                        </button>
                    )}
                </div>
            )}
        </>
    );
};

ExaminationFormView.propTypes = {
    appointment: PropTypes.object,
    examination: PropTypes.object,
    onPDFUploadSuccess: PropTypes.func,
};

export default ExaminationFormView;
