/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            // Đồng bộ với các biến CSS trong src/GlobalStyle.css để @apply hoạt động.
            colors: {
                primaryColor: '#30d5c8',
                buttonBgColor: '#0067ff',
                yellowColor: '#feb60d',
                lightYellowColor: '#fffacd',
                darkYellowColor: '#bdb66b',
                purpleColor: '#9771ff',
                irisBlueColor: '#01b5c5',
                headingColor: '#181a1e',
                textColor: '#4e545f',
                whiteColor: '#ffffff',
                greenColor: '#76d45e',
                lightGreenColor: '#ccf0f3',
                extremeLightGreenColor: '#f6fef6',
                grayColor: '#c0c0c0',
                darkGrayColor: '#8a92a6',
                lightGrayColor: '#cdcdcd',
                extremeLightGrayColor: '#f8f8f8',
                lightRedColor: 'rgba(255, 182, 193, 0.3)',
                darkRedColor: '#b22222',
            },
            boxShadow: {
                panelShadow: 'rgba(17, 12, 46, 0.15) 0px 48px 100px 0px',
            },
        },
    },
    plugins: [],
};
