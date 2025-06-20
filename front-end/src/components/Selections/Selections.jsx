import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import Select from 'react-select';
import styles from './Selections.module.scss';
import { useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const Selections = ({
    selectedDoctor,
    setSelectedDoctor,
    doctorsOptions,
    selectedPatient,
    setSelectedPatient,
    patientsOptions,
    selectedAppointmentStatus,
    setSelectedAppointmentStatus,
    appointmentsStatusOptions,
    selectedSchedule,
    setSelectedSchedule,
    hidePatient,
    hideDoctor,
}) => {
    const isMobile = useMediaQuery('(max-width:768px)');
    const { t } = useTranslation('selections');

    const customStyles = {
        control: (provided) => ({
            ...provided,
            border: '2px solid var(--primaryColor)',
            borderRadius: '5px',
            boxShadow: 'none',
            width: !isMobile ? '250px' : '100%',
            height: '45px',
            display: 'flex',
            alignItems: 'center',
            '&:hover': {
                cursor: 'text',
            },
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected
                ? 'var(--primaryColor)'
                : state.isFocused
                ? 'var(--lightGreenColor)'
                : 'white',
            color: state.isSelected ? 'white' : 'black',
            '&:hover': {
                backgroundColor: 'var(--lightGreenColor)',
            },
        }),
        menu: (provided) => ({
            ...provided,
            zIndex: 9999,
        }),
    };

    const scheduleOptions = [
        { value: 'newest', label: t('scheduleOptions.newest') },
        { value: 'oldest', label: t('scheduleOptions.oldest') },
    ];

    return (
        <div className={cx('container')}>
            {doctorsOptions && setSelectedDoctor && (
                <div className={cx('selection', { hide: hideDoctor })}>
                    <h4>{t('doctor')}</h4>
                    <Select
                        options={doctorsOptions}
                        styles={customStyles}
                        placeholder={doctorsOptions.length > 0 ? doctorsOptions[0].label : t('placeholders.doctor')}
                        value={selectedDoctor}
                        onChange={setSelectedDoctor}
                    />
                </div>
            )}

            {patientsOptions && setSelectedPatient && (
                <div className={cx('selection', { hide: hidePatient })}>
                    <h4>{t('patient')}</h4>
                    <Select
                        options={patientsOptions}
                        styles={customStyles}
                        placeholder={patientsOptions.length > 0 ? patientsOptions[0].label : t('placeholders.patient')}
                        value={selectedPatient}
                        onChange={setSelectedPatient}
                    />
                </div>
            )}

            <div className={cx('selection')}>
                <h4>{t('schedule')}</h4>
                <Select
                    options={scheduleOptions}
                    styles={customStyles}
                    placeholder={t('placeholders.schedule')}
                    value={selectedSchedule}
                    onChange={setSelectedSchedule}
                />
            </div>

            <div className={cx('selection')}>
                <h4>{t('status')}</h4>
                <Select
                    options={appointmentsStatusOptions}
                    styles={customStyles}
                    placeholder={appointmentsStatusOptions?.[0]?.label || t('placeholders.status')}
                    value={selectedAppointmentStatus}
                    onChange={setSelectedAppointmentStatus}
                />
            </div>
        </div>
    );
};

Selections.propTypes = {
    selectedDoctor: PropTypes.object,
    setSelectedDoctor: PropTypes.func,
    doctorsOptions: PropTypes.array,

    selectedPatient: PropTypes.object,
    setSelectedPatient: PropTypes.func,
    patientsOptions: PropTypes.array,

    selectedAppointmentStatus: PropTypes.object.isRequired,
    setSelectedAppointmentStatus: PropTypes.func.isRequired,
    appointmentsStatusOptions: PropTypes.array.isRequired,

    selectedSchedule: PropTypes.object.isRequired,
    setSelectedSchedule: PropTypes.func.isRequired,

    hidePatient: PropTypes.bool,
    hideDoctor: PropTypes.bool,
};

Selections.defaultProps = {
    doctorsOptions: [],
    patientsOptions: [],
    hidePatient: false,
    hideDoctor: false,
};

export default Selections;
