import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './ExaminationFormEdit.module.scss';
import Watermark from '../../../assets/images/watermark30.png';
import Logo from '../../../assets/images/logo.png';
import { useTheme } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import SyncLoader from 'react-spinners/SyncLoader';
import { BASE_URL, token } from '../../../../config';
import { PropTypes } from 'prop-types';
import { toast } from 'react-toastify';
import formatDate from './../../../utils/formatDate';
import { PlusOutlined } from '@ant-design/icons';
import { Image, Upload } from 'antd';
import { uploadImageToCloudinary } from '../../../utils/uploadCloudinary';

const cx = classNames.bind(styles);

const getBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });

const ExaminationFormEdit = ({
    appointmentId,
    appointment,
    chiefComplaint,
    setChiefComplaint,
    clinicalIndications,
    setClinicalIndications,
    ultrasoundRequest,
    setUltrasoundRequest,
    ultrasoundPhotos,
    setUltrasoundPhotos,
    ultrasoundResults,
    setUltrasoundResults,
    conclusion,
    setConclusion,
    createdTime,
}) => {
    const theme = useTheme();
    const [loadingBtnSavePres, setLoadingBtnSavePres] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [fileList, setFileList] = useState(
        ultrasoundPhotos.map((url, index) => ({
            uid: `-${index}`,
            name: `image-${index}.png`,
            status: 'done',
            url,
        })),
    );

    const ITEM_HEIGHT = 48;
    const ITEM_PADDING_TOP = 8;
    const MenuProps = {
        PaperProps: {
            style: {
                maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
                width: '250px',
            },
        },
    };

    const organs = [
        'Liver',
        'Gallbladder',
        'Pancreas',
        'Right Kidney',
        'Left Kidney',
        'Spleen',
        'Bladder',
        'Abdominal Cavity',
    ];

    const handleSelectChange = (event) => {
        const {
            target: { value },
        } = event;
        setUltrasoundRequest(typeof value === 'string' ? value.split(',') : value);
    };

    const handleResultChange = (organ, value) => {
        setUltrasoundResults((prev) => ({
            ...prev,
            [organ]: value,
        }));
    };

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const customRequest = async ({ file, onSuccess, onError }) => {
        try {
            const data = await uploadImageToCloudinary(file);
            if (data.secure_url) {
                setUltrasoundPhotos((prev) => [...prev, data.secure_url]);
                onSuccess({ secure_url: data.secure_url }, file);
            } else {
                throw new Error('Upload failed: No secure_url returned');
            }
        } catch (error) {
            console.error('Upload error:', error);
            onError(error);
            toast.error('Failed to upload image');
        }
    };

    const handlePreview = async (file) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }
        setPreviewImage(file.url || file.preview);
        setPreviewOpen(true);
    };

    const handleChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
        const updatedPhotos = newFileList
            .filter((file) => file.status === 'done')
            .map((file) => {
                return file.url || file.response?.secure_url;
            })
            .filter(Boolean);
        setUltrasoundPhotos(updatedPhotos);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const urlPOST = `${BASE_URL}/examinations`;
        const urlPUT = `${BASE_URL}/examinations/${appointmentId}`;
        const finalUrl = createdTime ? urlPUT : urlPOST;

        const method = createdTime ? 'PUT' : 'POST';
        const action = createdTime ? 'update' : 'create';

        const formData = {
            appointment: appointmentId,
            chiefComplaint,
            clinicalIndications,
            ultrasoundRequest,
            ultrasoundPhotos,
            ultrasoundResults: ultrasoundRequest.reduce((acc, organ) => {
                acc[organ] = ultrasoundResults[organ] || '';
                return acc;
            }, {}),
            conclusion,
            action,
        };

        try {
            setLoadingBtnSavePres(true);

            const response = await fetch(finalUrl, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success('Examination form saved successfully!');
            } else {
                console.error('Server error:', result.message);
                toast.error(`Error: ${result.message}`);
            }
        } catch (error) {
            toast.error(error.message || 'An error occurred');
        } finally {
            setLoadingBtnSavePres(false);
            window.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
            await delay(2000);
            window.location.reload();
        }
    };

    const getStyles = (organ, ultrasoundRequest, theme) => {
        return {
            fontWeight: ultrasoundRequest.includes(organ)
                ? theme.typography.fontWeightMedium
                : theme.typography.fontWeightRegular,
        };
    };

    const uploadButton = (
        <button style={{ border: 0, background: 'none' }} type="button">
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
        </button>
    );

    return (
        <div className={cx('container')}>
            <form className={cx('examination-form')} onSubmit={handleSubmit}>
                <div className={cx('brand')}>
                    <img src={Logo} alt="" />
                    <div>
                        <h4>HEALTHMATE</h4>
                        <p>Your Wellness - Our Priority</p>
                    </div>
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
                    <div>
                        <b>Chief Complaint:</b>
                        <input
                            type="text"
                            name="Chief Complaint"
                            value={chiefComplaint}
                            onChange={(e) => setChiefComplaint(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <b>Clinical Indications:</b>
                        <input
                            type="text"
                            name="Clinical Indications"
                            value={clinicalIndications}
                            onChange={(e) => setClinicalIndications(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <b>Ultrasound Request:</b>
                        <Select
                            labelId="demo-multiple-name-label"
                            id="demo-multiple-name"
                            multiple
                            value={ultrasoundRequest}
                            onChange={handleSelectChange}
                            MenuProps={MenuProps}
                            sx={{
                                flex: 1,
                                '& .MuiSelect-select': {
                                    padding: '8px 15px',
                                    fontSize: '20px',
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    border: '2px solid var(--primaryColor)',
                                    borderRadius: '5px',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--primaryColor)',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--primaryColor)',
                                },
                            }}
                        >
                            {organs.map((organ) => (
                                <MenuItem key={organ} value={organ} style={getStyles(organ, ultrasoundRequest, theme)}>
                                    {organ}
                                </MenuItem>
                            ))}
                        </Select>
                    </div>
                </div>
                {ultrasoundRequest.length > 0 && (
                    <>
                        <h2>Ultrasound Results</h2>
                        <Upload
                            customRequest={customRequest}
                            listType="picture-card"
                            fileList={fileList}
                            onPreview={handlePreview}
                            onChange={handleChange}
                        >
                            {fileList.length >= 8 ? null : uploadButton}
                        </Upload>
                        {previewImage && (
                            <Image
                                wrapperStyle={{ display: 'none', objectFit: 'contain' }}
                                preview={{
                                    visible: previewOpen,
                                    onVisibleChange: (visible) => setPreviewOpen(visible),
                                    afterOpenChange: (visible) => !visible && setPreviewImage(''),
                                }}
                                src={previewImage}
                            />
                        )}
                        <div className={cx('ultrasound-results')}>
                            {ultrasoundRequest.map((organ) => (
                                <div key={organ}>
                                    <b>{organ}:</b>
                                    <input
                                        type="text"
                                        name={organ}
                                        value={ultrasoundResults[organ] || ''}
                                        onChange={(e) => handleResultChange(organ, e.target.value)}
                                        required
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}
                <div className={cx('conclusion')}>
                    <b>Conclusion:</b>
                    <textarea
                        name="Conclusion"
                        value={conclusion}
                        onChange={(e) => setConclusion(e.target.value)}
                        required
                    />
                </div>
                <div className={cx('confirmation')}>
                    <div>
                        <h4>HealthMate{createdTime && ', ' + formatDate(createdTime)}</h4>
                        <span>
                            <img src={Watermark} alt="" />
                            <img src={appointment?.doctor?.signature} alt="" />
                        </span>
                        <p>John Smith</p>
                        <div>
                            <input
                                type="file"
                                name="signature"
                                id="customSignature"
                                accept=".jpg, .png, .jpeg, .webp"
                                onChange={(e) => console.log(e.target.files[0])}
                            />
                            <label htmlFor="customSignature">Replace signature</label>
                        </div>
                    </div>
                </div>
                <button type="submit" className={cx('submit-btn')}>
                    {loadingBtnSavePres ? <SyncLoader size={10} color="#ffffff" /> : 'Save examination form'}
                </button>
            </form>
        </div>
    );
};

ExaminationFormEdit.propTypes = {
    appointmentId: PropTypes.string.isRequired,
    appointment: PropTypes.object.isRequired,
    chiefComplaint: PropTypes.string.isRequired,
    setChiefComplaint: PropTypes.func.isRequired,
    clinicalIndications: PropTypes.string.isRequired,
    setClinicalIndications: PropTypes.func.isRequired,
    ultrasoundRequest: PropTypes.array.isRequired,
    setUltrasoundRequest: PropTypes.func.isRequired,
    ultrasoundPhotos: PropTypes.array.isRequired,
    setUltrasoundPhotos: PropTypes.func.isRequired,
    ultrasoundResults: PropTypes.object.isRequired,
    setUltrasoundResults: PropTypes.func.isRequired,
    conclusion: PropTypes.string.isRequired,
    setConclusion: PropTypes.func.isRequired,
    createdTime: PropTypes.string,
};

export default ExaminationFormEdit;
