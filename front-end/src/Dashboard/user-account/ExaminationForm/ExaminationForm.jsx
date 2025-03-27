import { useState } from 'react';
import { useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ExaminationForm.module.scss';
import { PropTypes } from 'prop-types';
import { TbDownload } from 'react-icons/tb';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Logo from '../../../assets/images/logo.png';
import Watermark from '../../../assets/images/watermark30.png';
import formatDate from '../../../utils/formatDate';
import SyncLoader from 'react-spinners/SyncLoader';
import Loader from '../../../components/Loader/Loader';
import ErrorSign from '../../../components/Error/Error';
import { Image } from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import { BASE_URL } from '../../../../config';
import useFetchData from '../../../hooks/useFetchData';

const cx = classNames.bind(styles);

const ExaminationForm = ({ appointment }) => {
    const { id } = useParams();
    const [loadingBtn, setLoadingBtn] = useState(false);
    const { data: examination, loading, error } = useFetchData(`${BASE_URL}/examinations/${id}`);

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

    return (
        <>
            {loading ? (
                <Loader />
            ) : error ? (
                <ErrorSign />
            ) : (
                <div className={cx('container')}>
                    <div id="examination" className={cx('examination')}>
                        <div>
                            <div className={cx('brand')}>
                                <img src={Logo} alt="" />
                                <div>
                                    <h4>HEALTHMATE</h4>
                                    <p>Your Wellness - Our Priority</p>
                                </div>
                            </div>
                            {examination.updatedAt && (
                                <div className={cx('qr-code')}>
                                    <QRCodeSVG value={`${BASE_URL}/examinations/${appointment?._id}/pdf`} size={60} />
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
                        <div className={cx('examination')}>
                            <span>
                                <b>Chief Complaint:</b>
                                <p>{examination?.chiefComplaint}</p>
                            </span>
                            <span>
                                <b>Clinical Indications:</b>
                                <p>{examination?.clinicalIndications}</p>
                            </span>
                            <span>
                                <b>Ultrasound Request:</b>
                                <p>{examination?.ultrasoundRequest?.join(', ')}</p>
                            </span>
                        </div>
                        <h2>Ultrasound Results</h2>
                        <div className={cx('ultrasound-photos')}>
                            <Image.PreviewGroup>
                                {examination?.ultrasoundPhotos?.map((photo, index) => (
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
                                    {Object.entries(examination?.ultrasoundResults || '').map(
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
                                <h4>HealthMate{examination?.updatedAt && ', ' + formatDate(examination?.updatedAt)}</h4>
                                <span>
                                    <img src={Watermark} alt="" />
                                    <img src={appointment?.doctor?.signature} alt="" />
                                </span>
                                <p>{appointment?.doctor?.fullname}</p>
                            </div>
                        </div>
                    </div>

                    <button onClick={handleDownloadPDF}>
                        {loadingBtn ? (
                            <SyncLoader size={10} color="#ffffff" />
                        ) : (
                            <p>
                                Download to PDF <TbDownload className={cx('icon')} />
                            </p>
                        )}
                    </button>
                </div>
            )}
        </>
    );
};

ExaminationForm.propTypes = {
    appointment: PropTypes.object,
};

export default ExaminationForm;
