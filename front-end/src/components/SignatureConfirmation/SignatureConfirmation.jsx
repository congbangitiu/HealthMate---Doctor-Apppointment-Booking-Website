import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import Watermark from '../../assets/images/watermark30.png';
import classNames from 'classnames/bind';
import styles from './SignatureConfirmation.module.scss';
import formatDate from '../../utils/formatDate';
import { toast } from 'react-toastify';
import { BASE_URL, token } from '../../../config';
import SyncLoader from 'react-spinners/SyncLoader';

const cx = classNames.bind(styles);

const SignatureConfirmation = ({ createdTime, isSigned, setIsSigned, appointment, setAppointment }) => {
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleUploadSignature = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setLoading(true);

            const formData = new FormData();
            formData.append('signature', file);

            const res = await fetch(`${BASE_URL}/doctors/upload-signature/${appointment.doctor._id}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('Signature uploaded successfully!');
                setAppointment((prev) => ({
                    ...prev,
                    doctor: { ...prev.doctor, signature: data.data.signature },
                }));
                setIsSigned(true);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignClick = () => {
        if (appointment?.doctor?.signature) {
            setIsSigned(true);
        } else {
            fileInputRef.current?.click();
        }
    };

    return (
        <div className={cx('container')}>
            <div className={cx('confirmation')}>
                <h4>HealthMate{createdTime && ', ' + formatDate(createdTime)}</h4>
                <div>
                    <img src={Watermark} alt="" />
                    {isSigned ? (
                        <img src={appointment?.doctor?.signature} alt="Signature" />
                    ) : (
                        <button type="button" onClick={handleSignClick} disabled={loading}>
                            {loading ? <SyncLoader size={8} color="#ffffff" /> : 'Sign'}
                        </button>
                    )}
                </div>
                <p>{appointment?.doctor?.fullname}</p>

                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".jpg, .png, .jpeg, .webp"
                    onChange={handleUploadSignature}
                />
            </div>
        </div>
    );
};

SignatureConfirmation.propTypes = {
    createdTime: PropTypes.string,
    isSigned: PropTypes.bool.isRequired,
    setIsSigned: PropTypes.func.isRequired,
    appointment: PropTypes.object.isRequired,
    setAppointment: PropTypes.func.isRequired,
};

export default SignatureConfirmation;
