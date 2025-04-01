import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './ReExaminationAppointment.module.scss';
import Logo from '../../../assets/images/logo.png';
import Watermark from '../../../assets/images/watermark30.png';
import { TbDownload } from 'react-icons/tb';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import formatDate from '../../../utils/formatDate';
import convertTime from '../../../utils/convertTime';
import SyncLoader from 'react-spinners/SyncLoader';
import { PropTypes } from 'prop-types';
import useFetchData from '../../../hooks/useFetchData';
import { BASE_URL } from '../../../../config';
import Loader from '../../../components/Loader/Loader';
import ErrorSign from '../../../components/Error/Error';
import { QRCodeSVG } from 'qrcode.react';

const cx = classNames.bind(styles);

const ReExaminationAppointment = ({ appointment }) => {
    const [loadingBtn, setLoadingBtn] = useState(false);
    const { data: prescription, loading, error } = useFetchData(`${BASE_URL}/prescriptions/${appointment._id}`);

    const handleDownloadPDF = async () => {
        setLoadingBtn(true);

        const input = document.getElementById('re-examination');
        // Specify the id of the element you want to convert to PDF
        html2canvas(input, {
            useCORS: true, // This option helps to include external images
            onclone: (clonedDoc) => {
                clonedDoc.getElementById('re-examination').style.display = 'block';
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

            pdf.save(`HEALTHMATE - RE-EXAMINATION FORM - ${appointment?.user?.fullname}`);

            setLoadingBtn(false);
        });
    };

    return (
        <>
            {loading ? (
                <Loader />
            ) : error ? (
                <ErrorSign errorMessage="Examination form not found!" />
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
                                    <QRCodeSVG value={appointment.nextAppointment?.pdfInfo?.url} size={60} />
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
                        {appointment.status === 'done' && appointment.nextAppointment.timeSlot && (
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
                                                <td>{formatDate(appointment.nextAppointment.timeSlot?.day)}</td>
                                                <td>
                                                    {convertTime(appointment.nextAppointment.timeSlot?.startingTime)}
                                                </td>
                                                <td>{convertTime(appointment.nextAppointment.timeSlot?.endingTime)}</td>
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

                    {appointment.status === 'done' && appointment.nextAppointment.timeSlot && (
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

ReExaminationAppointment.propTypes = {
    appointment: PropTypes.object,
};

export default ReExaminationAppointment;
