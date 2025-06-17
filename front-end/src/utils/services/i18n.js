import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import homepageEN from '../../locales/en/homepage.json';
import homepageVI from '../../locales/vi/homepage.json';
import navbarEN from '../../locales/en/navbar.json';
import navbarVI from '../../locales/vi/navbar.json';
import footerEN from '../../locales/en/footer.json';
import footerVI from '../../locales/vi/footer.json';
import loginEn from '../../locales/en/login.json';
import loginVi from '../../locales/vi/login.json';
import registerEn from '../../locales/en/register.json';
import registerVi from '../../locales/vi/register.json';
import specialtiesEN from '../../locales/en/specialties.json';
import specialtiesVI from '../../locales/vi/specialties.json';
import specialtyDetailsEN from '../../locales/en/specialtyDetails.json';
import specialtyDetailsVI from '../../locales/vi/specialtyDetails.json';
import examinationServiceEN from '../../locales/en/examinationService.json';
import examinationServiceVI from '../../locales/vi/examinationService.json';
import treatmentServiceEN from '../../locales/en/treatmentService.json';
import treatmentServiceVI from '../../locales/vi/treatmentService.json';
import contactEN from '../../locales/en/contact.json';
import contactVI from '../../locales/vi/contact.json';
import doctorList from '../../locales/en/doctorList.json';
import doctorListVI from '../../locales/vi/doctorList.json';
import searchEn from '../../locales/en/search.json';
import searchVi from '../../locales/vi/search.json';

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
    },
};

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        lng: 'en',
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
        ],
        interpolation: { escapeValue: false },
    });

export default i18n;
