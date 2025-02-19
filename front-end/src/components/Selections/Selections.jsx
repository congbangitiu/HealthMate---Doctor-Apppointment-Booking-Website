import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import Select from 'react-select';
import styles from './Selections.module.scss';

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
    appointmentsOptions,
    hidePatient,
    hideDoctor,
    justify,
}) => {
    const customStyles = {
        control: (provided) => ({
            ...provided,
            border: '2px solid var(--primaryColor)',
            borderRadius: '5px',
            boxShadow: 'none',
            width: '250px',
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

    return (
        <div className={cx('container')} style={{ justifyContent: justify }}>
            {doctorsOptions && setSelectedDoctor && (
                <div className={cx('selection', { hide: hideDoctor })}>
                    <h4>Doctor</h4>
                    <Select
                        options={doctorsOptions}
                        styles={customStyles}
                        placeholder={doctorsOptions.length > 0 ? doctorsOptions[0].label : 'Select a doctor'}
                        value={selectedDoctor}
                        onChange={setSelectedDoctor}
                    />
                </div>
            )}

            {patientsOptions && setSelectedPatient && (
                <div className={cx('selection', { hide: hidePatient })}>
                    <h4>Patient</h4>
                    <Select
                        options={patientsOptions}
                        styles={customStyles}
                        placeholder={patientsOptions.length > 0 ? patientsOptions[0].label : 'Select a patient'}
                        value={selectedPatient}
                        onChange={setSelectedPatient}
                    />
                </div>
            )}

            <div className={cx('selection')}>
                <h4>Status</h4>
                <Select
                    options={appointmentsOptions}
                    styles={customStyles}
                    placeholder={appointmentsOptions[0].label}
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
    appointmentsOptions: PropTypes.array.isRequired,

    hidePatient: PropTypes.bool,
    hideDoctor: PropTypes.bool,
    justify: PropTypes.string,
};

Selections.defaultProps = {
    doctorsOptions: [],
    patientsOptions: [],
    hidePatient: false,
    hideDoctor: false,
};

export default Selections;
