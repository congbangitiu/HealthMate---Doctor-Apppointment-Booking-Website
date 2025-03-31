import { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './ExaminationFormView.module.scss';
import { PropTypes } from 'prop-types';
import { TbDownload } from 'react-icons/tb';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Logo from '../../../assets/images/logo.png';
import Watermark from '../../../assets/images/watermark30.png';
import formatDate from '../../../utils/formatDate';
import SyncLoader from 'react-spinners/SyncLoader';
import { Image } from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import { BASE_URL, token } from '../../../../config';
import Loader from '../../../components/Loader/Loader';
import { FaCircleExclamation } from 'react-icons/fa6';

const cx = classNames.bind(styles);

const ExaminationFormView = ({ appointment, examination, onPDFUploadSuccess }) => {
    const [loadingBtn, setLoadingBtn] = useState(false);
    const [loading, setLoading] = useState(false);

    // Download PDF to system when user click on download button
    const handleDownloadPDF = async () => {
        setLoadingBtn(true);

        const input = document.getElementById('examination');
        // Specify the id of the element you want to convert to PDF
        html2canvas(input, {
            useCORS: true, // This option helps to include external images
            onclone: (clonedDoc) => {
                clonedDoc.getElementById('examination').style.display = 'block';
            },
        }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const imgWidth = 180; // Adjust the width of the image
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;

            let position = 15; // Adjust this value to move the image down

            pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`HEALTHMATE - EXAMINATION FORM - ${appointment?.user?.fullname}`);

            setLoadingBtn(false);
        });
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
                // 1. Capture the examination form as canvas
                const input = document.getElementById('examination');
                const canvas = await html2canvas(input, {
                    useCORS: true,
                    scale: 1.5, // Reduced from 2 to decrease file size
                    quality: 0.8, // Reduce image quality to shrink PDF size
                    logging: true,
                    allowTaint: true,
                    onclone: (clonedDoc) => {
                        // Make sure the element is visible when cloned
                        clonedDoc.getElementById('examination').style.display = 'block';
                    },
                });

                // 2. Create PDF from canvas
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4'); // Portrait, millimeters, A4 size

                // Calculate PDF dimensions
                const imgWidth = 180; // Fixed width in mm
                const pageHeight = pdf.internal.pageSize.getHeight();
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let heightLeft = imgHeight;
                let position = 15; // Initial Y position

                // Add first page
                pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;

                // Add additional pages if content is longer than one page
                while (heightLeft >= 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                }

                // 3. Prepare for Cloudinary upload
                const pdfBlob = pdf.output('blob');

                // 4. Upload to Cloudinary
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

                // 5. Save PDF link to backend
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
                            You haven’t completed the health examination form for this appointment!
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
                                    <QRCodeSVG value={examination?.pdfInfo?.url} size={60} />
                                </div>
                            )}
                        </div>
                        <h1>EXAMINATION FORM</h1>
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
                        {examination && (
                            <>
                                <div className={cx('examination')}>
                                    <span>
                                        <b>Chief Complaint:</b>
                                        <p>{examination.chiefComplaint}</p>
                                    </span>
                                    <span>
                                        <b>Clinical Indications:</b>
                                        <p>{examination.clinicalIndications}</p>
                                    </span>
                                    <span>
                                        <b>Ultrasound Request:</b>
                                        <p>{examination.ultrasoundRequest.join(', ')}</p>
                                    </span>
                                </div>
                                <h2>Ultrasound Results</h2>
                                <div className={cx('ultrasound-photos')}>
                                    <Image.PreviewGroup>
                                        {examination.ultrasoundPhotos?.map((photo, index) => (
                                            <Image key={index} width={150} height={100} src={photo} />
                                        ))}
                                    </Image.PreviewGroup>
                                </div>
                                <div className={cx('ultrasound-results')}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Organ</th>
                                                <th>Result</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(examination.ultrasoundResults || '').map(
                                                ([organ, result], index) => (
                                                    <tr key={index}>
                                                        <td>{organ}</td>
                                                        <td>{result}</td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
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

ExaminationFormView.propTypes = {
    appointment: PropTypes.object,
    examination: PropTypes.object,
    onPDFUploadSuccess: PropTypes.func,
};

export default ExaminationFormView;
