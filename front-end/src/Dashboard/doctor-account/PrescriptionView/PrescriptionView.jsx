import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './PrescriptionView.module.scss';
import Logo from '../../../assets/images/logo.png';
import Watermark from '../../../assets/images/watermark30.png';
import { TbDownload } from 'react-icons/tb';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import formatDate from '../../../utils/formatDate';
import SyncLoader from 'react-spinners/SyncLoader';
import { PropTypes } from 'prop-types';

const cx = classNames.bind(styles);

const PrescriptionView = ({ appointment, prescription }) => {
    const [loadingBtn, setLoadingBtn] = useState(false);

    const handleDownloadPDF = async () => {
        setLoadingBtn(true);

        const input = document.getElementById('prescription');
        // Specify the id of the element you want to convert to PDF
        html2canvas(input, {
            useCORS: true, // This option helps to include external images
            onclone: (clonedDoc) => {
                clonedDoc.getElementById('prescription').style.display = 'block';
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

            pdf.save(`HEALTHMATE - PRESCRIPTION - ${appointment?.user?.fullname}`);

            setLoadingBtn(false);
        });
    };

    return (
        <div className={cx('container')}>
            <div id="prescription" className={cx('prescription')}>
                <div className={cx('brand')}>
                    <img src={Logo} alt="" />
                    <div>
                        <h4>HEALTHMATE</h4>
                        <p>Your Wellness - Our Priority</p>
                    </div>
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
                            <b>Phone number:</b> {appointment?.user?.phone}
                        </p>
                    </span>
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
                                    <th>Times Per Day</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prescription?.medications?.map((medication, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{medication.name}</td>
                                        <td>{medication.dosage?.quantityPerTime}</td>
                                        <td>{medication.dosage?.timesPerDay}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <h4>
                            <b>Total types of medications:</b> {prescription?.medications?.length}
                        </h4>
                    </div>
                    <p>
                        <b>Note: </b>
                        {prescription?.note}
                    </p>
                </div>
                <div className={cx('confirmation')}>
                    <div>
                        <h4>HealthMate, {formatDate(prescription?.updatedAt)}</h4>
                        <span>
                            <img src={Watermark} alt="" />
                            <img src={appointment?.doctor?.signature} alt="" />
                        </span>
                        <p>John Smith</p>
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
    );
};

PrescriptionView.propTypes = {
    appointment: PropTypes.object,
    prescription: PropTypes.object,
};

export default PrescriptionView;
