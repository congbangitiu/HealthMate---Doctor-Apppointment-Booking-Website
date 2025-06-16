import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import homepageEN from '../../locales/en/homepage.json';
import homepageVI from '../../locales/vi/homepage.json';
import navbarEN from '../../locales/en/navbar.json';
import navbarVI from '../../locales/vi/navbar.json';
import footerEN from '../../locales/en/footer.json';
import footerVI from '../../locales/vi/footer.json';

const resources = {
    en: { homepage: homepageEN, navbar: navbarEN, footer: footerEN },
    vi: { homepage: homepageVI, navbar: navbarVI, footer: footerVI },
};

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        lng: 'en',
        defaultNS: 'homepage',
        ns: ['homepage', 'navbar', 'footer'],
        interpolation: { escapeValue: false },
    });

export default i18n;
