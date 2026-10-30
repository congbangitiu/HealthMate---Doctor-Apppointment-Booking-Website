import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import Select from 'react-select';
import { useId } from 'react';
import styles from './Selections.module.scss';
import { useTranslation } from 'react-i18next';
import useResponsive from '../../hooks/useResponsive';
import { getSelectionStyles } from './selectStyles';

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
    hideSchedule = false,
    fitContainer = false,
}) => {
    const selectId = useId();
    const { isTablet, isMobile } = useResponsive();
    const { t } = useTranslation('selections');

    const customStyles = getSelectionStyles(fitContainer ? '100%' : isTablet ? '220px' : isMobile ? '100%' : '250px');

    const scheduleOptions = [
        { value: 'newest', label: t('scheduleOptions.newest') },
        { value: 'oldest', label: t('scheduleOptions.oldest') },
    ];

    return (
        <div className={cx('container', { fitContainer })}>
            {doctorsOptions && setSelectedDoctor && (
                <div className={cx('selection', { hide: hideDoctor })}>
                    <h4 id={`${selectId}-doctor-label`}>{t('doctor')}</h4>
                    <Select
                        instanceId={`${selectId}-doctor`}
                        aria-labelledby={`${selectId}-doctor-label`}
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
                    <h4 id={`${selectId}-patient-label`}>{t('patient')}</h4>
                    <Select
                        instanceId={`${selectId}-patient`}
                        aria-labelledby={`${selectId}-patient-label`}
                        options={patientsOptions}
                        styles={customStyles}
                        placeholder={patientsOptions.length > 0 ? patientsOptions[0].label : t('placeholders.patient')}
                        value={selectedPatient}
                        onChange={setSelectedPatient}
                    />
                </div>
            )}

            {!hideSchedule && (
                <div className={cx('selection')}>
                    <h4 id={`${selectId}-schedule-label`}>{t('schedule')}</h4>
                    <Select
                        instanceId={`${selectId}-schedule`}
                        aria-labelledby={`${selectId}-schedule-label`}
                        options={scheduleOptions}
                        styles={customStyles}
                        placeholder={t('placeholders.schedule')}
                        value={selectedSchedule}
                        onChange={setSelectedSchedule}
                    />
                </div>
            )}

            <div className={cx('selection')}>
                <h4 id={`${selectId}-status-label`}>{t('status')}</h4>
                <Select
                    instanceId={`${selectId}-status`}
                    aria-labelledby={`${selectId}-status-label`}
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
    hideSchedule: PropTypes.bool,
    fitContainer: PropTypes.bool,
};

Selections.defaultProps = {
    doctorsOptions: [],
    patientsOptions: [],
    hidePatient: false,
    hideDoctor: false,
};

export default Selections;
