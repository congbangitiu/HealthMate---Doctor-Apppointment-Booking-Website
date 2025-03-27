import { Routes, Route } from 'react-router-dom';

import Home from './../pages/Home/Home';
import Services from './../pages/Services/Services';
import Login from './../pages/Login/Login';
import Register from './../pages/Register/Register';
import Contact from './../pages/Contact/Contact';
import DoctorList from './../pages/Doctors/DoctorList/DoctorList';
import DoctorDetails from './../pages/Doctors/DoctorDetails/DoctorDetails';
import ServiceDetails from '../pages/ServiceDetails/ServiceDetails';
import MyAccount from '../Dashboard/user-account/MyAccount/MyAccount';
import Dashboard from '../Dashboard/doctor-account/Dashboard/Dashboard';
import CheckoutSucess from '../pages/CheckoutSuccess/CheckoutSuccess';
import ProtectedRoute from './ProtectedRoute';
import CompleteSignUp from '../pages/CompleteSignUp/CompleteSignUp';
import PrescriptionPatient from '../Dashboard/user-account/Prescription/Prescription';
import MedicalRecordsDoctor from '../Dashboard/doctor-account/MedicalRecords/MedicalRecords';
import Management from '../Dashboard/admin-account/Management/Management';
import Chat from '../pages/Chat/Chat';
import ContentChat from '../components/ContentChat/ContentChat';

const Routers = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/doctors" element={<DoctorList />} />
            <Route path="/doctors/:id" element={<DoctorDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:id" element={<ServiceDetails />} />
            <Route path="/checkout-success" element={<CheckoutSucess />} />
            <Route path="/chats" element={<Chat />} />
            <Route path="/chats/:id" element={<ContentChat />} />
            <Route
                path="/users/profile/me"
                element={
                    <ProtectedRoute allowedRoles={['patient']}>
                        <MyAccount />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/users/appointments/my-appointments/:id"
                element={
                    <ProtectedRoute allowedRoles={['patient', 'admin']}>
                        <PrescriptionPatient />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/doctors/profile/me"
                element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/doctors/appointments/my-appointments/:id"
                element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                        <MedicalRecordsDoctor />
                    </ProtectedRoute>
                }
            />
            <Route path="/complete-sign-up" element={<CompleteSignUp />} />

            <Route
                path="/admins/management"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <Management />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
};

export default Routers;
