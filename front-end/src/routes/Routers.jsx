import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Home from './../pages/Home/Home';
import Services from './../pages/Services/Services';
import Login from './../pages/Login/Login';
import Register from './../pages/Register/Register';
import Contact from './../pages/Contact/Contact';
import DoctorList from './../pages/Doctors/DoctorList/DoctorList';
import DoctorDetails from './../pages/Doctors/DoctorDetails/DoctorDetails';
import MyAccount from '../Dashboard/user-account/MyAccount/MyAccount';
import Dashboard from '../Dashboard/doctor-account/Dashboard/Dashboard';
import ProtectedRoute from './ProtectedRoute';

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
            <Route
                path="/users/profile/me"
                element={
                    <ProtectedRoute allowedRoles={['patient']}>
                        <MyAccount />
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
        </Routes>
    );
};

export default Routers;
