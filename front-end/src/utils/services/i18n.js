import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import homepageEN from '../../locales/en/common/homepage.json';
import homepageVI from '../../locales/vi/common/homepage.json';
import navbarEN from '../../locales/en/common/navbar.json';
import navbarVI from '../../locales/vi/common/navbar.json';
import footerEN from '../../locales/en/common/footer.json';
import footerVI from '../../locales/vi/common/footer.json';
import loginEn from '../../locales/en/common/login.json';
import loginVi from '../../locales/vi/common/login.json';
import registerEn from '../../locales/en/common/register.json';
import registerVi from '../../locales/vi/common/register.json';
import specialtiesEN from '../../locales/en/common/specialties.json';
import specialtiesVI from '../../locales/vi/common/specialties.json';
import specialtyDetailsEN from '../../locales/en/common/specialtyDetails.json';
import specialtyDetailsVI from '../../locales/vi/common/specialtyDetails.json';
import examinationServiceEN from '../../locales/en/common/examinationService.json';
import examinationServiceVI from '../../locales/vi/common/examinationService.json';
import treatmentServiceEN from '../../locales/en/common/treatmentService.json';
import treatmentServiceVI from '../../locales/vi/common/treatmentService.json';
import contactEN from '../../locales/en/common/contact.json';
import contactVI from '../../locales/vi/common/contact.json';
import doctorList from '../../locales/en/common/doctorList.json';
import doctorListVI from '../../locales/vi/common/doctorList.json';
import searchEn from '../../locales/en/common/search.json';
import searchVi from '../../locales/vi/common/search.json';
import notificationEN from '../../locales/en/common/notification.json';
import notificationVI from '../../locales/vi/common/notification.json';
import tabsDoctorEN from '../../locales/en/doctor-profile/tabs.json';
import tabsDoctorVI from '../../locales/vi/doctor-profile/tabs.json';
import aboutDoctorEN from '../../locales/en/doctor-profile/about.json';
import aboutDoctorVI from '../../locales/vi/doctor-profile/about.json';
import dashboarDoctorEN from '../../locales/en/doctor-profile/dashboard.json';
import dashboarDoctorVI from '../../locales/vi/doctor-profile/dashboard.json';
import appointmentsDoctorEN from '../../locales/en/doctor-profile/appointments.json';
import appointmentsDoctorVI from '../../locales/vi/doctor-profile/appointments.json';
import selectionsEN from '../../locales/en/common/selections.json';
import selectionsVI from '../../locales/vi/common/selections.json';
import paginationEN from '../../locales/en/common/pagination.json';
import paginationVI from '../../locales/vi/common/pagination.json';
import profileSettingDoctorEN from '../../locales/en/doctor-profile/profileSetting.json';
import profileSettingDoctorVI from '../../locales/vi/doctor-profile/profileSetting.json';
import scheduleEN from '../../locales/en/common/schedule.json';
import scheduleVI from '../../locales/vi/common/schedule.json';
import changePasswordEN from '../../locales/en/common/changePassword.json';
import changePasswordVI from '../../locales/vi/common/changePassword.json';
import logoutEN from '../../locales/en/common/logout.json';
import logoutVI from '../../locales/vi/common/logout.json';
import doctorCardEN from '../../locales/en/common/doctorCard.json';
import doctorCardVI from '../../locales/vi/common/doctorCard.json';
import chatEN from '../../locales/en/common/chat.json';
import chatVI from '../../locales/vi/common/chat.json';
import chatbotEN from '../../locales/en/common/chatbot.json';
import chatbotVI from '../../locales/vi/common/chatbot.json';
import myAccountEN from '../../locales/en/patient-profile/myAccount.json';
import myAccountVI from '../../locales/vi/patient-profile/myAccount.json';
import updateInfoEN from '../../locales/en/patient-profile/updateInfo.json';
import updateInfoVI from '../../locales/vi/patient-profile/updateInfo.json';
import myBookingsEN from '../../locales/en/patient-profile/myBookings.json';
import myBookingsVI from '../../locales/vi/patient-profile/myBookings.json';
import medicalRecordsEN from '../../locales/en/doctor-patient/medicalRecords.json';
import medicalRecordsVI from '../../locales/vi/doctor-patient/medicalRecords.json';
import examinationFormEN from '../../locales/en/doctor-patient/examinationForm.json';
import examinationFormVI from '../../locales/vi/doctor-patient/examinationForm.json';
import prescriptionEN from '../../locales/en/doctor-patient/prescription.json';
import prescriptionVI from '../../locales/vi/doctor-patient/prescription.json';
import reExamiationFormEN from '../../locales/en/doctor-patient/reExaminationForm.json';
import reExamiationFormVI from '../../locales/vi/doctor-patient/reExaminationForm.json';

const resources = {
    en: {
        homepage: homepageEN,
        navbar: navbarEN,
        footer: footerEN,
        login: loginEn,
        register: registerEn,
        specialties: specialtiesEN,
        specialtyDetails: specialtyDetailsEN,
        examinationService: examinationServiceEN,
        treatmentService: treatmentServiceEN,
        contact: contactEN,
        doctorList: doctorList,
        search: searchEn,
        notification: notificationEN,
        tabsDoctor: tabsDoctorEN,
        aboutDoctor: aboutDoctorEN,
        dashboardDoctor: dashboarDoctorEN,
        appointmentsDoctor: appointmentsDoctorEN,
        selections: selectionsEN,
        pagination: paginationEN,
        profileSettingDoctor: profileSettingDoctorEN,
        schedule: scheduleEN,
        changePassword: changePasswordEN,
        logout: logoutEN,
        doctorCard: doctorCardEN,
        chat: chatEN,
        chatbot: chatbotEN,
        myAccount: myAccountEN,
        updateInfo: updateInfoEN,
        myBookings: myBookingsEN,
        medicalRecords: medicalRecordsEN,
        examinationForm: examinationFormEN,
        prescription: prescriptionEN,
        reExaminationForm: reExamiationFormEN,
    },
    vi: {
        homepage: homepageVI,
        navbar: navbarVI,
        footer: footerVI,
        login: loginVi,
        register: registerVi,
        specialties: specialtiesVI,
        specialtyDetails: specialtyDetailsVI,
        examinationService: examinationServiceVI,
        treatmentService: treatmentServiceVI,
        contact: contactVI,
        doctorList: doctorListVI,
        search: searchVi,
        notification: notificationVI,
        tabsDoctor: tabsDoctorVI,
        aboutDoctor: aboutDoctorVI,
        dashboardDoctor: dashboarDoctorVI,
        appointmentsDoctor: appointmentsDoctorVI,
        selections: selectionsVI,
        pagination: paginationVI,
        profileSettingDoctor: profileSettingDoctorVI,
        schedule: scheduleVI,
        changePassword: changePasswordVI,
        logout: logoutVI,
        doctorCard: doctorCardVI,
        chat: chatVI,
        chatbot: chatbotVI,
        myAccount: myAccountVI,
        updateInfo: updateInfoVI,
        myBookings: myBookingsVI,
        medicalRecords: medicalRecordsVI,
        examinationForm: examinationFormVI,
        prescription: prescriptionVI,
        reExaminationForm: reExamiationFormVI,
    },
};

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        defaultNS: 'homepage',
        ns: [
            'homepage',
            'navbar',
            'footer',
            'login',
            'register',
            'specialties',
            'specialtyDetails',
            'examinationService',
            'treatmentService',
            'contact',
            'doctorList',
            'search',
            'notification',
            'tabsDoctor',
            'aboutDoctor',
            'dashboardDoctor',
            'appointmentsDoctor',
            'selections',
            'pagination',
            'profileSettingDoctor',
            'schedule',
            'changePassword',
            'logout',
            'doctorCard',
            'chat',
            'chatbot',
            'myAccount',
            'updateInfo',
            'myBookings',
            'medicalRecords',
            'examinationForm',
            'prescription',
            'reExaminationForm',
        ],
        interpolation: { escapeValue: false },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });

export default i18n;
