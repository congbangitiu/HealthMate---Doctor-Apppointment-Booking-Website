import { useState, useEffect, useRef, useContext } from 'react';
import { PropTypes } from 'prop-types';
import classNames from 'classnames/bind';
import styles from './ChatbotAI.module.scss';
import { IoMdSend } from 'react-icons/io';
import { FaChevronDown, FaStopCircle } from 'react-icons/fa';
import ChatbotLogo from '../../assets/images/Chatbot-Logo.png';
import BeatLoader from 'react-spinners/BeatLoader';
import { HealthMateInfo } from '../../assets/data/chatbot/HealthMateInfo';
import Typewriter from 'typewriter-effect';
import { authContext } from '../../context/AuthContext';
import extractName from '../../utils/extractName';
import formatListResponse from '../../utils/chatbot/formatListResponse';
import {
    isGeneralWebsiteQuestion,
    isAskingAboutAppointments,
    isAskingAboutSymptoms,
} from '../../utils/chatbot/determineQuestionType';
import sampleAnswers from '../../assets/data/chatbot/sampleAnswer';
import generatePrompt from '../../utils/chatbot/generatePrompt';
import handleDoctorScheduleQuery from '../../utils/chatbot/handleDoctorScheduleQuery';
import handleSymptomQuery from '../../utils/chatbot/handleSymptomQuery';
import {
    handleDoctorAvailabilityResponse,
    handleSymptomBasedResponse,
} from '../../utils/chatbot/handlePatientQuestion';
import { handleDoctorAppointments } from '../../utils/chatbot/handleDoctorQuestion';

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
    // Refs for input and chat body
    const inputRef = useRef(null);
    const chatBodyRef = useRef(null);

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

    // Retry fetch function to handle rate limits and server overloads
    const retryFetch = async (url, options, retries = 3, delay = 1500) => {
        for (let i = 0; i < retries; i++) {
            const response = await fetch(url, options);

            if (response.ok) return response;

            if (response.status === 429 || response.status === 503) {
                console.warn(`Retrying (${i + 1}/${retries}) due to overload or rate limit...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
                // Other error (e.g., 400, 500) → don't retry
                return response;
            }
        }
        throw new Error('The model is overloaded. Please try again later.');
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
            const respone = await retryFetch(import.meta.env.VITE_API_MODEL, requestOptions);
            const data = await respone.json();
            if (!respone.ok) {
                throw new Error(data.error.message || 'Something went wrong');
            }

            // Extract and format the bot's response
            let apiResponseText = data.candidates[0].content.parts[0].text.trim();
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
    const sendUserMessage = async (userMessage) => {
        if (!userMessage.trim()) return;

        setChatHistory((history) => [...history, { role: 'user', text: userMessage }]);
        setIsThinking(true);

        const fallbackForUnsupportedRole = (featureText) => {
            const fallbackPrompt = generatePrompt({
                text: userMessage,
                token,
                role,
                chatHistory,
                fallbackFeature: featureText,
            });

            generateBotResponse([...chatHistory, { role: 'user', text: fallbackPrompt }]).finally(() =>
                setIsThinking(false),
            );
        };

        // Check if doctor ask about symptoms or doctor availability
        if (role !== 'patient' && isAskingAboutSymptoms(userMessage)) {
            fallbackForUnsupportedRole('symptom-based diagnosis or doctor availability');
            return;
        }

        // Check if user is asking about appointments
        if (role !== 'doctor' && isAskingAboutAppointments(userMessage)) {
            fallbackForUnsupportedRole('appointment schedules');
            return;
        }

        // General website questions
        if (isGeneralWebsiteQuestion(userMessage)) {
            const prompt = generatePrompt({
                text: userMessage,
                token,
                role,
                chatHistory,
            });

            return generateBotResponse([...chatHistory, { role: 'user', text: prompt }]).finally(() =>
                setIsThinking(false),
            );
        }

        // Handle doctor-specific questions
        if (role === 'doctor') {
            const handledAppointmentsAppointments = await handleDoctorAppointments({
                userMessage,
                role,
                chatHistory,
                setIsThinking,
                generateBotResponse,
                token,
            });
            if (handledAppointmentsAppointments) return;
        }

        // Handle patient-specific questions
        if (role === 'patient') {
            // Check if user is asking about a specific doctor
            const handledDoctorAvailability = await handleDoctorAvailabilityResponse({
                userMessage,
                chatHistory,
                setIsThinking,
                generateBotResponse,
                handleDoctorScheduleQuery,
            });
            if (handledDoctorAvailability) return;

            // Check if it's a symptom-based question
            const handledSymptom = await handleSymptomBasedResponse({
                userMessage,
                chatHistory,
                setIsThinking,
                generateBotResponse,
                handleSymptomQuery,
            });
            if (handledSymptom) return;
        }

        // Case when the question is not handled by specific functions
        generateBotResponse([
            ...chatHistory,
            {
                role: 'user',
                text: generatePrompt({
                    text: userMessage,
                    token,
                    role,
                    chatHistory,
                }),
            },
        ]).finally(() => setIsThinking(false));
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
