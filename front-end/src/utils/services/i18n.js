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
            'contact',
            'doctorList',
            'search',
            'notification',
        ],
        interpolation: { escapeValue: false },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });

export default i18n;
