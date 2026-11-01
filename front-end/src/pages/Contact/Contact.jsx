import { useContext, useEffect, useRef, useState } from 'react';
import classNames from 'classnames/bind';
import Select from 'react-select';
import { FiCheckCircle } from 'react-icons/fi';
import styles from './Contact.module.scss';
import { useTranslation } from 'react-i18next';
import { sanitizePhoneNumber } from '../../utils/number/sanitizePhoneNumber';
import { getSelectionStyles } from '../../components/Selections/selectStyles';
import Recaptcha from '../../components/Recaptcha/Recaptcha';
import Loader from '../../components/Loader/Loader';
import { authContext } from '../../context/AuthContext';
import { BASE_URL } from '../../../config';

const cx = classNames.bind(styles);
const baseSubjectStyles = getSelectionStyles('100%');
const subjectStyles = {
    ...baseSubjectStyles,
    control: (provided, state) => ({
        ...baseSubjectStyles.control(provided, state),
        border:
            state.isFocused || state.menuIsOpen ? '2px solid var(--primaryColor)' : '2px solid var(--darkGrayColor)',
    }),
};
const categories = ['account', 'appointment', 'payment', 'medical-records', 'technical', 'feedback', 'other'];
const emptyContact = { fullname: '', email: '', phone: '' };

export default function Contact() {
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    const { t, i18n } = useTranslation('contact');
    const { token, role } = useContext(authContext);
    const [contact, setContact] = useState(emptyContact);
    const [category, setCategory] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [captchaToken, setCaptchaToken] = useState('');
    const [resetKey, setResetKey] = useState(0);
    const [profileAttempt, setProfileAttempt] = useState(0);
    const [profileLoading, setProfileLoading] = useState(Boolean(token));
    const [profileError, setProfileError] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [requestId, setRequestId] = useState('');
    const sending = useRef(false);
    const identity = useRef(0);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);
    useEffect(() => {
        const controller = new AbortController();
        identity.current += 1;
        setContact(emptyContact);
        setCategory('');
        setSubject('');
        setMessage('');
        setError('');
        setRequestId('');
        setCaptchaToken('');
        setResetKey((key) => key + 1);
        setProfileError(false);
        setProfileLoading(Boolean(token));
        if (!token) return () => controller.abort();
        const load = async () => {
            try {
                const response = await fetch(`${BASE_URL}/${role === 'doctor' ? 'doctors' : 'users'}/profile/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal,
                });
                const result = await response.json();
                if (!response.ok || !result.data) throw new Error();
                if (controller.signal.aborted) return;
                const data = result.data;
                setContact({
                    fullname: data.fullname || '',
                    email: data.email || '',
                    phone: data.phone == null ? '' : sanitizePhoneNumber(String(data.phone)),
                });
            } catch {
                if (!controller.signal.aborted) setProfileError(true);
            } finally {
                if (!controller.signal.aborted) setProfileLoading(false);
            }
        };
        load();
        return () => controller.abort();
    }, [token, role, profileAttempt]);

    const submit = async (event) => {
        event.preventDefault();
        if (sending.current || profileLoading || profileError) return;
        setError('');
        setRequestId('');
        if (!category || (category === 'other' && !subject.trim()) || !message.trim() || !contact.fullname.trim()) {
            setError('invalidFields');
            return;
        }
        if (!captchaToken) {
            setError('captchaRequired');
            return;
        }
        sending.current = true;
        setSubmitting(true);
        const currentIdentity = identity.current;
        try {
            const response = await fetch(`${BASE_URL}/contacts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({
                    ...contact,
                    category,
                    subject: category === 'other' ? subject.trim() : '',
                    message,
                    captchaToken,
                }),
            });
            const result = await response.json();
            if (currentIdentity !== identity.current) return;
            if (!response.ok || !result.data?.id) {
                const codes = ['invalidFields', 'captchaRequired', 'captchaInvalid', 'rateLimited', 'unavailable'];
                setError(
                    response.status === 401
                        ? 'sessionExpired'
                        : codes.includes(result.code)
                        ? result.code
                        : 'sendFailed',
                );
                return;
            }
            setRequestId(result.data.id);
            setCategory('');
            setSubject('');
            setMessage('');
        } catch {
            if (currentIdentity === identity.current) setError('sendFailed');
        } finally {
            sending.current = false;
            setSubmitting(false);
            setCaptchaToken('');
            setResetKey((key) => key + 1);
        }
    };

    const options = categories.map((value) => ({ value, label: t(`categories.${value}`) }));
    return (
        <div className={cx('container')}>
            <h2>{t('title')}</h2>
            <p>{t('description')}</p>
            {profileLoading ? (
                <Loader />
            ) : (
                <form onSubmit={submit}>
                    {profileError && (
                        <div role="alert">
                            {t('profileError')}{' '}
                            <button type="button" onClick={() => setProfileAttempt((n) => n + 1)}>
                                {t('retry')}
                            </button>
                        </div>
                    )}
                    <fieldset disabled={profileLoading || submitting} className={cx('form-fields')}>
                        <div className={cx('fields')}>
                            {['fullname', 'email', 'phone'].map((name) => (
                                <div className={cx('info')} key={name}>
                                    <label htmlFor={name}>{t(name)}</label>
                                    <input
                                        id={name}
                                        name={name}
                                        required
                                        type={name === 'email' ? 'email' : name === 'phone' ? 'tel' : 'text'}
                                        autoComplete={name === 'fullname' ? 'name' : name === 'phone' ? 'tel' : 'email'}
                                        maxLength={name === 'fullname' ? 120 : name === 'email' ? 254 : 15}
                                        {...(name === 'phone'
                                            ? { inputMode: 'numeric', pattern: '[0-9]{9,15}', minLength: 9 }
                                            : {})}
                                        placeholder={t(`${name}Placeholder`)}
                                        value={contact[name]}
                                        onChange={(event) =>
                                            setContact({
                                                ...contact,
                                                [name]:
                                                    name === 'phone'
                                                        ? sanitizePhoneNumber(event.target.value)
                                                        : event.target.value,
                                            })
                                        }
                                    />
                                </div>
                            ))}
                            <div className={cx('info', 'subject-field')}>
                                <label htmlFor="subject">{t('subject')}</label>
                                <Select
                                    inputId="subject"
                                    instanceId="contact-subject"
                                    name="category"
                                    required
                                    options={options}
                                    value={options.find((option) => option.value === category) || null}
                                    onChange={(option) => {
                                        setCategory(option?.value || '');
                                        setSubject('');
                                    }}
                                    styles={subjectStyles}
                                    placeholder={t('subjectPlaceholder')}
                                    isSearchable={false}
                                    isDisabled={profileLoading || submitting}
                                />
                            </div>
                            {category === 'other' && (
                                <div className={cx('info', 'other-subject')}>
                                    <label htmlFor="other-subject">{t('otherSubject')}</label>
                                    <input
                                        id="other-subject"
                                        required
                                        maxLength={200}
                                        value={subject}
                                        onChange={(event) => setSubject(event.target.value)}
                                        placeholder={t('otherSubjectPlaceholder')}
                                    />
                                </div>
                            )}
                        </div>
                        <div className={cx('message')}>
                            <label htmlFor="message">{t('message')}</label>
                            <textarea
                                id="message"
                                required
                                maxLength={5000}
                                rows={6}
                                placeholder={t('messagePlaceholder')}
                                value={message}
                                onChange={(event) => setMessage(event.target.value)}
                            />
                        </div>
                    </fieldset>
                    <div className={cx('captcha')}>
                        {siteKey ? (
                            <Recaptcha
                                siteKey={siteKey}
                                resetKey={resetKey}
                                onChange={setCaptchaToken}
                                language={i18n.language?.startsWith('vi') ? 'vi' : 'en'}
                                errorMessage={t('errors.captchaUnavailable')}
                            />
                        ) : (
                            <p role="alert">{t('errors.captchaUnavailable')}</p>
                        )}
                    </div>
                    {error && (
                        <p role="alert" className={cx('error')}>
                            {t(`errors.${error}`)}
                        </p>
                    )}
                    {requestId && (
                        <div className={cx('success-notice')} role="status" aria-atomic="true">
                            <FiCheckCircle className={cx('success-icon')} aria-hidden="true" />
                            <div className={cx('success-content')}>
                                <strong>{t('successTitle')}</strong>
                                <p>{t('successDescription')}</p>
                                <div className={cx('request-reference')}>
                                    <span>{t('requestIdLabel')}</span>
                                    <code>{requestId}</code>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className={cx('submit-btn-wrapper')}>
                        <button
                            type="submit"
                            className={cx('submit-btn')}
                            disabled={!siteKey || !captchaToken || profileLoading || profileError || submitting}
                        >
                            {submitting ? t('submitting') : t('submit')}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
