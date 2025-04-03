import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './PrescriptionEdit.module.scss';
import Logo from '../../../assets/images/logo.png';
import Watermark from '../../../assets/images/watermark30.png';
import { FaRegTrashAlt } from 'react-icons/fa';
import SyncLoader from 'react-spinners/SyncLoader';
import formatDate from './../../../utils/formatDate';
import { toast } from 'react-toastify';
import { BASE_URL, token } from '../../../../config';
import { PropTypes } from 'prop-types';
import { useMediaQuery } from '@mui/material';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';

const cx = classNames.bind(styles);

const PrescriptionEdit = ({
    appointment,
    setAppointment,
    diseaseName,
    setDiseaseName,
    doctorAdvice,
    setDoctorAdvice,
    medications,
    setMedications,
    id,
    createdTime,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery('(max-width:768px)');
    const [loadingBtnUploadSign, setLoadingBtnUploadSign] = useState(false);
    const [loadingBtnSavePres, setLoadingBtnSavePres] = useState(false);

    const handleMedicationChange = (index, field, value) => {
        const newMedications = [...medications];
        if (field === 'name') {
            newMedications[index][field] = value;
        } else {
            newMedications[index].dosage[field] = value;
        }
        setMedications(newMedications);
    };

    const addMedication = () => {
        setMedications([
            ...medications,
            {
                name: '',
                dosage: {
                    timesPerDay: 0,
                    quantityPerTime: 0,
                    totalUnits: 0,
                    timeOfDay: [],
                    dosageForm: '',
                    mealRelation: '',
                },
            },
        ]);
    };

    const removeMedication = (index) => {
        setMedications(medications.filter((_, i) => i !== index));
    };

    const handleUploadSignature = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setLoadingBtnUploadSign(true);

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
                setAppointment((prev) => ({ ...prev, doctor: { ...prev.doctor, signature: data.data.signature } }));
            } else {
                throw new Error(data.message);
            }

            setLoadingBtnUploadSign(false);
        } catch (error) {
            toast.error(error.message);
            setLoadingBtnUploadSign(false);
        }
    };

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const submitPrescription = async (e) => {
        e.preventDefault();

        const urlPOST = `${BASE_URL}/prescriptions`;
        const urlPUT = `${BASE_URL}/prescriptions/${id}`;
        const finalUrl = createdTime ? urlPUT : urlPOST;

        const method = createdTime ? 'PUT' : 'POST';
        const action = createdTime ? 'update' : 'create';

        try {
            setLoadingBtnSavePres(true);

            const res = await fetch(finalUrl, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    appointment: id,
                    diseaseName,
                    medications,
                    doctorAdvice,
                    action,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Error saving prescription');
            }

            if (action === 'create') {
                toast.success('Prescription saved successfully!');
            } else {
                toast.success('Prescription updated successfully!');
            }

            // Update booking status to "done"
            const resUpdateBooking = await fetch(`${BASE_URL}/bookings/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    status: 'done',
                }),
            });

            const updateBookingData = await resUpdateBooking.json();
            if (!resUpdateBooking.ok) {
                throw new Error(updateBookingData.message || 'Error updating booking status');
            }

            if (action === 'create') {
                toast.success('Appointment status updated successfully!');
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

    const ITEM_HEIGHT = 48;
    const ITEM_PADDING_TOP = 8;
    const MenuProps = {
        PaperProps: {
            style: {
                maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
                width: 'max-content',
                hover: 'var(--primaryColor)',
            },
        },
    };

    const customStyles = {
        width: !isMobile ? '200px' : '100%',
        minWidth: '200px',
        maxWidth: 'max-content',

        '& .MuiSelect-select': {
            padding: '8px 10px',
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
    };

    const timeOfDayOptions = ['Morning', 'Noon', 'Afternoon'];
    const mealRelationOptions = ['Before meal', 'After meal'];

    const getTimeOfDayStyles = (option, selectedOptions, theme) => {
        const options = selectedOptions || [];
        return {
            fontWeight: options.includes(option)
                ? theme.typography.fontWeightMedium
                : theme.typography.fontWeightRegular,
        };
    };

    const getMealRelationStyles = (option, selectedOption, theme) => {
        return {
            fontWeight:
                selectedOption === option ? theme.typography.fontWeightMedium : theme.typography.fontWeightRegular,
        };
    };

    return (
        <div className={cx('container')}>
            <form className={cx('prescription')} onSubmit={submitPrescription}>
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
                            <b>Phone number:</b> 0{appointment?.user?.phone}
                        </p>
                    </span>
                    <div className={cx('disease')}>
                        <b>Diagnosis:</b>
                        <input
                            type="text"
                            name="diseaseName"
                            value={diseaseName}
                            onChange={(e) => setDiseaseName(e.target.value)}
                            required
                        />
                    </div>
                    <div className={cx('medications')}>
                        {medications.map((medication, index) => (
                            <div key={index} className={cx('medication')}>
                                <div>
                                    <div>
                                        <p>{index + 1}.</p>
                                        <b>Name {isMobile ? ' :' : 'of medicine:'} </b>
                                        <input
                                            type="text"
                                            value={medication.name}
                                            onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <div>
                                            <p>Quality Per Time: </p>
                                            <input
                                                type="number"
                                                value={medication.dosage.quantityPerTime}
                                                onChange={(e) =>
                                                    handleMedicationChange(index, 'quantityPerTime', e.target.value)
                                                }
                                                required
                                            />
                                        </div>
                                        <div>
                                            <p>Time(s) Per Day: </p>
                                            <input
                                                type="number"
                                                value={medication.dosage.timesPerDay}
                                                onChange={(e) =>
                                                    handleMedicationChange(index, 'timesPerDay', e.target.value)
                                                }
                                                required
                                            />
                                        </div>
                                        <div>
                                            <p>Total Units: </p>
                                            <input
                                                type="number"
                                                value={medication.dosage.totalUnits}
                                                onChange={(e) =>
                                                    handleMedicationChange(index, 'totalUnits', e.target.value)
                                                }
                                                required
                                            />
                                        </div>
                                        <div>
                                            <p>Time(s) of Day: </p>
                                            <Select
                                                labelId="demo-multiple-name-label"
                                                id="demo-multiple-name"
                                                multiple
                                                value={medication.dosage.timeOfDay || []}
                                                onChange={(e) => {
                                                    const value =
                                                        typeof e.target.value === 'string'
                                                            ? e.target.value.split(',')
                                                            : e.target.value;
                                                    handleMedicationChange(index, 'timeOfDay', value);
                                                }}
                                                MenuProps={MenuProps}
                                                sx={customStyles}
                                            >
                                                {timeOfDayOptions.map((time) => (
                                                    <MenuItem
                                                        key={time}
                                                        value={time}
                                                        style={getTimeOfDayStyles(
                                                            time,
                                                            medication.dosage.timeOfDay,
                                                            theme,
                                                        )}
                                                        sx={{
                                                            '&:hover': {
                                                                backgroundColor: 'var(--lightGreenColor)',
                                                            },
                                                        }}
                                                    >
                                                        {time}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </div>
                                        <div>
                                            <p>Dosage Form: </p>
                                            <input
                                                type="text"
                                                value={medication.dosage.dosageForm}
                                                onChange={(e) =>
                                                    handleMedicationChange(index, 'dosageForm', e.target.value)
                                                }
                                                required
                                            />
                                        </div>
                                        <div>
                                            <p>Meal Relation: </p>
                                            <Select
                                                labelId="demo-multiple-name-label"
                                                id="demo-multiple-name"
                                                value={medication.dosage.mealRelation}
                                                onChange={(e) =>
                                                    handleMedicationChange(index, 'mealRelation', e.target.value)
                                                }
                                                MenuProps={MenuProps}
                                                sx={customStyles}
                                            >
                                                {mealRelationOptions.map((meal) => (
                                                    <MenuItem
                                                        key={meal}
                                                        value={meal}
                                                        style={getMealRelationStyles(
                                                            meal,
                                                            medication.dosage.mealRelation,
                                                            theme,
                                                        )}
                                                        sx={{
                                                            '&:hover': {
                                                                backgroundColor: 'var(--lightGreenColor)',
                                                            },
                                                        }}
                                                    >
                                                        {meal}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                <div className={cx('delete')} onClick={() => removeMedication(index)}>
                                    <FaRegTrashAlt className={cx('icon')} />
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addMedication}>
                            Add medication
                        </button>
                        <h4>Total types of medication: {medications.length}</h4>
                    </div>
                    <div className={cx('advice')}>
                        <b>Doctor Advice:</b>
                        <textarea
                            type="text"
                            name="advice"
                            rows="3"
                            value={doctorAdvice}
                            onChange={(e) => setDoctorAdvice(e.target.value)}
                        />
                    </div>
                    <div className={cx('notes')}>
                        <b>Important Notes:</b>
                        <ul>
                            <li>This prescription is valid for one-time dispensing only</li>
                            <li>Return for re-examination when medication is finished or if no improvement</li>
                            <li>Kindly bring this prescription for your follow-up consultation</li>
                        </ul>
                    </div>
                </div>
                <div className={cx('confirmation')}>
                    <div>
                        <h4>HealthMate{createdTime && ', ' + formatDate(createdTime)}</h4>
                        <span>
                            <img src={Watermark} alt="" />
                            <img src={appointment?.doctor?.signature} alt="" />
                        </span>
                        <p>{appointment?.doctor?.fullname}</p>
                        <div>
                            <input
                                type="file"
                                name="signature"
                                id="customSignature"
                                accept=".jpg, .png, .jpeg, .webp"
                                onChange={handleUploadSignature}
                            />
                            <label htmlFor="customSignature">
                                {loadingBtnUploadSign ? (
                                    <button>
                                        <SyncLoader size={6} color="#ffffff" />
                                    </button>
                                ) : appointment?.doctor?.signature ? (
                                    'Replace signature'
                                ) : (
                                    'Upload signature'
                                )}
                            </label>
                        </div>
                    </div>
                </div>
                <button type="submit" className={cx('submit-btn')}>
                    {loadingBtnSavePres ? <SyncLoader size={10} color="#ffffff" /> : 'Save prescription'}
                </button>
            </form>
        </div>
    );
};

PrescriptionEdit.propTypes = {
    appointment: PropTypes.object.isRequired,
    setAppointment: PropTypes.func.isRequired,
    diseaseName: PropTypes.string.isRequired,
    setDiseaseName: PropTypes.func.isRequired,
    doctorAdvice: PropTypes.string.isRequired,
    setDoctorAdvice: PropTypes.func.isRequired,
    medications: PropTypes.array.isRequired,
    setMedications: PropTypes.func.isRequired,
    id: PropTypes.string.isRequired,
    createdTime: PropTypes.string,
};

export default PrescriptionEdit;
