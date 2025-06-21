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
import { useTranslation } from 'react-i18next';
import translateOrganName from '../../../utils/translation/translateOrganName';
import capitalizeFirstLetter from '../../../utils/text/capitalizeFirstLetter';
import translateGender from '../../../utils/translation/translateGender';

const cx = classNames.bind(styles);

const ExaminationForm = ({ appointment }) => {
    const { t: tMedicalRecords } = useTranslation('medicalRecords');
    const { t: tExaminatioForm, i18n } = useTranslation('examinationForm');
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
                            {tExaminatioForm('pendingMessage', { name: appointment?.doctor?.fullname })}
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
                        <h1>{tExaminatioForm('title')}</h1>
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
                        {examination.createdAt && (
                            <>
                                <div className={cx('check-up')}>
                                    <span>
                                        <b>{tExaminatioForm('checkup.chiefComplaint')}:</b>
                                        <p>{examination?.chiefComplaint}</p>
                                    </span>
                                    <span>
                                        <b>{tExaminatioForm('checkup.clinicalIndications')}:</b>
                                        <p>{examination?.clinicalIndications}</p>
                                    </span>
                                    <span>
                                        <b>{tExaminatioForm('checkup.ultrasoundRequest')}:</b>
                                        <p>
                                            {examination?.ultrasoundRequest
                                                ?.map((item) => translateOrganName(item, i18n))
                                                .join(', ')}
                                        </p>
                                    </span>
                                </div>
                                <h2>{tExaminatioForm('ultrasoundResults.title')}</h2>
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
                                                <th>{tExaminatioForm('ultrasoundResults.organ')}</th>
                                                <th>{tExaminatioForm('ultrasoundResults.result')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(examination?.ultrasoundResults || '').map(
                                                ([organ, result], index) => (
                                                    <tr key={index}>
                                                        <td>{translateOrganName(organ, i18n)}</td>
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
                                    {tExaminatioForm('download')} <TbDownload className={cx('icon')} />
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
