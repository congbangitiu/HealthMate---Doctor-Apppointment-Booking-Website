import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Prescription.module.scss';
import Logo from '../../../assets/images/logo.png';
import Watermark from '../../../assets/images/watermark30.png';
import { BASE_URL } from '../../../../config';
import useFetchData from '../../../hooks/useFetchData';
import Loader from '../../../components/Loader/Loader';
import formatDate from '../../../utils/formatDate';
import { TbDownload } from 'react-icons/tb';
import SyncLoader from 'react-spinners/SyncLoader';
import { FaCircleExclamation } from 'react-icons/fa6';
import { QRCodeSVG } from 'qrcode.react';
import { generateAndDownloadPDF } from '../../../utils/handlePDF';

const cx = classNames.bind(styles);

const Prescription = () => {
    const { id: appointmentId } = useParams();
    const { data: appointment, loading } = useFetchData(
        `${BASE_URL}/users/appointments/my-appointments/${appointmentId}`,
    );

    const { data: prescription } = useFetchData(`${BASE_URL}/prescriptions/${appointmentId}`);

    const [loadingBtn, setLoadingBtn] = useState(false);

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

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);

    return (
        <>
            {loading ? (
                <Loader />
            ) : (
                <div className={cx('container')}>
                    {!prescription?.createdAt && (
                        <div className={cx('pending-noti')}>
                            <FaCircleExclamation className={cx('icon')} />
                            Dr. {appointment?.doctor?.fullname} is still finalizing your prescription. Please check back
                            later to view the full details.
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
                                <p>
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
                            {prescription?.createdAt && (
                                <>
                                    <p>
                                        <b>Disease:</b> {prescription?.diseaseName}
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
                        {prescription?.createdAt && (
                            <div className={cx('confirmation')}>
                                <div>
                                    <h4>HealthMate, {formatDate(prescription?.updatedAt)}</h4>
                                    <span>
                                        <img src={Watermark} alt="" />
                                        <img src={appointment?.doctor?.signature} alt="" />
                                    </span>
                                    <p>{appointment?.doctor?.fullname}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {prescription?.createdAt && (
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

export default Prescription;
