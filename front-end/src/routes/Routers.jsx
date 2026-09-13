import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './ProtectedRoute';
import Loader from '../components/Loader/Loader';

const Home = lazy(() => import('./../pages/Home/Home'));
const Services = lazy(() => import('./../pages/Services/Services'));
const Login = lazy(() => import('./../pages/Login/Login'));
const Register = lazy(() => import('./../pages/Register/Register'));
const ForgotPassword = lazy(() => import('./../pages/ForgotPassword/ForgotPassword'));
const Contact = lazy(() => import('./../pages/Contact/Contact'));
const Specialties = lazy(() => import('./../pages/Specialties/Specialties'));
const SpecialtyDetails = lazy(() => import('../pages/SpecialtyDetails/SpecialtyDetails'));
const DoctorList = lazy(() => import('./../pages/Doctors/DoctorList/DoctorList'));
const DoctorDetails = lazy(() => import('./../pages/Doctors/DoctorDetails/DoctorDetails'));
const ServiceDetails = lazy(() => import('../pages/ServiceDetails/ServiceDetails'));
const MyAccount = lazy(() => import('../Dashboard/user-account/MyAccount/MyAccount'));
const Dashboard = lazy(() => import('../Dashboard/doctor-account/Dashboard/Dashboard'));
const CheckoutSuccess = lazy(() => import('../pages/CheckoutSuccess/CheckoutSuccess'));
const CompleteSignUp = lazy(() => import('../pages/CompleteSignUp/CompleteSignUp'));
const MedicalRecordsPatient = lazy(() => import('../Dashboard/user-account/MedicalRecords/MedicalRecords'));
const MedicalRecordsDoctor = lazy(() => import('../Dashboard/doctor-account/MedicalRecords/MedicalRecords'));
const Management = lazy(() => import('../Dashboard/admin-account/Management/Management'));
const Chat = lazy(() => import('../pages/Chat/Chat'));

const Routers = () => {
    return (
        <Suspense fallback={<Loader iconSize={15} />}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                <Route path="/doctors" element={<DoctorList />} />
                <Route path="/doctors/:id" element={<DoctorDetails />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/services" element={<Services />} />
                <Route path="/specialties" element={<Specialties />} />
                <Route path="/specialties/:id" element={<SpecialtyDetails />} />
                <Route path="/services/:id" element={<ServiceDetails />} />
                <Route path="/checkout-success" element={<CheckoutSuccess />} />
                <Route path="/chats" element={<Chat />} />
                <Route path="/chats/:id" element={<Chat />} />
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
                            <MedicalRecordsPatient />
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

                <Route path="/admins/management" element={<Navigate to="/admins/management/dashboard" replace />} />
                <Route
                    path="/admins/management/:tab"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <Management />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Suspense>
    );
};

export default Routers;
