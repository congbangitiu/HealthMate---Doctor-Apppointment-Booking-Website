// Synthetic fixtures only. This page is used for local browser verification, not the app router.
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { authContext } from '../../src/context/AuthContext';
import AppointmentCalendar from '../../src/components/AppointmentCalendar/AppointmentCalendar';
import MyAccount from '../../src/Dashboard/user-account/MyAccount/MyAccount';
import Dashboard from '../../src/Dashboard/doctor-account/Dashboard/Dashboard';
import { clinicToday, addDays } from '../../src/components/AppointmentCalendar/calendarUtils';
import '../../src/utils/services/i18n';
import '../../src/GlobalStyle.css';
import '../../src/index.css';

const day = addDays(clinicToday(), 1);
const role = new URLSearchParams(location.search).get('role') || 'doctor';
const integrated = new URLSearchParams(location.search).has('integrated');
const doctors = [
    { _id: 'doctor-1', fullname: 'Nguyễn Minh Anh', email: 'doctor@example.test', phone: '0900000001' },
    { _id: 'doctor-2', fullname: 'Trần Hoàng Nam', email: 'doctor2@example.test' },
];
let appointments = ['08:00', '09:00', '10:00', '14:00', '15:30'].map((time, index) => ({
    _id: `booking-${index}`,
    doctor: doctors[index % 2],
    user: {
        _id: `patient-${index}`,
        fullname: ['Lê Thanh Hà', 'Phạm Quốc Bảo', 'Võ Ngọc Mai', 'Trương Minh Đức', 'Đỗ Thảo Vy'][index],
        phone: '0900000000',
        email: 'patient@example.test',
    },
    timeSlot: {
        day: addDays(day, index % 3),
        startingTime: time,
        endingTime: `${time.slice(0, 2) === '15' ? '16' : time.slice(0, 2)}:${time.endsWith('30') ? '00' : '30'}`,
    },
    status: index === 3 ? 'done' : index === 4 ? 'cancelled' : 'pending',
    scheduleVersion: 0,
    createdAt: new Date().toISOString(),
    scheduleHistory: [],
    statusHistory: [],
}));
const slots = ['08:30', '09:30', '10:30', '14:30'].flatMap((time) =>
    Array.from({ length: 3 }, (_, index) => ({
        day: addDays(day, index),
        startingTime: time,
        endingTime: `${String(Number(time.slice(0, 2)) + 1).padStart(2, '0')}:00`,
    })),
);
window.__calendarRequests = [];
window.fetch = async (url, options = {}) => {
    window.__calendarRequests.push({ url, method: options.method || 'GET', body: options.body });
    if (options.method === 'PUT') {
        const id = url.split('/').at(-2);
        const body = JSON.parse(options.body);
        appointments = appointments.map((item) =>
            item._id === id
                ? {
                      ...item,
                      timeSlot: body.timeSlot || item.timeSlot,
                      status: body.status || item.status,
                      scheduleVersion: item.scheduleVersion + 1,
                  }
                : item,
        );
        return { ok: true, json: async () => ({ data: appointments.find((item) => item._id === id) }) };
    }
    const profile = {
        _id: 'doctor-1',
        fullname: 'Nguyễn Minh Anh',
        username: 'minhanh',
        email: 'preview@example.test',
        phone: '0900000000',
        gender: 'female',
        role,
        isApproved: 'approved',
        qualifications: [],
        experiences: [],
        appointments,
        timeSlots: slots,
    };
    return {
        ok: true,
        json: async () => ({
            data: url.includes('/profile/me') ? profile : url.includes('availability') ? slots : appointments,
        }),
    };
};
createRoot(document.getElementById('root')).render(
    <authContext.Provider value={{ token: 'synthetic-preview', user: { _id: 'doctor-1' }, role }}>
        <MemoryRouter initialEntries={[`/?tab=appointments&calDate=${day}&calView=week`]}>
            {integrated ? (
                role === 'doctor' ? (
                    <Dashboard />
                ) : (
                    <MyAccount />
                )
            ) : (
                <main style={{ maxWidth: 1100, margin: '30px auto', padding: 12, fontFamily: 'Arial, sans-serif' }}>
                    <AppointmentCalendar role={role} />
                </main>
            )}
        </MemoryRouter>
    </authContext.Provider>,
);
