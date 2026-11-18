import { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FiArrowRight, FiArrowUpRight, FiCheck, FiClock, FiLoader, FiMail, FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { BASE_URL } from '../../../config';
import styles from './GuestSupportRecovery.module.scss';

const GuestSupportRecovery = ({ collapsible = false, onClose, embedded = false, titleId: suppliedTitleId }) => {
    const { t, i18n } = useTranslation('supportRealtime');
    const generatedTitleId = useId();
    const titleId = suppliedTitleId || generatedTitleId;
    const [expanded, setExpanded] = useState(!collapsible);
    const [email, setEmail] = useState('');
    const [sentEmail, setSentEmail] = useState('');
    const [status, setStatus] = useState('');
    const [view, setView] = useState('form');
    const [retryAt, setRetryAt] = useState(0);
    const [remaining, setRemaining] = useState(0);
    const inFlight = useRef(null);
    const input = useRef(null);
    const focusEmail = useRef(false);
    const confirmation = useRef(null);
    const isSending = status === 'sending';
    const waiting = remaining > 0;
    useEffect(() => () => inFlight.current?.abort(), []);
    useEffect(() => {
        if (!retryAt) return;
        let timer;
        const update = () => {
            const seconds = Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
            setRemaining(seconds);
            if (!seconds) clearInterval(timer);
        };
        update();
        if (Date.now() >= retryAt) return;
        timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    }, [retryAt]);
    useEffect(() => {
        if (view === 'confirmation') confirmation.current?.focus({ preventScroll: true });
        else if (focusEmail.current) {
            input.current?.focus();
            focusEmail.current = false;
        }
    }, [view]);
    const send = async (event) => {
        event.preventDefault();
        if (inFlight.current || Date.now() < retryAt) return;
        const controller = new AbortController();
        inFlight.current = controller;
        setStatus('sending');
        const destination = email.trim();
        try {
            const response = await fetch(BASE_URL + '/contacts/guest-recovery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    email: destination,
                    language: (i18n.resolvedLanguage || i18n.language)?.startsWith('vi') ? 'vi' : 'en',
                }),
            });
            if (controller.signal.aborted) return;
            if (!response.ok) throw new Error('request failed');
            setSentEmail(destination);
            setStatus('sent');
            setView('confirmation');
            setRemaining(60);
            setRetryAt(Date.now() + 60000);
        } catch {
            if (!controller.signal.aborted) setStatus('error');
        } finally {
            if (inFlight.current === controller) inFlight.current = null;
        }
    };
    const clock = [Math.floor(remaining / 60), remaining % 60].map((value) => String(value).padStart(2, '0')).join(':');
    if (collapsible && !expanded)
        return (
            <button type="button" className={styles.reveal} onClick={() => setExpanded(true)} aria-expanded={false}>
                <FiMail aria-hidden="true" />
                {t('recoveryOtherRequests')}
                <FiArrowUpRight aria-hidden="true" />
            </button>
        );
    return (
        <section
            className={[styles.card, embedded ? styles.embedded : ''].join(' ')}
            aria-labelledby={embedded ? undefined : titleId}
        >
            {!embedded && (
                <header className={styles.header}>
                    <span className={styles.mailIcon}>
                        <FiMail aria-hidden="true" />
                        {view === 'confirmation' && (
                            <span className={styles.check}>
                                <FiCheck aria-hidden="true" />
                            </span>
                        )}
                    </span>
                    <div className={styles.heading}>
                        <h3 id={titleId}>{t(view === 'confirmation' ? 'recoveryCheckInbox' : 'recoverRequests')}</h3>
                        <p>{t(view === 'confirmation' ? 'recoveryInboxHint' : 'recoveryShortDescription')}</p>
                    </div>
                    {(collapsible || onClose) && (
                        <button
                            type="button"
                            className={styles.close}
                            aria-label={t('close')}
                            disabled={isSending}
                            onClick={() => (onClose ? onClose() : setExpanded(false))}
                        >
                            <FiX aria-hidden="true" />
                        </button>
                    )}
                </header>
            )}
            {view === 'form' ? (
                <form className={styles.form} onSubmit={send}>
                    <label htmlFor={titleId + '-email'}>{t('recoveryEmail')}</label>
                    <div className={styles.inputRow}>
                        <input
                            id={titleId + '-email'}
                            ref={input}
                            type="email"
                            autoComplete="email"
                            required
                            maxLength={254}
                            value={email}
                            placeholder="name@example.com"
                            onChange={(event) => setEmail(event.target.value)}
                            disabled={isSending}
                        />
                        <button className={styles.primary} type="submit" disabled={isSending || waiting}>
                            {isSending ? <FiLoader className={styles.spinner} aria-hidden="true" /> : null}
                            {t(isSending ? 'recoverySending' : 'recoverySend')}
                            {!isSending && <FiArrowRight aria-hidden="true" />}
                        </button>
                    </div>
                    <p className={styles.note}>
                        <FiClock aria-hidden="true" />
                        {waiting ? t('recoveryCountdown', { time: clock }) : t('recoveryExpiryHint')}
                    </p>
                </form>
            ) : (
                <div className={styles.confirmation}>
                    <div className={styles.receipt} ref={confirmation} tabIndex={-1} role="status">
                        <p>
                            {t('recoverySentIntro')} <strong>{sentEmail}</strong>
                            {t('recoverySentOutro')}
                        </p>
                        <span className={styles.note}>
                            <FiClock aria-hidden="true" />
                            {t('recoveryExpiryHint')}
                        </span>
                    </div>
                    <div className={styles.actions}>
                        <div className={styles.resend}>
                            <button
                                type="button"
                                className={styles.textButton}
                                onClick={send}
                                disabled={isSending || waiting}
                            >
                                {isSending && <FiLoader className={styles.spinner} aria-hidden="true" />}
                                {t(isSending ? 'recoverySending' : 'recoveryResend')}
                            </button>
                            {waiting && (
                                <span className={styles.countdown}>
                                    <FiClock aria-hidden="true" />
                                    {t('recoveryCountdown', { time: clock })}
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            className={styles.textButton}
                            disabled={isSending}
                            onClick={() => {
                                focusEmail.current = true;
                                setStatus('');
                                setView('form');
                            }}
                        >
                            {t('recoveryChangeEmail')}
                        </button>
                    </div>
                </div>
            )}
            {status === 'error' && (
                <p role="alert" className={styles.error}>
                    {t('recoveryUnavailable')}
                </p>
            )}
        </section>
    );
};
GuestSupportRecovery.propTypes = {
    collapsible: PropTypes.bool,
    onClose: PropTypes.func,
    embedded: PropTypes.bool,
    titleId: PropTypes.string,
};
export default GuestSupportRecovery;
