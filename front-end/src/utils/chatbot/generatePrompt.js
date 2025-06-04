import { HealthMateInfo } from '../../assets/data/chatbot/HealthMateInfo';
import { diseaseInfo } from '../../assets/data/chatbot/diseaseInfo';
import { webInstructions } from '../../assets/data/chatbot/webInstructions';
import { responseInstructions } from '../../assets/data/chatbot/responseInstructions';

const generatePrompt = ({ text, token, role, chatHistory }) => {
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
    `;

    // - Disease and Symptoms Information: ${diseaseInfo}

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
