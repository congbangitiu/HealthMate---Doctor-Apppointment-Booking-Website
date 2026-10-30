import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { FiCalendar, FiList } from 'react-icons/fi';
import AppointmentCalendar from './AppointmentCalendar';
import styles from './AppointmentViewSwitcher.module.scss';

const AppointmentViewSwitcher = ({ role, children }) => {
    const { t } = useTranslation('calendar');
    const [params, setParams] = useSearchParams();
    const requested = params.get('appointmentView');
    // Preserve previously shared day/week links; ordinary profile visits open the original list.
    const calendar =
        requested === 'calendar' || (requested !== 'list' && ['day', 'week'].includes(params.get('calView')));

    const switchView = (nextView) =>
        setParams((current) => {
            const next = new URLSearchParams(current);
            next.set('appointmentView', nextView);
            if (nextView === 'calendar' && !['day', 'week'].includes(next.get('calView'))) next.set('calView', 'week');
            return next;
        });

    return (
        <div className={styles.container}>
            {role === 'doctor' && <h1 className={styles.title}>{t('appointmentsDoctor:title')}</h1>}
            <div className={styles.switcher} role="group" aria-label={t('viewMode')}>
                <button type="button" aria-pressed={!calendar} onClick={() => switchView('list')}>
                    <FiList aria-hidden="true" />
                    {t('list')}
                </button>
                <button type="button" aria-pressed={calendar} onClick={() => switchView('calendar')}>
                    <FiCalendar aria-hidden="true" />
                    {t('calendarView')}
                </button>
            </div>
            {calendar ? <AppointmentCalendar role={role} calendarOnly /> : children}
        </div>
    );
};

AppointmentViewSwitcher.propTypes = {
    role: PropTypes.oneOf(['doctor', 'patient']).isRequired,
    children: PropTypes.node.isRequired,
};

export default AppointmentViewSwitcher;
