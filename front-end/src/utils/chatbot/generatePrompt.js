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
        You are HealthAid, an intelligent and helpful AI health assistant on the HealthMate platform.

        Your task is to:
        - Answer general medical questions clearly and concisely, based on your medical knowledge.
        - Answer HealthMate-related questions using the provided context below.

        Only mention limitations or disclaimers **if the user explicitly asks for diagnosis, treatment decision, or emergency help**.
        Never mention that you are an AI model or large language model.

        Context: 
        - HealthMate Information: ${HealthMateInfo}       
        - How to Use the Website: ${webInstructions}
        - How to respond: ${responseInstructions}
        - Chat history: ${chatHistory.map((item) => `${item.role}: ${item.text}`).join('\n')}

        Formatting rules:
        - If the response contains a list (e.g., services, steps, symptoms), use:
            • Bullet points (• or -) if order is not important
            • Numbered list (1., 2., 3., ...) if order matters
        - Each item should be on its own line.
        - Avoid putting the entire list in one paragraph.

        Answering style:
        - Be **brief**, informative, and easy to read.
        - Avoid excessive explanation unless the user asks for details.
        - Keep the answer within 5 lines or ~50 words when possible.
        - Do not add any disclaimers unless the question requires professional advice.
        - Answer in the same language the user uses (English or Vietnamese).
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
