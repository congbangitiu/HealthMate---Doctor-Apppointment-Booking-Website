import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './ProfileSetting.module.scss';
import { FaRegTrashAlt } from 'react-icons/fa';
import { MdOutlineModeEditOutline, MdFileUpload } from 'react-icons/md';
import { LiaSaveSolid } from 'react-icons/lia';
import { uploadImageToCloudinary } from '../../../utils/uploadCloudinary';
import { BASE_URL, token } from '../../../../config';
import { toast } from 'react-toastify';
import SyncLoader from 'react-spinners/SyncLoader';
import specialties from '../../../assets/data/mock-data/specialties';
import { TextField, Autocomplete } from '@mui/material';

const cx = classNames.bind(styles);

const ProfileSetting = ({ doctorData, isMobile }) => {
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);

    const [loading, setLoading] = useState(false);
    const [errorWordLimit, setErrorWordLimit] = useState('');
    const [loadingAvatar, setLoadingAvatar] = useState(false);
    const [loadingSignature, setLoadingSignature] = useState(false);

    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        phone: '',
        bio: '',
        gender: '',
        specialty: '',
        subspecialty: '',
        ticketPrice: 0,
        qualifications: [{ startingDate: '', endingDate: '', degree: '', university: '' }],
        experiences: [{ startingDate: '', endingDate: '', position: '', hospital: '' }],
        timeSlots: [{ day: '', startingTime: '', endingTime: '' }],
        about: '',
        photo: null,
        signature: null,
    });

    const subspecialtyOptions = specialties.reduce((acc, specialty) => {
        if (specialty.subspecialties) {
            return [...acc, ...specialty.subspecialties.map((subspecialty) => subspecialty.name)];
        }
        return acc;
    }, []);

    useEffect(() => {
        setFormData({
            fullname: doctorData.fullname || '',
            email: doctorData.email || '',
            phone: doctorData.phone || '',
            bio: doctorData.bio || '',
            gender: doctorData.gender || '',
            specialty: doctorData.specialty || '',
            subspecialty: doctorData.subspecialty || '',
            ticketPrice: doctorData.ticketPrice || 0,
            qualifications: doctorData.qualifications.map((qualification) => ({
                startingDate: qualification.startingDate,
                endingDate: qualification.endingDate,
                degree: qualification.degree,
                university: qualification.university,
            })),
            experiences: doctorData.experiences.map((experience) => ({
                startingDate: experience.startingDate,
                endingDate: experience.endingDate,
                position: experience.position,
                hospital: experience.hospital,
            })),
            timeSlots: doctorData.timeSlots.map((timeSlot) => ({
                day: timeSlot.day,
                startingTime: timeSlot.startingTime,
                endingTime: timeSlot.endingTime,
            })),
            about: doctorData.about || '',
            photo: doctorData.photo || '',
            signature: doctorData.signature || '',
        });
    }, [doctorData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'bio') {
            if (value.length > 350) {
                setErrorWordLimit('Maximum 350 characters !!!');
                setFormData({ ...formData, [name]: value.slice(0, 350) });
            } else {
                setErrorWordLimit('');
                setFormData({ ...formData, [name]: value });
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleUploadAvatar = async (e) => {
        setLoadingAvatar(true);
        const file = e.target.files[0];
        const data = await uploadImageToCloudinary(file);

        setFormData({ ...formData, photo: data?.url });
        setLoadingAvatar(false);
    };

    const handleUploadSignature = async (e) => {
        setLoadingSignature(true);
        const file = e.target.files[0];
        const data = await uploadImageToCloudinary(file);

        setFormData({ ...formData, signature: data?.url });
        setLoadingSignature(false);
    };

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const updateProfileHandler = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`${BASE_URL}/doctors/${doctorData._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.message);
            }
            toast.success('Profile updated successfully');
            setLoading(false);
            await delay(2000);
            window.location.reload();
        } catch (error) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    // Resuable functions
    const addItem = (key, item) => {
        setFormData((preFormData) => ({ ...preFormData, [key]: [...preFormData[key], item] }));
    };

    const deleteItem = (key, index) => {
        setFormData((preFormData) => ({
            ...preFormData,
            [key]: preFormData[key].filter((_, i) => i !== index),
        }));
    };

    const handleReusableInputChange = (key, event, index) => {
        const { name, value } = event.target;
        setFormData((preFormData) => {
            const updateItems = [...preFormData[key]];
            updateItems[index][name] = value;
            return { ...preFormData, [key]: updateItems };
        });
    };

    const handleSubspecialtyChange = (event, newValue) => {
        const matchedSpecialty = specialties.find((specialty) =>
            specialty.subspecialties?.some((sub) => sub.name === newValue),
        );

        setFormData({
            ...formData,
            subspecialty: newValue,
            specialty: matchedSpecialty ? matchedSpecialty.name : '',
        });
    };

    // Qualification functions
    const addQualification = (e) => {
        e.preventDefault();
        addItem('qualifications', {
            startingDate: '',
            endingDate: '',
            degree: '',
            university: '',
        });
    };

    const handleQuanlificationChange = (event, index) => {
        handleReusableInputChange('qualifications', event, index);
    };

    const deleteQualification = (e, index) => {
        e.preventDefault();
        deleteItem('qualifications', index);
    };

    // Experience functions
    const addExperience = (e) => {
        e.preventDefault();
        addItem('experiences', {
            startingDate: '',
            endingDate: '',
            position: '',
            hospital: '',
        });
    };

    const handleExperienceChange = (event, index) => {
        handleReusableInputChange('experiences', event, index);
    };

    const deleteExperience = (e, index) => {
        e.preventDefault();
        deleteItem('experiences', index);
    };

    // Time slots functions
    const addTimeSlots = (e) => {
        e.preventDefault();
        addItem('timeSlots', {
            day: '',
            startingTime: '',
            endingTime: '',
        });
    };

    const handleTimeSlotsChange = (event, index) => {
        handleReusableInputChange('timeSlots', event, index);
    };

    const deleteTimeSlots = (e, index) => {
        e.preventDefault();
        deleteItem('timeSlots', index);
    };

    // Edit
    const toggleEditable = (key, index) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            [key]: prevFormData[key].map((item, idx) =>
                idx === index ? { ...item, isEditable: !item.isEditable } : item,
            ),
        }));
    };

    return (
        <div className={cx('container')}>
            {/* PERSONAL INFORMATION  */}
            <h3 className={cx('title')}>Personal Information</h3>
            <div className={cx('upperPart')}>
                <div className={cx('leftPart')}>
                    <div className={cx('info')}>
                        <label htmlFor="fullname">Fullname</label>
                        <input
                            type="text"
                            id="fullname"
                            placeholder="Enter your fullname"
                            value={formData.fullname}
                            name="fullname"
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className={cx('info')}>
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="Email"
                            value={formData.email}
                            name="email"
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className={cx('info')}>
                        <label htmlFor="phone">Phone No.</label>
                        <input
                            type="text"
                            id="phone"
                            placeholder="Enter your phone number"
                            value={formData.phone}
                            name="phone"
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                </div>
                <div className={cx('rightPart')}>
                    <div className={cx('info')}>
                        <span>
                            <label htmlFor="message">Biography</label>
                            {errorWordLimit && <p className={cx('error')}>{errorWordLimit}</p>}
                        </span>
                        <textarea
                            id="message"
                            cols="30"
                            rows="3"
                            placeholder="Write your bio here with a maximum of 50 words"
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className={cx('upload', 'avatar')}>
                        {formData.photo && <img src={formData.photo} alt="" />}
                        <input
                            type="file"
                            name="photo"
                            id="customAvatar"
                            accept=".jpg, .png, .jpeg, .webp"
                            onChange={handleUploadAvatar}
                        />
                        <label htmlFor="customAvatar">
                            {loadingAvatar ? (
                                <SyncLoader size={7} color="#ffffff" />
                            ) : isMobile ? (
                                <MdFileUpload />
                            ) : (
                                'Upload photo'
                            )}
                        </label>
                        <p>(Notice: 1:1 scale photo)</p>
                    </div>
                    <div className={cx('upload', 'signature')}>
                        {formData.signature && <img src={formData.signature} alt="" />}
                        <input
                            type="file"
                            name="signature"
                            id="customSignature"
                            accept=".jpg, .png, .jpeg, .webp"
                            onChange={handleUploadSignature}
                        />
                        <label htmlFor="customSignature">
                            {loadingSignature ? (
                                <SyncLoader size={7} color="#ffffff" />
                            ) : isMobile ? (
                                <MdFileUpload />
                            ) : (
                                'Upload signature'
                            )}
                        </label>
                        <p>(Notice: Remove background )</p>
                    </div>
                </div>
            </div>
            <div className={cx('info', 'selection')}>
                <div className={cx('field')}>
                    <label htmlFor="gender">Gender</label>
                    <select name="gender" id="gender" value={formData.gender} onChange={handleInputChange} required>
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div className={cx('field')}>
                    <label htmlFor="ticketPrice">Ticket price</label>
                    <input
                        type="number"
                        name="ticketPrice"
                        id="ticketPrice"
                        value={formData.ticketPrice}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className={cx('field')}>
                    <label htmlFor="specialty">Specialty</label>
                    <input
                        name="specialty"
                        id="specialty"
                        value={formData.specialty}
                        onChange={handleInputChange}
                        required
                        readOnly
                    />
                </div>
                <div className={cx('field')}>
                    <label htmlFor="subspecialty">Subspecialty</label>
                    <Autocomplete
                        disablePortal
                        options={subspecialtyOptions}
                        value={formData.subspecialty}
                        onChange={handleSubspecialtyChange}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        padding: '5px 10px',
                                        fontSize: '16px',
                                        borderRadius: '5px',
                                        '& fieldset': {
                                            border: '2px solid var(--darkGrayColor)',
                                        },
                                        '&:hover fieldset': {
                                            border: '2px solid var(--darkGrayColor)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            border: '2px solid var(--darkGrayColor)',
                                        },
                                    },
                                    '& .MuiInputBase-input': {
                                        padding: '10px',
                                        fontSize: '16px',
                                    },
                                }}
                            />
                        )}
                        renderOption={(props, option, { selected }) => (
                            <li
                                {...props}
                                style={{
                                    fontWeight: selected ? '500' : 'normal',
                                    backgroundColor: selected ? 'var(--lightGreenColor)' : 'inherit',
                                }}
                            >
                                {option}
                            </li>
                        )}
                        slotProps={{
                            paper: {
                                sx: {
                                    '& .MuiAutocomplete-option': {
                                        fontSize: '16px',
                                        '&:hover': {
                                            backgroundColor: 'var(--lightGrayColor) !important',
                                        },
                                    },
                                },
                            },
                        }}
                    />
                </div>
            </div>

            {/* QUALIFICATION */}
            <h3 className={cx('title', 'other')}>Qualifications</h3>
            <div className={cx('details')}>
                {formData.qualifications?.map((qualification, index) => (
                    <div key={index} className={cx('credentials')}>
                        <div className={cx('credential')}>
                            <label htmlFor="startingDate">Starting date</label>
                            <input
                                className={cx(!qualification.isEditable && 'disabled')}
                                type="date"
                                id="startingDate"
                                value={qualification.startingDate}
                                name="startingDate"
                                onChange={(e) => handleQuanlificationChange(e, index)}
                                disabled={!qualification.isEditable}
                            />
                        </div>
                        <div className={cx('credential')}>
                            <label htmlFor="endingDate">Ending date</label>
                            <input
                                className={cx(!qualification.isEditable && 'disabled')}
                                type="date"
                                id="endingDate"
                                value={qualification.endingDate}
                                name="endingDate"
                                onChange={(e) => handleQuanlificationChange(e, index)}
                                disabled={!qualification.isEditable}
                            />
                        </div>
                        <div className={cx('credential')}>
                            <label htmlFor="degree">Degree</label>
                            <input
                                className={cx(!qualification.isEditable && 'disabled')}
                                type="text"
                                id="degree"
                                value={qualification.degree}
                                name="degree"
                                onChange={(e) => handleQuanlificationChange(e, index)}
                                disabled={!qualification.isEditable}
                            />
                        </div>
                        <div className={cx('credential')}>
                            <label htmlFor="university">University</label>
                            <input
                                className={cx(!qualification.isEditable && 'disabled')}
                                type="text"
                                id="university"
                                value={qualification.university}
                                name="university"
                                onChange={(e) => handleQuanlificationChange(e, index)}
                                disabled={!qualification.isEditable}
                            />
                        </div>
                        <div></div>
                        <div className={cx('modeWrapper')}>
                            <div className={cx('mode')} onClick={() => toggleEditable('qualifications', index)}>
                                {qualification.isEditable ? (
                                    <>
                                        <LiaSaveSolid className={cx('icon')} />
                                        <p className={cx('text')}>Save</p>
                                    </>
                                ) : (
                                    <>
                                        <MdOutlineModeEditOutline className={cx('icon')} />
                                        <p className={cx('text')}>Edit</p>
                                    </>
                                )}
                            </div>
                            <div className={cx('mode')} onClick={(e) => deleteQualification(e, index)}>
                                <FaRegTrashAlt className={cx('icon')} />
                                <p className={cx('text')}>Delete</p>
                            </div>
                        </div>
                    </div>
                ))}
                <button className={cx('add')} onClick={addQualification}>
                    Add qualification
                </button>
            </div>

            {/* EXPERIENCES */}
            <h3 className={cx('title', 'other')}>Experiences</h3>
            <div className={cx('details')}>
                {formData.experiences?.map((experience, index) => (
                    <div key={index} className={cx('credentials')}>
                        <div className={cx('credential')}>
                            <label htmlFor="startingDate">Starting date</label>
                            <input
                                className={cx(!experience.isEditable && 'disabled')}
                                type="date"
                                id="startingDate"
                                value={experience.startingDate}
                                name="startingDate"
                                onChange={(e) => handleExperienceChange(e, index)}
                                disabled={!experience.isEditable}
                            />
                        </div>
                        <div className={cx('credential')}>
                            <label htmlFor="endingDate">Ending date</label>
                            <input
                                className={cx(!experience.isEditable && 'disabled')}
                                type="date"
                                id="endingDate"
                                value={experience.endingDate}
                                name="endingDate"
                                onChange={(e) => handleExperienceChange(e, index)}
                                disabled={!experience.isEditable}
                            />
                        </div>
                        <div className={cx('credential')}>
                            <label htmlFor="position">Position</label>
                            <input
                                className={cx(!experience.isEditable && 'disabled')}
                                type="text"
                                id="position"
                                value={experience.position}
                                name="position"
                                onChange={(e) => handleExperienceChange(e, index)}
                                disabled={!experience.isEditable}
                            />
                        </div>
                        <div className={cx('credential')}>
                            <label htmlFor="hospital">Hospital</label>
                            <input
                                className={cx(!experience.isEditable && 'disabled')}
                                type="text"
                                id="hospital"
                                value={experience.hospital}
                                name="hospital"
                                onChange={(e) => handleExperienceChange(e, index)}
                                disabled={!experience.isEditable}
                            />
                        </div>
                        <div></div>
                        <div className={cx('modeWrapper')}>
                            <div className={cx('mode')} onClick={() => toggleEditable('experiences', index)}>
                                {experience.isEditable ? (
                                    <>
                                        <LiaSaveSolid className={cx('icon')} />
                                        <p className={cx('text')}>Save</p>
                                    </>
                                ) : (
                                    <>
                                        <MdOutlineModeEditOutline className={cx('icon')} />
                                        <p className={cx('text')}>Edit</p>
                                    </>
                                )}
                            </div>
                            <div className={cx('mode')} onClick={(e) => deleteExperience(e, index)}>
                                <FaRegTrashAlt className={cx('icon')} />
                                <p className={cx('text')}>Delete</p>
                            </div>
                        </div>
                    </div>
                ))}
                <button className={cx('add')} onClick={addExperience}>
                    Add experiences
                </button>
            </div>

            {/* TIME SLOTS */}
            <h3 className={cx('title', 'other')}>Time slots</h3>
            <div className={cx('details')}>
                {formData.timeSlots?.map((timeSlot, index) => (
                    <div key={index} className={cx('timeSlots')}>
                        <div className={cx('schedule')}>
                            <div className={cx('credential')}>
                                <label htmlFor="startingDate">Date</label>
                                <input
                                    className={cx(!timeSlot.isEditable && 'disabled')}
                                    type="date"
                                    id="startingDate"
                                    value={timeSlot.day}
                                    name="day"
                                    onChange={(e) => handleTimeSlotsChange(e, index)}
                                    disabled={!timeSlot.isEditable}
                                />
                            </div>
                            <div className={cx('credential')}>
                                <label htmlFor="startingTime">Starting time</label>
                                <input
                                    className={cx(!timeSlot.isEditable && 'disabled')}
                                    type="time"
                                    id="startingTime"
                                    value={timeSlot.startingTime}
                                    name="startingTime"
                                    onChange={(e) => handleTimeSlotsChange(e, index)}
                                    disabled={!timeSlot.isEditable}
                                />
                            </div>
                            <div className={cx('credential')}>
                                <label htmlFor="endingTime">Ending time</label>
                                <input
                                    className={cx(!timeSlot.isEditable && 'disabled')}
                                    type="time"
                                    id="endingTime"
                                    value={timeSlot.endingTime}
                                    name="endingTime"
                                    onChange={(e) => handleTimeSlotsChange(e, index)}
                                    disabled={!timeSlot.isEditable}
                                />
                            </div>
                        </div>
                        <div className={cx('modeWrapper')}>
                            <div className={cx('mode')} onClick={() => toggleEditable('timeSlots', index)}>
                                {timeSlot.isEditable ? (
                                    <>
                                        <LiaSaveSolid className={cx('icon')} />
                                        <p className={cx('text')}>Save</p>
                                    </>
                                ) : (
                                    <>
                                        <MdOutlineModeEditOutline className={cx('icon')} />
                                        <p className={cx('text')}>Edit</p>
                                    </>
                                )}
                            </div>
                            <div className={cx('mode')} onClick={(e) => deleteTimeSlots(e, index)}>
                                <FaRegTrashAlt className={cx('icon')} />
                                <p className={cx('text')}>Delete</p>
                            </div>
                        </div>
                    </div>
                ))}
                <button className={cx('add')} onClick={addTimeSlots}>
                    Add time slots
                </button>
            </div>

            {/* ABOUT */}
            <h3 className={cx('title', 'other')}>About</h3>
            <textarea
                id="message"
                cols="30"
                rows="6"
                placeholder="Write more your details ..."
                name="about"
                value={formData.about}
                onChange={handleInputChange}
            />

            <button onClick={updateProfileHandler} className={cx('submit-btn')}>
                {loading ? <SyncLoader size={10} color="#ffffff" /> : 'Update profile'}
            </button>
        </div>
    );
};

ProfileSetting.propTypes = {
    doctorData: PropTypes.object.isRequired,
    isMobile: PropTypes.bool.isRequired,
};

export default ProfileSetting;
