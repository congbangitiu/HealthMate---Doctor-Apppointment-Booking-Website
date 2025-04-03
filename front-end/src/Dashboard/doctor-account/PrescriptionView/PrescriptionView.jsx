import { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './PrescriptionView.module.scss';
import Logo from '../../../assets/images/logo.png';
import Watermark from '../../../assets/images/watermark30.png';
import { TbDownload } from 'react-icons/tb';
import formatDate from '../../../utils/formatDate';
import SyncLoader from 'react-spinners/SyncLoader';
import { BASE_URL, token } from '../../../../config';
import { PropTypes } from 'prop-types';
import Loader from '../../../components/Loader/Loader';
import { QRCodeSVG } from 'qrcode.react';
import { FaCircleExclamation } from 'react-icons/fa6';
import { generateAndDownloadPDF, generatePDFBlob } from '../../../utils/handlePDF';

const cx = classNames.bind(styles);

const PrescriptionView = ({ appointment, prescription, onPDFUploadSuccess }) => {
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
                            You haven’t completed the prescription for this appointment!
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
                                    <QRCodeSVG value={prescription?.pdfInfo?.url} size={60} />
                                </div>
                            )}
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
                                    <b>Phone number:</b> 0{appointment?.user?.phone}
                                </p>
                            </span>
                            {prescription && (
                                <>
                                    <p>
                                        <b>Diagnosis:</b> {prescription?.diseaseName}
                                    </p>
                                    <div className={cx('medications')}>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>No.</th>
                                                    <th>Name of Medicine</th>
                                                    <th>Quantity Per Time</th>
                                                    <th>Time(s) Per Day</th>
                                                    <th>Time(s) of Day</th>
                                                    <th>Meal Relation</th>
                                                    <th>Total Units</th>
                                                    <th>Dosage Form</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {prescription?.medications?.map((medication, index) => (
                                                    <tr key={index}>
                                                        <td>{index + 1}</td>
                                                        <td>{medication.name}</td>
                                                        <td>{medication.dosage?.quantityPerTime}</td>
                                                        <td>{medication.dosage?.timesPerDay}</td>
                                                        <td>{medication.dosage?.timeOfDay.join(', ')}</td>
                                                        <td>{medication.dosage?.mealRelation}</td>
                                                        <td>{medication.dosage?.totalUnits}</td>
                                                        <td>{medication.dosage?.dosageForm}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <h4>
                                            <b>Total types of medications:</b> {prescription?.medications?.length}
                                        </h4>
                                    </div>
                                    <p>
                                        <b>Doctor Advice: </b>
                                        {prescription?.doctorAdvice}
                                    </p>
                                    <div className={cx('notes')}>
                                        <b>Important Notes:</b>
                                        <ul>
                                            <li>This prescription is valid for one-time dispensing only</li>
                                            <li>
                                                Return for re-examination when medication is finished or if no
                                                improvement
                                            </li>
                                            <li>Kindly bring this prescription for your follow-up consultation</li>
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
