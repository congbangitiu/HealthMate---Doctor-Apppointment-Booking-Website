import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './ProfileSetting.module.scss';
import { FaRegTrashAlt } from 'react-icons/fa';
import { MdOutlineModeEditOutline } from 'react-icons/md';
import { LiaSaveSolid } from 'react-icons/lia';
import uploadImageToCloudinary from '../../../utils/uploadCloudinary';
import { BASE_URL, token } from '../../../../config';
import { toast } from 'react-toastify';

const cx = classNames.bind(styles);

const ProfileSetting = ({ doctorData }) => {
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        phone: '',
        bio: '',
        gender: '',
        specialization: '',
        ticketPrice: 0,
        qualifications: [{ startingDate: '', endingDate: '', degree: '', university: '' }],
        experiences: [{ startingDate: '', endingDate: '', position: '', hospital: '' }],
        timeSlots: [{ day: '', startingTime: '', endingTime: '' }],
        about: '',
        photo: null,
    });

    useEffect(() => {
        setFormData({
            fullname: doctorData.fullname || '',
            email: doctorData.email || '',
            phone: doctorData.phone || '',
            bio: doctorData.bio || '',
            gender: doctorData.gender || '',
            specialization: doctorData.specialization || '',
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
        });
    }, [doctorData]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileInputChange = async (e) => {
        const file = e.target.files[0];
        const data = await uploadImageToCloudinary(file);

        setFormData({ ...formData, photo: data?.url });
    };

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const updateProfileHandler = async (e) => {
        e.preventDefault();

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
            await delay(2000);
            window.location.reload();
        } catch (error) {
            toast.error(error.message);
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
            <form action="">
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
                            <label htmlFor="message">Biography</label>
                            <textarea
                                id="message"
                                cols="30"
                                rows="6"
                                placeholder="Write your bio here ..."
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className={cx('upload-photo')}>
                            {formData.photo && <img src={formData.photo} alt="" />}
                            <input
                                type="file"
                                name="photo"
                                id="customFile"
                                accept=".jpg, .png, .jpeg, .webp"
                                onChange={handleFileInputChange}
                            />
                            <label htmlFor="customFile">Upload photo</label>
                            <p>(Notice: 1:1 scale photo)</p>
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
                        <label htmlFor="specialization">Specialization</label>
                        <select
                            name="specialization"
                            id="specialization"
                            value={formData.specialization}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">Select</option>
                            <option value="Surgeon">Surgeon</option>
                            <option value="Neurologist">Neurologist</option>
                            <option value="Dermatologist">Dermatologist</option>
                            <option value="Cardiologist">Cardiologist</option>
                            <option value="Psychiatrist">Psychiatrist</option>
                            <option value="Pulmonologist">Pulmonologist</option>
                            <option value="Rheumatologist">Rheumatologist</option>
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
                </div>

                {/* QUALIFICATION */}
                <h3 className={cx('title', 'other')}>Qualifications</h3>
                <div className={cx('info')}>
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
                <div className={cx('info')}>
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
                <div className={cx('info')}>
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
                <div className={cx('info')}>
                    <textarea
                        id="message"
                        cols="30"
                        rows="6"
                        placeholder="Write more your details ..."
                        name="about"
                        value={formData.about}
                        onChange={handleInputChange}
                    />
                </div>

                <button onClick={updateProfileHandler} className={cx('submit-btn')}>
                    Update profile
                </button>
            </form>
        </div>
    );
};

ProfileSetting.propTypes = {
    doctorData: PropTypes.object.isRequired,
};

export default ProfileSetting;
