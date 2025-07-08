export const isGeneralWebsiteQuestion = (text) => {
    const lower = text.toLowerCase();

    const keywordGroups = [
        // Authentication
        'sign in',
        'sign up',
        'login',
        'register',
        'forgot password',
        'reset password',
        'authentication',

        // Navigation & Interface
        'homepage',
        'navigation bar',
        'dashboard',
        'notification',
        'contact',
        'profile section',
        'view information',
        'logout',
        'filter',
        'search doctor',
        'view feedback',

        // Appointment & Booking
        'find a doctor',
        'book appointment',
        'appointment status',
        'available time slots',
        'reschedule',
        'cancel appointment',
        'consultation',
        'prescription',
        'feedback',
        'services',

        // Payment & Billing
        'pay',
        'payment method',
        'stripe',
        'cashless',
        'invoice',
        'pricing',
        'transaction',

        // Help & Support
        'help',
        'support',
        'assistance',
    ];

    return keywordGroups.some((keyword) => lower.includes(keyword));
};

export const isGeneralMedicalQuestion = (text) => {
    const lower = text.toLowerCase();
    const vietnamesePattern =
        /là thuốc gì|có tác dụng gì|triệu chứng|bệnh gì|uống mấy viên|tác dụng phụ|chống chỉ định/;
    const englishPattern = /what is|used for|symptoms|what disease|how many pills|side effects|contraindications/;
    const blacklistPattern = /code|bài tập|giải phương trình|debug|lập trình|programming|solve|calculate/;

    return (vietnamesePattern.test(lower) || englishPattern.test(lower)) && !blacklistPattern.test(lower);
};

export const isAskingAboutAppointments = (text) => {
    const lower = text.toLowerCase();
    return lower.includes('appointment') && (lower.includes('today') || lower.includes('tomorrow'));
};

export const isAskingAboutSymptoms = (text) => {
    const lower = text.toLowerCase();
    return lower.includes('symptom') || lower.includes('doctor');
};
