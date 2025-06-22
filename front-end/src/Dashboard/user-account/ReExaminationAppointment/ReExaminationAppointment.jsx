import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './ReExaminationAppointment.module.scss';
import Logo from '../../../assets/images/logo.png';
import Watermark from '../../../assets/images/watermark30.png';
import { TbDownload } from 'react-icons/tb';
import formatDate from '../../../utils/date-time/formatDate';
import convertTime from '../../../utils/date-time/convertTime';
import SyncLoader from 'react-spinners/SyncLoader';
import { PropTypes } from 'prop-types';
import useFetchData from '../../../hooks/useFetchData';
import { BASE_URL } from '../../../../config';
import Loader from '../../../components/Loader/Loader';
import ErrorSign from '../../../components/Error/Error';
import { QRCodeSVG } from 'qrcode.react';
import { generateAndDownloadPDF } from '../../../utils/file/handlePDF';
import { useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import translateGender from '../../../utils/translation/translateGender';
import capitalizeFirstLetter from '../../../utils/text/capitalizeFirstLetter';

const cx = classNames.bind(styles);

const ReExaminationAppointment = ({ appointment }) => {
    const { t: tMedicalRecords } = useTranslation('medicalRecords');
    const { t: tReExaminationForm } = useTranslation('reExaminationForm');
    const isMobile = useMediaQuery('(max-width:768px)');
    const [loadingBtn, setLoadingBtn] = useState(false);
    const { data: prescription, loading, error } = useFetchData(`${BASE_URL}/prescriptions/${appointment._id}`);

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
                                    <QRCodeSVG
                                        value={appointment.nextAppointment?.pdfInfo?.url}
                                        size={isMobile ? 45 : 60}
                                    />
                                </div>
                            )}
                        </div>
                        <h1>{tReExaminationForm('title')}</h1>
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
                        {appointment.status === 'done' && appointment.nextAppointment.timeSlot && (
                            <>
                                <div className={cx('notice')}>
                                    <div>
                                        <b>{tReExaminationForm('diagnosis')}:</b>
                                        <p>{prescription?.diseaseName || 'N/A'}</p>
                                    </div>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>{tReExaminationForm('table.date')}</th>
                                                <th>{tReExaminationForm('table.start')}</th>
                                                <th>{tReExaminationForm('table.end')}</th>
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
                                        <b>{tReExaminationForm('notice').split(':')[0]}:</b>{' '}
                                        {tReExaminationForm('notice').split(':').slice(1).join(':').trim()}
                                    </div>
                                </div>
                                {/* <div className={cx('confirmation')}>
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
                                </div> */}
                            </>
                        )}
                    </div>

                    {appointment.status === 'done' && appointment.nextAppointment.timeSlot && (
                        <button onClick={handleDownloadPDF}>
                            {loadingBtn ? (
                                <SyncLoader size={10} color="#ffffff" />
                            ) : (
                                <p>
                                    {tReExaminationForm('button.download')} <TbDownload className={cx('icon')} />
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
