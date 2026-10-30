import AppointmentViewSwitcher from '../../../components/AppointmentCalendar/AppointmentViewSwitcher';
import MyBookingsList from './MyBookingsList';

export default function MyBookings() {
    return (
        <AppointmentViewSwitcher role="patient">
            <MyBookingsList />
        </AppointmentViewSwitcher>
    );
}
