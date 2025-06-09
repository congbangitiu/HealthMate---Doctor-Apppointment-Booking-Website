import { HealthMateInfo } from '../../assets/data/chatbot/HealthMateInfo';
import { webInstructions } from '../../assets/data/chatbot/webInstructions';
import { responseInstructions } from '../../assets/data/chatbot/responseInstructions';

const generatePrompt = ({ text, token, role, chatHistory, fallbackFeature }) => {
    const isNotLoggedIn = !token || token === 'null' || token === 'undefined';

    const isAskingAuthentication = (question) => {
        const lowerQ = question.toLowerCase();
        return (
            lowerQ.includes('sign in') ||
            lowerQ.includes('sign up') ||
            lowerQ.includes('log in') ||
            lowerQ.includes('register') ||
            lowerQ.includes('how to sign in') ||
            lowerQ.includes('how to sign up')
        );
    };

    let prompt = `
        You are an intelligent chatbot named HealthAid representing HealthMate, a healthcare platform that connects patients with experienced healthcare professionals. Your task is to provide precise and relevant answers to user inquiries about HealthMate based on the following information.

        Context: 
            - HealthMate Information: ${HealthMateInfo}       
            - How to Use the Website: ${webInstructions}
            - How to respond: ${responseInstructions}
            - Chat history: ${chatHistory.map((item) => `${item.role}: ${item.text}`).join('\n')}

        Formatting rules:
            - If the response contains a list of items (services, steps, features, departments, etc.), please use:
                • Bullet points (• or -) when order is not important
                • Numbered list (1., 2., 3., ...) when steps or order matters
            - Place each item on a separate line.
            - Do not group all items into a single paragraph.
        `;

    if (fallbackFeature) {
        prompt += `
            The user asked about a feature (${fallbackFeature}) that is not currently supported for their role (${role}). 
            Please respond politely to inform them that this feature is not available to their current role.
            Then, guide them on how to access this information manually by referring to the relevant part in "webInstructions".
            The user's question is: "${text}"
        `;
        return prompt;
    }

    if (isNotLoggedIn) {
        if (isAskingAuthentication(text)) {
            prompt += `
                Since the user has not signed in, but they are asking about authentication process (sign in / sign up). 
                Please provide an instructions from part A in "webInstructions".
                The user's question is: "${text}"
            `;
        } else {
            prompt += `
                Since the user is not logged in, you only need to provide a *short answer* to their question. Additionally, please encourage the user to log in (or create an account) for a more detailed and personalized experience. The user's question is: "${text}"
            `;
        }
    } else {
        const userRole = role === 'admin' ? 'admin' : role === 'doctor' ? 'doctor' : 'patient';
        prompt += ` With role ${userRole}, please provide an answer to this question: "${text}" `;
    }

    return prompt;
};

export default generatePrompt;
