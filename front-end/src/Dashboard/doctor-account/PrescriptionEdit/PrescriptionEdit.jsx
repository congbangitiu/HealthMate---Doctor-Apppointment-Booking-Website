import { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './PrescriptionEdit.module.scss';
import Logo from '../../../assets/images/logo.png';
import { FaRegTrashAlt } from 'react-icons/fa';
import SyncLoader from 'react-spinners/SyncLoader';
import { toast } from 'react-toastify';
import { BASE_URL, token } from '../../../../config';
import { PropTypes } from 'prop-types';
import { useTheme, Select, MenuItem, TextField, Autocomplete } from '@mui/material';
import Papa from 'papaparse';
import SignatureConfirmation from '../../../components/SignatureConfirmation/SignatureConfirmation';
import { useTranslation } from 'react-i18next';
import capitalizeFirstLetter from '../../../utils/text/capitalizeFirstLetter';
import translateGender from '../../../utils/translation/translateGender';
import translateDosageForm from '../../../utils/translation/translateDosageForm';
import translateMealRelation from '../../../utils/translation/translateMealRelation';
import translateTimeOfDay from '../../../utils/translation/translateTimeOfDay';

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
    isSigned,
    setIsSigned,
}) => {
    const { t: tMedicalRecords } = useTranslation('medicalRecords');
    const { t: tPrescription } = useTranslation('prescription');
    const theme = useTheme();
    const [loadingBtnSavePres, setLoadingBtnSavePres] = useState(false);
    const [medicineOptions, setMedicineOptions] = useState([]);
    const [customMedications, setCustomMedications] = useState([]);

    useEffect(() => {
        const loadMedicineData = async () => {
            try {
                const response = await fetch('/mock-data/Medicine.csv');
                const csvText = await response.text();

                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    worker: true,
                    complete: (results) => {
                        const data = results.data;

                        const options = data
                            .filter((item) => item.Name && item.Strength && item['Dosage Form'])
                            .map((item) => ({
                                label: `${item.Name} ${item.Strength}`,
                                fullName: `${item.Name} ${item.Strength}`,
                                dosageForm: item['Dosage Form'],
                            }));

                        setMedicineOptions(options);
                    },
                    error: (err) => {
                        console.error('PapaParse error:', err);
                        toast.error('Failed to load medicine data');
                    },
                });
            } catch (err) {
                console.error('Fetch error:', err);
                toast.error('Failed to fetch medicine data');
            }
        };

        loadMedicineData();
    }, []);

    const handleMedicationChange = (index, field, value, selectedOption) => {
        const newMedications = [...medications];
        const newCustomMedications = [...customMedications];

        if (field === 'name') {
            if (selectedOption) {
                // Choose from options
                newMedications[index].name = selectedOption.fullName;
                newMedications[index].dosage.dosageForm = selectedOption.dosageForm;
                newCustomMedications[index] = false;
            } else {
                // Input manually
                newMedications[index].name = value;
                newCustomMedications[index] = true;
            }
        } else {
            newMedications[index].dosage[field] = value;
        }

        setMedications(newMedications);
        setCustomMedications(newCustomMedications);
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
                    timeOfDay: ['Morning'],
                    dosageForm: '',
                    mealRelation: 'After meal',
                },
            },
        ]);
        setCustomMedications([...customMedications, false]);
    };

    const removeMedication = (index) => {
        setMedications(medications.filter((_, i) => i !== index));
        setCustomMedications(customMedications.filter((_, i) => i !== index));
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
                    isSigned,
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
            backgroundColor: selectedOptions.includes(option) ? 'var(--lightGreenColor)' : 'inherit',
        };
    };

    const getMealRelationStyles = (option, selectedOption, theme) => {
        return {
            fontWeight:
                selectedOption === option ? theme.typography.fontWeightMedium : theme.typography.fontWeightRegular,
            backgroundColor: selectedOption?.includes(option) ? 'var(--lightGreenColor)' : 'inherit',
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
                <h1>{tPrescription('title')}</h1>
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
                    <div className={cx('disease')}>
                        <b>{tPrescription('disease')}:</b>
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
                                    <div className={cx('upper-part')}>
                                        <p>{index + 1}.</p>
                                        <b>{tPrescription('table.medicine')} </b>
                                        <Autocomplete
                                            disablePortal
                                            freeSolo
                                            options={medicineOptions}
                                            getOptionLabel={(option) => {
                                                return typeof option === 'string' ? option : option.label || '';
                                            }}
                                            value={
                                                medication.name && {
                                                    label: medication.name,
                                                    fullName: medication.name,
                                                    dosageForm: medication.dosage.dosageForm,
                                                }
                                            }
                                            onChange={(e, value) => {
                                                if (value) {
                                                    // If value is string (user input)
                                                    if (typeof value === 'string') {
                                                        handleMedicationChange(index, 'name', value);
                                                        handleMedicationChange(index, 'dosageForm', ''); // Reset dosage form
                                                    }
                                                    // If value is an object (selected option)
                                                    else {
                                                        handleMedicationChange(index, 'name', value.fullName, value);
                                                    }
                                                } else {
                                                    handleMedicationChange(index, 'name', '');
                                                    handleMedicationChange(index, 'dosageForm', '');
                                                }
                                            }}
                                            onInputChange={(e, newInputValue) => {
                                                // Update the input value
                                                if (
                                                    newInputValue &&
                                                    !medicineOptions.some((opt) => opt.fullName === newInputValue)
                                                ) {
                                                    handleMedicationChange(index, 'name', newInputValue);
                                                }
                                            }}
                                            isOptionEqualToValue={(option, value) => option.fullName === value.fullName}
                                            sx={{ flex: 1 }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    fullWidth
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            height: '50px',
                                                            fontSize: '20px',
                                                            borderRadius: '5px',
                                                            '& fieldset': {
                                                                border: '2px solid var(--primaryColor)',
                                                            },
                                                            '&:hover fieldset': {
                                                                border: '2px solid var(--primaryColor)',
                                                            },
                                                            '&.Mui-focused fieldset': {
                                                                border: '2px solid var(--primaryColor)',
                                                            },
                                                        },
                                                        '& .MuiInputBase-input': {
                                                            padding: '15px',
                                                            fontSize: '20px',
                                                        },
                                                    }}
                                                />
                                            )}
                                            renderOption={(props, option, { selected }) => (
                                                <li
                                                    {...props}
                                                    style={{
                                                        fontWeight: selected ? '500' : 'normal',
                                                        backgroundColor: selected
                                                            ? 'var(--lightGreenColor)'
                                                            : 'inherit',
                                                    }}
                                                >
                                                    {option.label}
                                                </li>
                                            )}
                                            slotProps={{
                                                paper: {
                                                    sx: {
                                                        '& .MuiAutocomplete-option': {
                                                            fontSize: '18px',
                                                            '&:hover': {
                                                                backgroundColor: 'var(--lightGrayColor) !important',
                                                            },
                                                        },
                                                    },
                                                },
                                            }}
                                        />
                                    </div>
                                    <div className={cx('lower-part')}>
                                        <div>
                                            <p>{tPrescription('table.quantity')}: </p>
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
                                            <p>{tPrescription('table.timesPerDay')}: </p>
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
                                            <p>{tPrescription('table.totalUnits')}: </p>
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
                                            <p>{tPrescription('table.timeOfDay')}: </p>
                                            <Select
                                                labelId="demo-multiple-name-label"
                                                id="demo-multiple-name"
                                                multiple
                                                value={medication.dosage.timeOfDay || []}
                                                renderValue={(selected) =>
                                                    selected.map((opt) => tPrescription(`timeOfDay.${opt}`)).join(', ')
                                                }
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
                                                                backgroundColor: 'var(--lightGrayColor) !important',
                                                            },
                                                        }}
                                                    >
                                                        {translateTimeOfDay(time, tPrescription)}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </div>
                                        <div>
                                            <p>{tPrescription('table.dosageForm')}: </p>
                                            <input
                                                type="text"
                                                value={translateDosageForm(medication.dosage.dosageForm, tPrescription)}
                                                onChange={(e) =>
                                                    handleMedicationChange(index, 'dosageForm', e.target.value)
                                                }
                                                readOnly={!customMedications[index]}
                                                style={{
                                                    cursor: customMedications[index] ? 'text' : 'not-allowed',
                                                }}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <p>{tPrescription('table.mealRelation')}: </p>
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
                                                                backgroundColor: 'var(--lightGrayColor) !important',
                                                            },
                                                        }}
                                                    >
                                                        {translateMealRelation(meal, tPrescription)}
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
                        <button type="button" className={cx('add-button')} onClick={addMedication}>
                            {tPrescription('button.add')}
                        </button>
                        <h4>
                            {tPrescription('totalTypes')}: {medications.length}
                        </h4>
                    </div>
                    <div className={cx('advice')}>
                        <b>{tPrescription('doctorAdvice')}:</b>
                        <textarea
                            type="text"
                            name="advice"
                            rows="3"
                            value={doctorAdvice}
                            onChange={(e) => setDoctorAdvice(e.target.value)}
                        />
                    </div>
                    <div className={cx('notes')}>
                        <b>{tPrescription('notesTitle')}:</b>
                        <ul>
                            {tPrescription('notes', { returnObjects: true }).map((item, idx) => (
                                <li key={idx}>{item}</li>
                            ))}
                        </ul>
                    </div>
                </div>
                <SignatureConfirmation
                    createdTime={createdTime}
                    isSigned={isSigned}
                    setIsSigned={setIsSigned}
                    appointment={appointment}
                    setAppointment={setAppointment}
                />
                <button type="submit" className={cx('submit-btn')}>
                    {loadingBtnSavePres ? <SyncLoader size={10} color="#ffffff" /> : tPrescription('button.save')}
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
    isSigned: PropTypes.bool.isRequired,
    setIsSigned: PropTypes.func.isRequired,
};

export default PrescriptionEdit;
