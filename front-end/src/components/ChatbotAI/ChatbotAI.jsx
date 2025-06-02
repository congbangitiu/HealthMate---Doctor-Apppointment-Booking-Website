import { useState, useEffect, useRef, useContext } from 'react';
import { PropTypes } from 'prop-types';
import classNames from 'classnames/bind';
import styles from './ChatbotAI.module.scss';
import { IoMdSend } from 'react-icons/io';
import { FaChevronDown, FaStopCircle } from 'react-icons/fa';
import ChatbotLogo from '../../assets/images/Chatbot-Logo.png';
import BeatLoader from 'react-spinners/BeatLoader';
import { HealthMateInfo } from '../../assets/data/chatbot/HealthMateInfo';
import { diseaseInfo } from '../../assets/data/chatbot/diseaseInfo';
import { webInstructions } from '../../assets/data/chatbot/webInstructions';
import { responseInstructions } from '../../assets/data/chatbot/responseInstructions';
import Typewriter from 'typewriter-effect';
import { authContext } from '../../context/AuthContext';
import extractName from '../../utils/extractName';

const cx = classNames.bind(styles);

const ChatbotAI = ({ setIsShowChatbot }) => {
    // Get user and role information from authContext
    const { token, user, role } = useContext(authContext);

    // State management
    const [chatHistory, setChatHistory] = useState([
        {
            hideInChat: true,
            role: 'model',
            text: HealthMateInfo,
        },
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isStopped, setIsStopped] = useState(false);
    const [typewriterInstance, setTypewriterInstance] = useState(null);

    const [patientSuggestions, setPatientSuggestions] = useState([
        'I am experiencing indigestion and heartburn, which specialist should I consult?',
        'Can I get an online consultation with a dermatologist?',
        'How can I find the most suitable doctor for my specific health concerns?',
    ]);
    const [doctorSuggestions, setDoctorSuggestions] = useState([
        'How can I manage my appointment schedule more efficiently?',
        'What are the most common concerns or questions from patients in my specialty?',
        'Can I get feedback or reviews from patients after consultations to improve my service?',
    ]);
    const [adminSuggestions, setAdminSuggestions] = useState([
        'List all pending doctor registrations.',
        'Any system alerts today?',
        'Which appointments were canceled this week?',
    ]);

    // Refs for input and chat body
    const inputRef = useRef(null);
    const chatBodyRef = useRef(null);

    // Sample answers for predefined questions
    const sampleAnswers = {
        patient: {
            'I am experiencing indigestion and heartburn, which specialist should I consult?':
                'If you’re experiencing symptoms like indigestion and heartburn, it’s recommended to consult a gastroenterologist. Gastroenterologists are medical specialists who diagnose and treat conditions related to the digestive system, including acid reflux, ulcers, bloating, and other gastrointestinal issues. Scheduling an appointment with one can help you get a proper evaluation and treatment plan tailored to your condition.',

            'Can I get an online consultation with a dermatologist?':
                'Yes, you can easily schedule an online consultation with a certified dermatologist through the HealthMate platform. Our dermatologists are qualified to assess and treat a wide range of skin conditions, from acne and rashes to more complex skin issues. Online consultations are a convenient way to receive expert advice without needing to visit a clinic.',

            'How can I find the most suitable doctor for my specific health concerns?':
                'To find the most suitable doctor for your health needs, visit the “Doctors” page on HealthMate. You can apply filters such as medical specialty, doctor ratings, languages spoken, consultation types (in-person or online), and availability. This allows you to compare profiles and choose the doctor who best aligns with your preferences and medical concerns.',
        },
        doctor: {
            'How can I manage my appointment schedule more efficiently?':
                'To manage your appointment schedule more efficiently, log in to your Doctor Dashboard and navigate to the “Appointments” tab. There, you’ll find tools to view, confirm, reschedule, or cancel appointments. You can also enable notifications and reminders to help you stay updated and reduce no-shows.',

            'What are the most common concerns or questions from patients in my specialty?':
                'You can gain insights into common patient concerns by reviewing previous consultation transcripts, patient feedback, and ratings on your profile. Additionally, HealthMate provides aggregated data on trending symptoms and frequently asked questions within your specialty, helping you prepare better for recurring patient needs.',

            'Can I get feedback or reviews from patients after consultations to improve my service?':
                'Yes, after each consultation, patients have the option to leave feedback and rate their experience. These reviews appear on your public profile and are also accessible in your Doctor Dashboard under the “Feedback” section. Reviewing this feedback regularly can help you identify areas for improvement and maintain high patient satisfaction.',
        },
        admin: {
            'List all pending doctor registrations.':
                'To view all pending doctor registrations, go to the Admin Dashboard and select the “Doctor Management” module. From there, you can see a list of doctors awaiting verification or approval, along with their registration details and submitted credentials.',

            'Any system alerts today?':
                'To check for any system alerts or notifications for today, navigate to the Admin notification panel on the dashboard. This panel displays real-time alerts regarding system status, upcoming maintenance, security issues, and other administrative updates that may require your attention.',

            'Which appointments were canceled this week?':
                'To view all appointments canceled during the current week, go to the “Appointments Management” section in the Admin Dashboard. Use the filter options to select the “canceled” status and set the date range to this week. The system will display a list of all relevant canceled appointments along with patient and doctor details.',
        },
    };

    // Generate prompt for API request
    const generatePrompt = (text) => {
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
            - Disease and Symptoms Information: ${diseaseInfo}
            - How to Use the Website: ${webInstructions}
            - How to respond: ${responseInstructions}
            - Chat history: ${chatHistory.map((item) => `${item.role}: ${item.text}`).join('\n')}
        `;

        if (isNotLoggedIn) {
            if (isAskingAuthentication) {
                prompt += `
                    Since the user has not signed in, but they are asking about authentication process (sign in / sign up). 
                    Please provide an instructions from part A in "webInstructions".
                    The user's question is: "${text}"
                `;
            } else {
                prompt += `
                    Since the user is not logged in, you only need to provide a *short answer* to their question. Additionally, please encourage the user to log in (or create an account) for a more detailed and personalized experience (just write a sentence encouraging the user to log in, no need to write detailed steps). The user's question is: "${text}"
                `;
            }
        } else {
            const userRole = role === 'admin' ? 'admin' : role === 'doctor' ? 'doctor' : 'patient';
            prompt += ` With role ${userRole}, please provide an answer to this question: "${text}" `;
        }

        return prompt;
    };

    // Format the response
    const formatListResponse = (text) => {
        return text
            .replace(/\n\*/g, '\n   *') // Format bullet points (*) by adding indentation
            .replace(/\n-/g, '\n   -') // Format dash lists (-) by adding indentation
            .replace(/\*\s/g, '\n   * ') // Ensure bullet points (*) start with proper spacing
            .replace(/-\s/g, '\n   - ') // Ensure dash lists (-) start with proper spacing
            .replace(/\n\d+\./g, (match) => `\n   ${match.trim()}`); // Format numbered lists (1., 2., 3.) with indentation
    };

    // Send API request and update chat history
    const generateBotResponse = async (history) => {
        // Update chat history with bot's response
        const updateHistory = (text, isError = false) => {
            setChatHistory((prev) => [...prev, { role: 'model', text, isError }]);
        };

        // Format chat history for API request
        history = history.map(({ role, text }) => ({ role, parts: [{ text }] }));

        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: history }),
        };

        try {
            const respone = await fetch(import.meta.env.VITE_API_MODEL, requestOptions);
            const data = await respone.json();
            if (!respone.ok) {
                throw new Error(data.error.message || 'Something went wrong');
            }

            // Extract and format the bot's response
            let apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1').trim();
            apiResponseText = formatListResponse(apiResponseText);

            updateHistory(apiResponseText);
            setIsThinking(false);
            setIsTyping(true);
            setIsStopped(false);
        } catch (error) {
            updateHistory(error.message, true);
            setIsThinking(false);
            setIsTyping(false);
        }
    };

    // Send user message and trigger bot response
    const sendUserMessage = (userMessage) => {
        if (!userMessage.trim()) return;

        // Update chat history with user's message
        setChatHistory((history) => [...history, { role: 'user', text: userMessage }]);
        setIsThinking(true);

        // Delay bot response to simulate processing time
        setTimeout(() => {
            generateBotResponse([...chatHistory, { role: 'user', text: generatePrompt(userMessage) }])
                .then(() => {
                    setIsThinking(false);
                })
                .catch(() => {
                    setIsThinking(false);
                });
        }, 500);
    };

    // Handle "Enter" key event
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleSendMessage();
        }
    };

    // Handle send button click
    const handleSendMessage = () => {
        const userMessage = inputRef.current.value.trim();
        inputRef.current.value = '';
        setInputValue('');
        sendUserMessage(userMessage);
    };

    // Handle suggestion click for patient
    const handlePatientSuggestionClick = (text, index) => {
        const predefined = sampleAnswers.patient[text];
        if (predefined) {
            setChatHistory((prev) => [...prev, { role: 'user', text }, { role: 'model', text: predefined }]);
        } else {
            sendUserMessage(text); // fallback to Gemini
        }
        setPatientSuggestions((prev) => prev.filter((_, i) => i !== index));
    };

    // Handle suggestion click for doctor
    const handleDoctorSuggestionClick = (text, index) => {
        const predefined = sampleAnswers.doctor[text];
        if (predefined) {
            setChatHistory((prev) => [...prev, { role: 'user', text }, { role: 'model', text: predefined }]);
        } else {
            sendUserMessage(text);
        }
        setDoctorSuggestions((prev) => prev.filter((_, i) => i !== index));
    };

    // Handle suggestion click for admin
    const handleAdminSuggestionClick = (text, index) => {
        const predefined = sampleAnswers.admin[text];
        if (predefined) {
            setChatHistory((prev) => [...prev, { role: 'user', text }, { role: 'model', text: predefined }]);
        } else {
            sendUserMessage(text);
        }
        setAdminSuggestions((prev) => prev.filter((_, i) => i !== index));
    };

    // Handle stop typing
    const handleStopResponse = () => {
        if (typewriterInstance) {
            typewriterInstance.stop();
        }
        setIsStopped(true);
        setIsTyping(false);
        setIsThinking(false);
        setTypewriterInstance(null);
    };

    // Auto scroll to the bottom when chat history changes
    useEffect(() => {
        chatBodyRef.current.scrollTo({ top: chatBodyRef.current.scrollHeight, behavior: 'smooth' });
    }, [chatHistory]);

    return (
        <div className={cx('container')}>
            <header>
                <div>
                    <img src={ChatbotLogo} alt="Chatbot Logo" />
                    <h4>HealthAid</h4>
                </div>
                <div>
                    <FaChevronDown className={cx('icon')} onClick={() => setIsShowChatbot(false)} />
                </div>
            </header>

            <main ref={chatBodyRef}>
                {/* Initial Greeting */}
                <div className={cx('message-wrapper', 'model-message')}>
                    <div className={cx('message')}>
                        <img src={ChatbotLogo} />
                        <div>
                            {!token || token === 'null' || token === 'undefined' ? (
                                <>
                                    Hi there! I&apos;m <b>HealthAid</b> - HealthMate Assistant! How can I help you
                                    today?
                                </>
                            ) : (
                                <>
                                    Hi {role === 'doctor' ? 'Dr. ' : ''}
                                    {extractName(user?.fullname)}, I&apos;m <b>HealthAid</b> - HealthMate Assistant! How
                                    can I help you today?
                                </>
                            )}
                        </div>
                    </div>

                    {role === 'patient' && patientSuggestions.length > 0 && (
                        <div className={cx('suggestions')}>
                            {patientSuggestions.map((item, idx) => (
                                <div key={idx} onClick={() => handlePatientSuggestionClick(item, idx)}>
                                    {item}
                                </div>
                            ))}
                        </div>
                    )}

                    {role === 'doctor' && doctorSuggestions.length > 0 && (
                        <div className={cx('suggestions')}>
                            {doctorSuggestions.map((item, idx) => (
                                <div key={idx} onClick={() => handleDoctorSuggestionClick(item, idx)}>
                                    {item}
                                </div>
                            ))}
                        </div>
                    )}

                    {role === 'admin' && adminSuggestions.length > 0 && (
                        <div className={cx('suggestions')}>
                            {adminSuggestions.map((item, idx) => (
                                <div key={idx} onClick={() => handleAdminSuggestionClick(item, idx)}>
                                    {item}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Chat History */}
                {chatHistory.map(
                    (chat, index) =>
                        !chat.hideInChat && (
                            <div key={index} className={cx('message-wrapper', `${chat.role}-message`)}>
                                <div className={cx('message')}>
                                    {chat.role === 'model' ? (
                                        <>
                                            <img src={ChatbotLogo} />
                                            <Typewriter
                                                onInit={(typewriter) => {
                                                    setIsTyping(true);
                                                    setIsStopped(false);
                                                    setTypewriterInstance(typewriter);

                                                    typewriter
                                                        .changeDelay(15)
                                                        .typeString(
                                                            chat.text
                                                                .replace(/\n\s*\*/g, '<br />*') // Replace newlines before bullet points (*) with a single line break to ensure proper formatting
                                                                .replace(/\n\s*\d+\./g, '<br />'), // Replace newlines before numbered lists (e.g., "1.") with a single line break to maintain proper spacing
                                                        )
                                                        .callFunction(() => {
                                                            // Scroll to the bottom when text is being typed
                                                            if (chatBodyRef.current) {
                                                                chatBodyRef.current.scrollTo({
                                                                    top: chatBodyRef.current.scrollHeight,
                                                                    behavior: 'smooth',
                                                                });
                                                            }
                                                        })
                                                        .callFunction(() => {
                                                            setIsTyping(false);
                                                            setTypewriterInstance(null);
                                                        })
                                                        .start();

                                                    if (isStopped) {
                                                        typewriter.stop();
                                                        setIsTyping(false);
                                                    }
                                                }}
                                                options={{
                                                    cursor: '',
                                                }}
                                            />
                                        </>
                                    ) : (
                                        <div className={cx({ error: chat.isError })}>{chat.text}</div>
                                    )}
                                </div>
                            </div>
                        ),
                )}

                {/* Bot thinking animation */}
                {isThinking && (
                    <div className={cx('message-wrapper', 'model-message')}>
                        <div className={cx('message')}>
                            <img src={ChatbotLogo} />
                            <div className={cx('loading')}>
                                <BeatLoader size={4} color="black" />
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer>
                <input
                    ref={inputRef}
                    type="text"
                    onChange={() => setInputValue(inputRef.current.value)}
                    placeholder="Message ..."
                    onKeyDown={handleKeyDown}
                />

                {isThinking || isTyping ? (
                    <FaStopCircle className={cx('icon')} onClick={handleStopResponse} />
                ) : (
                    <IoMdSend className={cx('icon', { disabled: inputValue === '' })} onClick={handleSendMessage} />
                )}
            </footer>
        </div>
    );
};

ChatbotAI.propTypes = {
    setIsShowChatbot: PropTypes.func.isRequired,
};

export default ChatbotAI;
