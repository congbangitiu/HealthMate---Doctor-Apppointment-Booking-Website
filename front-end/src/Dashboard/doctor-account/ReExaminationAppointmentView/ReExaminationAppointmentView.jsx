import { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './ReExaminationAppointmentView.module.scss';
import Logo from '../../../assets/images/logo.png';
import Watermark from '../../../assets/images/watermark30.png';
import { TbDownload } from 'react-icons/tb';
import formatDate from '../../../utils/date-time/formatDate';
import convertTime from '../../../utils/date-time/convertTime';
import SyncLoader from 'react-spinners/SyncLoader';
import { PropTypes } from 'prop-types';
import { BASE_URL, token } from '../../../../config';
import { QRCodeSVG } from 'qrcode.react';
import Loader from '../../../components/Loader/Loader';
import { generateAndDownloadPDF, generatePDFBlob } from '../../../utils/file/handlePDF';
import { useMediaQuery } from '@mui/material';

const cx = classNames.bind(styles);

const ReExaminationAppointmentView = ({ appointment, prescription, onPDFUploadSuccess }) => {
    const isMobile = useMediaQuery('(max-width:768px)');
    const [loadingBtn, setLoadingBtn] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleDownloadPDF = async () => {
        try {
            await generateAndDownloadPDF(
                're-examination',
                `HEALTHMATE - RE-EXAMINATION FORM - ${appointment?.user?.fullname}`,
                setLoadingBtn,
            );
        } catch (error) {
            console.error('Error downloading PDF:', error);
        }
    };

    useEffect(() => {
        if (!appointment.nextAppointment || appointment.nextAppointment?.pdfInfo?.url) {
            setLoading(false);
            return;
        }

        const handleUploadPDF = async () => {
            // Set loading state to true to show loading indicator
            setLoading(true);

            try {
                // 1. Use the generatePDFBlob function to create a PDF blob from the re-examination element
                const pdfBlob = await generatePDFBlob('re-examination');

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
                const saveRes = await fetch(`${BASE_URL}/bookings/${appointment?._id}/save-pdf-link`, {
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
    }, [appointment?._id]);

    return (
        <>
            {loading ? (
                <Loader />
            ) : (
                <div className={cx('container')}>
                    <div id="re-examination" className={cx('re-examination')}>
                        <div>
                            <div className={cx('brand')}>
                                <img src={Logo} alt="" />
                                <div>
                                    <h4>HEALTHMATE</h4>
                                    <p>Your Wellness - Our Priority</p>
                                </div>
                            </div>
                            {appointment.nextAppointment?.pdfInfo?.url && (
                                <div className={cx('qr-code')}>
                                    <QRCodeSVG
                                        value={appointment.nextAppointment?.pdfInfo?.url}
                                        size={isMobile ? 45 : 60}
                                    />
                                </div>
                            )}
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
                        {appointment.status === 'done' && appointment.nextAppointment?.timeSlot && (
                            <>
                                <div className={cx('notice')}>
                                    <div>
                                        <b>Diagnosis:</b>
                                        <p>{prescription?.diseaseName || 'N/A'}</p>
                                    </div>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Starting time</th>
                                                <th>Ending time</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>{formatDate(appointment.nextAppointment?.timeSlot?.day)}</td>
                                                <td>
                                                    {convertTime(appointment.nextAppointment?.timeSlot?.startingTime)}
                                                </td>
                                                <td>{convertTime(appointment.nextAppointment?.timeSlot?.endingTime)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <div>
                                        <b>Notice: </b>The patient is requested to return for a re-examination on the
                                        specified date and time or earlier if there are any abnormal symptoms. The
                                        re-examination should be conducted within 10 working days from the date of this
                                        appointment, unless otherwise specified.
                                    </div>
                                </div>
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
                            </>
                        )}
                    </div>

                    {appointment.status === 'done' && appointment.nextAppointment?.timeSlot && (
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

ReExaminationAppointmentView.propTypes = {
    appointment: PropTypes.object,
    prescription: PropTypes.object,
    onPDFUploadSuccess: PropTypes.func,
};

export default ReExaminationAppointmentView;
