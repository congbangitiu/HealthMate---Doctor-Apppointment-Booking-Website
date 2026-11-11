import { useContext, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authContext } from '../../context/AuthContext';
import { BASE_URL } from '../../../config';
import { getGuestRequests, guestTokenFor } from '../../utils/services/supportRequests';
import SupportChat from '../../components/SupportChat/SupportChat';
import styles from './SupportRequests.module.scss';

const SupportRequests = () => {
    const { token } = useContext(authContext);
    const { t } = useTranslation('supportRealtime');
    const [params, setParams] = useSearchParams();
    const selectedId = params.get('request') || '';
    const guestToken = guestTokenFor(selectedId);
    const [items, setItems] = useState([]);
    const [detail, setDetail] = useState(null);
    const [error, setError] = useState(false);
    useEffect(() => {
        const controller = new AbortController();
        setItems([]); setError(false);
        if (!token) { setItems(getGuestRequests().map((entry) => ({ _id: entry.id, category: 'other', subject: entry.id }))); return () => controller.abort(); }
        fetch(`${BASE_URL}/contacts/mine`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
            .then(async (response) => { if (!response.ok) throw new Error(); return response.json(); })
            .then((body) => { if (!controller.signal.aborted) {
                const guests = getGuestRequests().map((entry) => ({ _id: entry.id, category: 'other', subject: entry.id }));
                setItems([...new Map([...body.data, ...guests].map((item) => [item._id, item])).values()]);
            } })
            .catch(() => { if (!controller.signal.aborted) setError(true); });
        return () => controller.abort();
    }, [token]);
    useEffect(() => {
        const controller = new AbortController();
        setDetail(null); setError(false);
        if (!selectedId) return () => controller.abort();
        fetch(`${BASE_URL}/contacts/${selectedId}/conversation`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(guestToken ? { 'X-Support-Token': guestToken } : {}) },
            signal: controller.signal,
        }).then(async (response) => { if (!response.ok) throw new Error(); return response.json(); })
            .then((body) => { if (!controller.signal.aborted) setDetail(body.data.request); })
            .catch(() => { if (!controller.signal.aborted) setError(true); });
        return () => controller.abort();
    }, [selectedId, token, guestToken]);
    return <main className={styles.container}>
        <header><h2>{t('myRequests')}</h2><Link to="/contact">{t('newRequest')}</Link></header>
        {!token && <p>{t('guestHint')}</p>}
        {error && <p role="alert">{t('forbidden')}</p>}
        <div className={styles.layout}>
            <nav aria-label={t('myRequests')}>{!items.length && <p>{t('noRequests')}</p>}{items.map((item) => <button type="button" key={item._id}
                className={selectedId === item._id ? styles.active : ''} onClick={() => setParams({ request: item._id })}>
                <strong>{item.category === 'other' ? item.subject : t('contact:categories.' + item.category)}</strong><span>{item._id}</span>
            </button>)}</nav>
            <div className={styles.conversation}>{detail ? <>
                <div className={styles.issue}><h3>{detail.category === 'other' ? detail.subject : t('contact:categories.' + detail.category)}</h3><p>{detail.message}</p></div>
                <SupportChat key={selectedId} requestId={selectedId} token={token || undefined} guestToken={guestToken} />
            </> : !error && <p>{t(selectedId ? 'loading' : 'selectRequest')}</p>}</div>
        </div>
    </main>;
};
export default SupportRequests;
