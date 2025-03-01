import { useState, useEffect, useRef, useContext } from 'react';
import { PropTypes } from 'prop-types';
import classNames from 'classnames/bind';
import styles from './ChatbotAI.module.scss';
import { IoMdSend } from 'react-icons/io';
import { FaChevronDown, FaStopCircle } from 'react-icons/fa';
import ChatbotLogo from '../../assets/images/Chatbot-Logo.png';
import BeatLoader from 'react-spinners/BeatLoader';
import { HealthmateInfo } from '../../assets/data/HealthmateInfo';
import { diseaseInfo } from '../../assets/data/diseaseInfo';
import { webInstructions } from '../../assets/data/webInstructions';
import Typewriter from 'typewriter-effect';
import { authContext } from '../../context/AuthContext';
import extractName from '../../utils/extractName';

const cx = classNames.bind(styles);

const ChatbotAI = ({ setIsShowChatbot }) => {
    // Get user and role information from authContext
    const { user, role } = useContext(authContext);

    // State management
    const [chatHistory, setChatHistory] = useState([
        {
            hideInChat: true,
            role: 'model',
            text: HealthmateInfo,
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

    // Generate prompt for API request
    const generatePrompt = (text) => {
        return `
        You are an intelligent chatbot named HealthAid representing HealthMate, a healthcare platform that connects patients with experienced healthcare professionals. Your task is to provide precise and relevant answers to user inquiries about HealthMate based on the following information.

        Context: 
        - HealthMate infomation: ${HealthmateInfo}       
        - Disease and symptoms infomation: ${diseaseInfo}
        - How to use website: ${webInstructions}
        
        Guidelines:
        - Answer Directly and Confidently:
            + Provide clear and concise answers without revealing that you are referencing a data source.
            + Maintain a natural conversational flow to enhance user experience.
        - Contextual Understanding:
            + If a question is indirectly answered, use logical reasoning to give a relevant and coherent response.
            + Only provide answers that are logically consistent with the context given.

        Handling Unknowns: 
        - If the information is not available, respond with: "I'm sorry, but I don't have the information on that right now."
        - Offer helpful alternatives, like suggesting the user visit HealthMate's website or contact customer support.

        Privacy and Role-Based Access Control: Respect User Privacy and Role Permissions, always check the user's role before providing information:
            - Patients:
                + Can only access their own appointment details, prescriptions, and general website usage information.
                + Cannot access other patients' information, doctors' schedules (except for available booking slots), or administrative data such as financial reports, user registrations, or staff ratings.
                + If a patient asks about sensitive or unauthorized data, respond with: 
                    "I'm sorry, but I don't have permission to provide that information."
            - Doctors:
                + Can access their own schedule, appointments, and patient feedback directly related to their services.
                + Cannot access other doctors' schedules, ratings, or financial data.
                + Cannot access administrative data such as user registrations or overall platform statistics.
                + If a doctor asks about restricted data, respond with:
                    "I'm sorry, but that information is not accessible to you."
            - Admins:
                + Have the highest access level and can view statistics about appointments, financials, and user registrations.
                + Can access information across the platform but must still respect individual user privacy (e.g., not disclosing personal patient details).

        Handling Unauthorized Access Requests:
        - If a user asks for information outside of their role's permission, respond with:
            "I'm sorry, but I can't provide that information due to privacy and security policies."
        - If the question is about sensitive or administrative data, suggest contacting the appropriate department, e.g.:
            "For further details, please contact HealthMate's administration team."
        
        Maintain Brand Voice: Use a professional yet approachable tone, reflecting HealthMate's values of trustworthiness, reliability, and care.

        With role ${
            role === 'admin' ? 'admin' : role === 'doctor' ? 'doctor' : 'patient'
        }, using the following instructions to address this query: ${text}
        `;
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
            const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1').trim();
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
    const handlePatientSuggestionClick = (suggestionText, index) => {
        sendUserMessage(suggestionText);
        setPatientSuggestions((prev) => prev.filter((_, i) => i !== index));
    };

    // Handle suggestion click for doctor
    const handleDoctorSuggestionClick = (suggestionText, index) => {
        sendUserMessage(suggestionText);
        setDoctorSuggestions((prev) => prev.filter((_, i) => i !== index));
    };

    // Handle suggestion click for admin
    const handleAdminSuggestionClick = (suggestionText, index) => {
        sendUserMessage(suggestionText);
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
                            Hi {role === 'doctor' && 'Dr.'}
                            {extractName(user.fullname)}, I&apos;m <b>HealthAid</b> - HealthMate Assistant! How can I
                            help you today?
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
                                                        .typeString(chat.text)
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
