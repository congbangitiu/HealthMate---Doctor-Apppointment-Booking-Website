import AppointmentViewSwitcher from '../../../components/AppointmentCalendar/AppointmentViewSwitcher';
import AppointmentsList from './AppointmentsList';

export default function Appointments() {
    return (
        <AppointmentViewSwitcher role="doctor">
            <AppointmentsList />
        </AppointmentViewSwitcher>
    );
}
