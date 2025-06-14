import { useState } from 'react';
import { useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ExaminationForm.module.scss';
import { PropTypes } from 'prop-types';
import { TbDownload } from 'react-icons/tb';
import Logo from '../../../assets/images/logo.png';
import Watermark from '../../../assets/images/watermark30.png';
import formatDate from '../../../utils/date-time/formatDate';
import SyncLoader from 'react-spinners/SyncLoader';
import Loader from '../../../components/Loader/Loader';
import { Image } from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import { BASE_URL } from '../../../../config';
import useFetchData from '../../../hooks/useFetchData';
import { FaCircleExclamation } from 'react-icons/fa6';
import { generateAndDownloadPDF } from '../../../utils/file/handlePDF';
import { useMediaQuery } from '@mui/material';

const cx = classNames.bind(styles);

const ExaminationForm = ({ appointment }) => {
    const { id } = useParams();
    const isMobile = useMediaQuery('(max-width:768px)');
    const [loadingBtn, setLoadingBtn] = useState(false);
    const { data: examination, loading } = useFetchData(`${BASE_URL}/examinations/${id}`);

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

    return (
        <>
            {loading ? (
                <Loader />
            ) : (
                <div className={cx('container')}>
                    {!examination?.createdAt && (
                        <div className={cx('pending-noti')}>
                            <FaCircleExclamation className={cx('icon')} />
                            Dr. {appointment?.doctor?.fullname} is still finalizing your medical report. Please check
                            back later to view the full details.
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
                            {examination.updatedAt && (
                                <div className={cx('qr-code')}>
                                    <QRCodeSVG value={examination?.pdfInfo?.url} size={isMobile ? 45 : 60} />
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
                        {examination.createdAt && (
                            <>
                                <div className={cx('check-up')}>
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
                                            <Image key={index} width={isMobile ? 170 : 160} height={120} src={photo} />
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
                                        <h4>
                                            HealthMate
                                            {examination?.updatedAt && ', ' + formatDate(examination?.updatedAt)}
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

                    {examination.createdAt && (
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

ExaminationForm.propTypes = {
    appointment: PropTypes.object,
};

export default ExaminationForm;
