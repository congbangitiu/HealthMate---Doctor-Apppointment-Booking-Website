import { describe, expect, it } from 'vitest';
import {
    isGeneralWebsiteQuestion, isGeneralMedicalQuestion,
    isAskingAboutAppointments, isAskingAboutSymptoms,
} from './determineQuestionType';

describe('chatbot question classification', () => {
    it.each([
        ['How do I sign in?', true], ['Where is LOGIN?', true], ['PAYMENT METHOD', true],
        ['How do I book appointment?', true], ['How do I reset password?', true], ['The weather is pleasant', false],
    ])('FE-C05: classifies a website question %j as %s', (text, expected) => {
        expect(isGeneralWebsiteQuestion(text)).toBe(expected);
    });

    it.each([
        ['Thuốc này có tác dụng gì?', true], ['TRIỆU CHỨNG thường gặp là gì?', true],
        ['What is this medicine used for?', true], ['What are the SIDE EFFECTS?', true],
        ['What is programming?', false], ['What is this debug code?', false],
        ['Giải phương trình có tác dụng gì?', false], ['The weather is pleasant', false],
    ])('FE-C06: applies medical patterns and the programming blacklist to %j', (text, expected) => {
        expect(isGeneralMedicalQuestion(text)).toBe(expected);
    });

    it.each([
        ['Show my APPOINTMENTS TODAY', true], ['Any appointment tomorrow?', true],
        ['Show my appointments', false], ['What happens today?', false], ['Appointments yesterday', false],
    ])('FE-C07: requires both an appointment term and today or tomorrow: %j', (text, expected) => {
        expect(isAskingAboutAppointments(text)).toBe(expected);
    });

    it.each([
        ['I have a SYMPTOM', true], ['Which DOCTOR should I contact?', true],
        ['I have several symptoms', true], ['The weather is pleasant', false],
    ])('FE-C08: applies the existing symptom or doctor keyword rule to %j', (text, expected) => {
        expect(isAskingAboutSymptoms(text)).toBe(expected);
    });

    describe.each([
        ['isGeneralWebsiteQuestion', isGeneralWebsiteQuestion], ['isGeneralMedicalQuestion', isGeneralMedicalQuestion],
        ['isAskingAboutAppointments', isAskingAboutAppointments], ['isAskingAboutSymptoms', isAskingAboutSymptoms],
    ])('%s input guards', (_name, classify) => {
        it.each([null, undefined, '', 123, {}])(
            'FE-C09: returns false for absent or invalid text instead of throwing: %j', (text) => {
                expect(classify(text)).toBe(false);
            },
        );
    });
});
