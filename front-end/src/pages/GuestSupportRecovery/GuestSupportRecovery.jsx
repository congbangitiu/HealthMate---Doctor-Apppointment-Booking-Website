import { useContext, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authContext } from '../../context/AuthContext';
import { BASE_URL } from '../../../config';
import {
    rememberGuestRequests,
    captureRecoveryToken,
    clearPendingRecovery,
    updatePendingRecoveryExpiry,
} from '../../utils/services/supportRequests';
import GuestSupportRecoveryForm from '../../components/GuestSupportRecovery/GuestSupportRecovery';
import Loader from '../../components/Loader/Loader';
import styles from './GuestSupportRecovery.module.scss';
const GuestSupportRecovery = () => {
    const { t, i18n } = useTranslation('supportRealtime');
    const { token: accountToken } = useContext(authContext);
    const location = useLocation();
    const navigate = useNavigate();
    const [token] = useState(() => captureRecoveryToken(location.hash));
    const [inspectionRetry, setInspectionRetry] = useState(0);
    const [status, setStatus] = useState('loading');
    const submitting = useRef(null);
    useEffect(() => () => submitting.current?.abort(), []);
    useEffect(() => {
        const language = new URLSearchParams(location.search).get('language');
        if (language === 'vi' || language === 'en') void i18n.changeLanguage(language);
    }, [location.search, i18n]);
    useEffect(() => {
        if (location.hash) navigate({ pathname: location.pathname, search: location.search }, { replace: true });
    }, [location.hash, location.pathname, location.search, navigate]);
    useEffect(() => {
        if (!/^[a-f0-9]{64}$/.test(token)) {
            setStatus('invalid');
            return;
        }
        const controller = new AbortController();
        fetch(BASE_URL + '/contacts/guest-recovery/inspect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
            signal: controller.signal,
        })
            .then(async (response) => {
                if (controller.signal.aborted) return;
                if (!response.ok) {
                    if (response.status === 400) clearPendingRecovery(token);
                    setStatus(response.status === 400 ? 'invalid' : 'error');
                    return;
                }
                const body = await response.json();
                if (controller.signal.aborted) return;
                updatePendingRecoveryExpiry(token, body.expiresAt);
                if (['vi', 'en'].includes(body.language)) await i18n.changeLanguage(body.language);
                if (!controller.signal.aborted) setStatus('ready');
            })
            .catch(() => {
                if (!controller.signal.aborted) setStatus('error');
            });
        return () => controller.abort();
    }, [token, i18n, inspectionRetry]);
    const confirm = async () => {
        if (submitting.current || accountToken) return;
        const controller = new AbortController();
        submitting.current = controller;
        setStatus('confirming');
        try {
            const response = await fetch(BASE_URL + '/contacts/guest-recovery/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
                signal: controller.signal,
            });
            const body = await response.json();
            if (controller.signal.aborted) return;
            if (!response.ok) {
                if (response.status === 400) clearPendingRecovery(token);
                setStatus(response.status === 400 ? 'invalid' : 'confirm-error');
                return;
            }
            if (!Array.isArray(body.data?.requests) || !body.data.requests.length) throw new Error('invalid response');
            rememberGuestRequests(body.data.requests, body.data.expiresAt);
            clearPendingRecovery(token);
            navigate('/support-requests', { replace: true });
        } catch {
            if (!controller.signal.aborted) setStatus('confirm-error');
        } finally {
            if (submitting.current === controller) submitting.current = null;
        }
    };
    return (
        <main className={styles.container}>
            <section className={styles.card}>
                <h2>{t('recoveryTitle')}</h2>
                {accountToken ? (
                    <p role="status">{t('recoverySignedIn')}</p>
                ) : status === 'loading' ? (
                    <Loader iconSize={10} />
                ) : ['ready', 'confirming'].includes(status) ? (
                    <>
                        <p>{t('recoveryConfirmDescription')}</p>
                        <button
                            className={styles.confirm}
                            type="button"
                            disabled={status === 'confirming'}
                            onClick={confirm}
                        >
                            {t(status === 'confirming' ? 'recoveryOpening' : 'recoveryContinue')}
                        </button>
                    </>
                ) : ['error', 'confirm-error'].includes(status) ? (
                    <>
                        <p role="alert" className={styles.error}>
                            {t('recoveryUnavailable')}
                        </p>
                        <button
                            type="button"
                            className={styles.confirm}
                            onClick={() => {
                                if (status === 'confirm-error') void confirm();
                                else {
                                    setStatus('loading');
                                    setInspectionRetry((value) => value + 1);
                                }
                            }}
                        >
                            {t('retry')}
                        </button>
                    </>
                ) : (
                    <>
                        <p role="alert" className={status === 'invalid' ? styles.error : undefined}>
                            {t(status === 'invalid' ? 'recoveryInvalid' : 'recoveryUnavailable')}
                        </p>
                        <GuestSupportRecoveryForm embedded />
                    </>
                )}
                <Link className={styles.back} to="/support-requests">
                    {t('backToRequests')}
                </Link>
            </section>
        </main>
    );
};
export default GuestSupportRecovery;
