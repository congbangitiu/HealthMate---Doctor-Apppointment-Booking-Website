import socket from '../../utils/services/socket';
import { useContext, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authContext } from '../../context/AuthContext';
import { BASE_URL } from '../../../config';
import { getGuestRequests, guestTokenFor } from '../../utils/services/supportRequests';
import { FiArrowLeft, FiArrowUpRight, FiMessageSquare } from 'react-icons/fi';
import { FaHeadset } from 'react-icons/fa';
import Loader from '../../components/Loader/Loader';
import SupportChat from '../../components/SupportChat/SupportChat';
import styles from './SupportRequests.module.scss';

const SupportRequests = () => {
    const { token } = useContext(authContext);
    const { t, i18n } = useTranslation('supportRealtime');
    const [params, setParams] = useSearchParams();
    const selectedId = params.get('request') || '';
    const guestToken = guestTokenFor(selectedId);
    const [revision, setRevision] = useState(0);
    const [conversationVisit, setConversationVisit] = useState(0);
    const [items, setItems] = useState([]);
    const [detail, setDetail] = useState(null);
    const [listLoading, setListLoading] = useState(Boolean(token));
    const [listError, setListError] = useState(false);
    const [detailError, setDetailError] = useState(false);
    const detailHeading = useRef(null);
    const requestButtons = useRef(new Map());
    const previousSelected = useRef('');
    const selectedDetail = detail?._id === selectedId ? detail : null;
    const detailId = selectedDetail?._id;
    const subjectFor = (item) => item.category !== 'other'
        ? t('contact:categories.' + item.category)
        : item.subject && item.subject !== item._id ? item.subject : t('supportRequest');
    const formatDate = (value) => new Date(value).toLocaleDateString(
        i18n?.language?.startsWith('vi') ? 'vi-VN' : 'en-US',
        { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' },
    );
    const selectRequest = (id) => {
        setParams((current) => {
            const next = new URLSearchParams(current);
            if (id) next.set('request', id); else next.delete('request');
            return next;
        });
        if (id) setConversationVisit((n) => n + 1);
    };
    useEffect(() => {
        if (!selectedId) return;
        const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
        window.scrollTo({ top: 0, left: 0, behavior: reducedMotion ? 'instant' : 'smooth' });
    }, [selectedId]);
    useEffect(() => {
        if (selectedId) {
            previousSelected.current = selectedId;
            if (detailId) detailHeading.current?.focus({ preventScroll: true });
        } else if (previousSelected.current) {
            requestButtons.current.get(previousSelected.current)?.focus({ preventScroll: true });
            previousSelected.current = '';
        }
    }, [selectedId, detailId]);
    useEffect(() => {
        setItems([]);
        setListLoading(Boolean(token));
    }, [token]);
    useEffect(() => {
        if (!token) return;
        const refresh = () => setRevision((n) => n + 1);
        socket.on('owner-support-notification', refresh);
        socket.on('owner-support-changed', refresh);
        socket.on('connect', refresh);
        window.addEventListener('focus', refresh);
        return () => {
            socket.off('owner-support-notification', refresh);
            socket.off('owner-support-changed', refresh);
            socket.off('connect', refresh);
            window.removeEventListener('focus', refresh);
        };
    }, [token]);
    useEffect(() => {
        const controller = new AbortController();
        setListError(false);
        if (!token) {
            setItems(getGuestRequests().map((entry) => ({ _id: entry.id, category: 'other', subject: entry.id })));
            setListLoading(false);
            return () => controller.abort();
        }
        fetch(`${BASE_URL}/contacts/mine`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
            .then(async (response) => {
                if (!response.ok) throw new Error();
                return response.json();
            })
            .then((body) => {
                if (!controller.signal.aborted) {
                    const guests = getGuestRequests().map((entry) => ({
                        _id: entry.id,
                        category: 'other',
                        subject: entry.id,
                    }));
                    setItems([...new Map([...body.data, ...guests].map((item) => [item._id, item])).values()]);
                }
            })
            .catch(() => {
                if (!controller.signal.aborted) setListError(true);
            }).finally(() => { if (!controller.signal.aborted) setListLoading(false); });
        return () => controller.abort();
    }, [token, revision]);
    useEffect(() => {
        const controller = new AbortController();
        setDetail(null);
        setDetailError(false);
        if (!selectedId) return () => controller.abort();
        fetch(`${BASE_URL}/contacts/${selectedId}/conversation`, {
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(guestToken ? { 'X-Support-Token': guestToken } : {}),
            },
            signal: controller.signal,
        })
            .then(async (response) => {
                if (!response.ok) throw new Error();
                return response.json();
            })
            .then((body) => {
                if (!controller.signal.aborted) setDetail(body.data.request);
            })
            .catch(() => {
                if (!controller.signal.aborted) setDetailError(true);
            });
        return () => controller.abort();
    }, [selectedId, token, guestToken]);
    const statusBadge = (status) => status && (
        <span className={styles.status} data-status={status}>{t('supportManagement:statuses.' + status)}</span>
    );
    return (
        <main className={styles.container}>
            <header className={styles.pageHeader}>
                <div>
                    <div className={styles.titleRow}>
                        <h2>{t('myRequests')}{!listLoading && <span className={styles.count}> ({items.length})</span>}</h2>
                    </div>
                </div>
                <Link className={styles.newRequest} to="/contact" aria-label={t('newRequest')} title={t('newRequest')}>
                    <FaHeadset className={styles.newRequestIcon} aria-hidden="true" />
                    <span className={styles.newRequestLabel}>{t('newRequest')}</span>
                </Link>
            </header>
            {!token && <p className={styles.guestHint}>{t('guestHint')}</p>}
            {listError && <p className={styles.error} role="alert">{t('chatFailed')}</p>}
            {selectedId && (
                <button className={styles.backButton} type="button" onClick={() => selectRequest('')}>
                    <FiArrowLeft aria-hidden="true" />{t('backToRequests')}
                </button>
            )}
            <div className={[styles.layout, selectedId ? styles.withDetail : ''].join(' ')}>
                <nav className={styles.requestList} aria-label={t('myRequests')}>
                    {listLoading ? <div className={styles.listLoading}><Loader iconSize={10} /></div>
                        : !items.length && !listError ? (
                            <div className={styles.empty}>
                                <FiMessageSquare aria-hidden="true" />
                                <h3>{t('noRequests')}</h3>
                                <p>{t('emptyRequestsDescription')}</p>
                                <Link to="/contact">{t('newRequest')} <FiArrowUpRight aria-hidden="true" /></Link>
                            </div>
                        ) : items.map((item) => (
                            <button
                                type="button" key={item._id}
                                ref={(element) => { if (element) requestButtons.current.set(item._id, element); else requestButtons.current.delete(item._id); }}
                                className={[styles.requestCard, selectedId === item._id ? styles.active : ''].join(' ')}
                                aria-current={selectedId === item._id ? 'true' : undefined}
                                onClick={() => selectRequest(item._id)}
                            >
                                <span className={styles.cardTop}>
                                    <span className={styles.cardTitleGroup}>
                                        <strong className={styles.cardTitle}>{subjectFor(item)}</strong>
                                        <FiArrowUpRight className={styles.cardArrow} aria-hidden="true" />
                                    </span>
                                    {item.ownerNotificationRead === false && <span className={styles.unread}>{t('unread')}</span>}
                                </span>
                                <span className={styles.requestId}>{item._id}</span>
                                {item.preview && <span className={styles.preview}>{item.preview}</span>}
                                <span className={styles.cardFooter}>
                                    <span className={styles.cardDate}>
                                        {item.createdAt && <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>}
                                    </span>
                                    {statusBadge(item.status)}
                                </span>
                            </button>
                        ))}
                </nav>
                {selectedId && (
                    <section className={styles.conversation} aria-label={t('requestDetails')}>
                        {detailError ? <p className={styles.error} role="alert">{t('forbidden')}</p>
                            : selectedDetail ? (
                                <>
                                    <div className={styles.issue}>
                                        <div className={styles.issueTop}>
                                            <h3 ref={detailHeading} tabIndex={-1}>{subjectFor(selectedDetail)}</h3>
                                            {statusBadge(selectedDetail.status)}
                                        </div>
                                        <div className={styles.issueMeta}>
                                            <span>{t('supportManagement:id')}: {selectedDetail._id}</span>
                                            {selectedDetail.createdAt && <span><time dateTime={selectedDetail.createdAt}>{formatDate(selectedDetail.createdAt)}</time></span>}
                                        </div>
                                        <div className={styles.issueBody}>
                                            <h4>{t('supportManagement:message')}</h4>
                                            <p>{selectedDetail.message}</p>
                                        </div>
                                    </div>
                                    <SupportChat
                                        key={selectedId + ':' + conversationVisit}
                                        requestId={selectedId} token={token || undefined} guestToken={guestToken} embedded
                                        onRequestChange={setDetail}
                                    />
                                </>
                            ) : <div className={styles.detailLoading}><Loader iconSize={10} /></div>}
                    </section>
                )}
            </div>
        </main>
    );
};
export default SupportRequests;
