import { describe, expect, it, vi } from 'vitest';
vi.mock('../../assets/data/chatbot/HealthMateInfo', () => ({ HealthMateInfo: 'PLATFORM_CONTEXT_FIXTURE' }));
vi.mock('../../assets/data/chatbot/webInstructions', () => ({ webInstructions: 'WEBSITE_CONTEXT_FIXTURE' }));
vi.mock('../../assets/data/chatbot/responseInstructions', () => ({ responseInstructions: 'RESPONSE_CONTEXT_FIXTURE' }));
import generatePrompt from './generatePrompt';

const options = (overrides = {}) => ({
    text: 'How does this platform work?', token: 'unit-token', role: 'patient', chatHistory: [], ...overrides,
});

describe('generatePrompt', () => {
    it.each([null, undefined, '', 'null', 'undefined'])(
        'FE-C14: chooses the signed-out branch for token %j', (token) => {
            const prompt = generatePrompt(options({ token }));
            expect(prompt).toContain('Since the user is not logged in');
            expect(prompt).toContain('encourage the user to log in');
            expect(prompt).toContain('The user\'s question is: "How does this platform work?"');
            expect(prompt).not.toContain('With role patient');
        },
    );

    it.each(['How do I sign in?', 'How do I sign up?', 'How do I log in?', 'Where can I register?', 'HOW TO SIGN IN', 'HOW TO SIGN UP'])(
        'FE-C15: selects authentication instructions for the signed-out question %j', (text) => {
            const prompt = generatePrompt(options({ token: null, text }));
            expect(prompt).toContain('they are asking about authentication process');
            expect(prompt).toContain('instructions from part A');
            expect(prompt).toContain(`The user's question is: "${text}"`);
            expect(prompt).not.toContain('Since the user is not logged in, you only need');
        },
    );

    it.each([['admin', 'admin'], ['doctor', 'doctor'], ['patient', 'patient'], ['unknown', 'patient'], [null, 'patient'], [undefined, 'patient']])(
        'FE-C16: formats authenticated role %j as the existing %s role branch', (role, expected) => {
            const prompt = generatePrompt(options({ role }));
            expect(prompt).toContain(`With role ${expected}, please provide an answer to this question: "How does this platform work?"`);
            expect(prompt).not.toContain('Since the user is not logged in');
        },
    );

    it.each(['unit-token', null])('FE-C17: gives an explicit fallback feature priority over normal authentication and role branches: %j', (token) => {
        const prompt = generatePrompt(options({ token, role: 'patient', text: 'How do I sign in?', fallbackFeature: 'appointment schedules' }));
        expect(prompt).toContain('feature (appointment schedules)');
        expect(prompt).toContain('role (patient)');
        expect(prompt).toContain('The user\'s question is: "How do I sign in?"');
        expect(prompt).not.toContain('With role patient');
        expect(prompt).not.toContain('Since the user');
    });

    it('FE-C18: keeps history order and roles without mutating the supplied history', () => {
        const history = Object.freeze([
            Object.freeze({ role: 'user', text: 'First unique question' }),
            Object.freeze({ role: 'model', text: 'Unique previous answer' }),
        ]);
        const prompt = generatePrompt(options({ chatHistory: history, text: 'Current unique question' }));
        expect(prompt).toContain('user: First unique question\nmodel: Unique previous answer');
        expect(prompt).toContain('With role patient, please provide an answer to this question: "Current unique question"');
        expect(history).toHaveLength(2);
        expect(history[0].text).toBe('First unique question');
    });

    it('FE-C18: includes every provided context block when the history is empty', () => {
        const prompt = generatePrompt(options());
        expect(prompt).toContain('HealthMate Information: PLATFORM_CONTEXT_FIXTURE');
        expect(prompt).toContain('How to Use the Website: WEBSITE_CONTEXT_FIXTURE');
        expect(prompt).toContain('How to respond: RESPONSE_CONTEXT_FIXTURE');
        expect(prompt).toContain('Chat history:');
        expect(prompt).not.toContain('[object Object]');
    });

    it.todo('FE-C19: decides whether omitted or null chatHistory is accepted as empty history or rejected with validation');
    it.todo('FE-C19: defines validation for malformed history containers and records before asserting their prompt representation');
});
