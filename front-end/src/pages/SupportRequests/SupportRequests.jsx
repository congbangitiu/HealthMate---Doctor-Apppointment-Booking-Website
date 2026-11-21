import { Dialog, Slide, useMediaQuery } from '@mui/material';
import GuestSupportRecovery from '../../components/GuestSupportRecovery/GuestSupportRecovery';
import socket from '../../utils/services/socket';
import { forwardRef, useContext, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authContext } from '../../context/AuthContext';
import { BASE_URL } from '../../../config';
import {
    useGuestRequests,
    guestProofs,
    endGuestSupportSession,
    guestSessionExpired,
    forgetGuestRequests,
} from '../../utils/services/supportRequests';
import {
    FiArrowLeft,
    FiArrowUpRight,
    FiCheck,
    FiClock,
    FiCopy,
    FiMessageSquare,
    FiMail,
    FiLogOut,
    FiX,
} from 'react-icons/fi';
import { FaHeadset } from 'react-icons/fa';
import Loader from '../../components/Loader/Loader';
import SupportChat from '../../components/SupportChat/SupportChat';
import styles from './SupportRequests.module.scss';

const GuestDialogTransition = forwardRef(function GuestDialogTransition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const SupportRequests = () => {
    const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
    const { token } = useContext(authContext);
    const { t, i18n } = useTranslation('supportRealtime');
    const [params, setParams] = useSearchParams();
    const selectedId = params.get('request') || '';
    const guestRequests = useGuestRequests();
    const guestCredentials = JSON.stringify(guestProofs(guestRequests));
    const guestToken = !token ? guestRequests.find((entry) => entry.id === selectedId)?.guestToken : undefined;
    const [showRecovery, setShowRecovery] = useState(false);
    const [detailRetry, setDetailRetry] = useState(0);
    const [confirmEndSession, setConfirmEndSession] = useState(false);
    const [revision, setRevision] = useState(0);
    const [conversationVisit, setConversationVisit] = useState(0);
    const [items, setItems] = useState([]);
    const [detail, setDetail] = useState(null);
    const [listLoading, setListLoading] = useState(Boolean(token) || guestRequests.length > 0);
    const [listError, setListError] = useState(false);
    const [detailError, setDetailError] = useState('');
    const [copyStatus, setCopyStatus] = useState('');
    useEffect(() => {
        setCopyStatus('');
    }, [selectedId]);
    const copyRequestId = async () => {
        const id = selectedId;
        try {
            await navigator.clipboard.writeText(id);
            if (previousSelected.current === id) setCopyStatus('copied');
        } catch {
            if (previousSelected.current === id) setCopyStatus('copyFailed');
        }
    };
    const detailHeading = useRef(null);
    const requestButtons = useRef(new Map());
    const previousSelected = useRef('');
    const selectedDetail = detail?._id === selectedId ? detail : null;
    const detailId = selectedDetail?._id;
    const guestRecoveryOnly = !token && !listLoading && !listError && items.length === 0;
    const subjectFor = (item) =>
        item.category !== 'other'
            ? t('contact:categories.' + item.category)
            : item.subject && item.subject !== item._id
              ? item.subject
              : t('supportRequest');
    const formatDate = (value) =>
        new Date(value).toLocaleDateString(i18n?.language?.startsWith('vi') ? 'vi-VN' : 'en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'Asia/Ho_Chi_Minh',
        });
    const selectRequest = (id) => {
        setParams((current) => {
            const next = new URLSearchParams(current);
            if (id) next.set('request', id);
            else next.delete('request');
            return next;
        });
        if (id) setConversationVisit((n) => n + 1);
    };
    useEffect(() => {
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
        setListLoading(Boolean(token) || JSON.parse(guestCredentials).length > 0);
    }, [token, guestCredentials]);
    useEffect(() => {
        const refresh = () => setRevision((n) => n + 1);
        socket.on('owner-support-notification', refresh);
        socket.on('guest-support-notification', refresh);
        socket.on('guest-support-changed', refresh);
        socket.on('owner-support-changed', refresh);
        socket.on('connect', refresh);
        window.addEventListener('focus', refresh);
        return () => {
            socket.off('owner-support-notification', refresh);
            socket.off('guest-support-notification', refresh);
            socket.off('guest-support-changed', refresh);
            socket.off('owner-support-changed', refresh);
            socket.off('connect', refresh);
            window.removeEventListener('focus', refresh);
        };
    }, [token]);
    useEffect(() => {
        const controller = new AbortController();
        setListError(false);
        if (!token && !JSON.parse(guestCredentials).length) {
            setItems([]);
            setListLoading(false);
            return () => controller.abort();
        }
        fetch(BASE_URL + (token ? '/contacts/mine' : '/contacts/guest-notifications'), {
            ...(token
                ? { headers: { Authorization: 'Bearer ' + token } }
                : {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ requests: JSON.parse(guestCredentials) }),
                  }),
            signal: controller.signal,
        })
            .then(async (response) => {
                if (!response.ok) throw new Error();
                return response.json();
            })
            .then((body) => {
                if (!controller.signal.aborted) {
                    if (!token && body.unavailableRequestIds?.length) forgetGuestRequests(body.unavailableRequestIds);
                    setItems((token ? body.data : body.requests) || []);
                }
            })
            .catch(() => {
                if (!controller.signal.aborted) setListError(true);
            })
            .finally(() => {
                if (!controller.signal.aborted) setListLoading(false);
            });
        return () => controller.abort();
    }, [token, revision, guestCredentials]);
    useEffect(() => {
        const controller = new AbortController();
        setDetail(null);
        setDetailError('');
        if (!selectedId) return () => controller.abort();
        fetch(`${BASE_URL}/contacts/${selectedId}/conversation`, {
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(guestToken ? { 'X-Support-Token': guestToken } : {}),
            },
            signal: controller.signal,
        })
            .then(async (response) => {
                if (!response.ok)
                    throw new Error(
                        response.status === 404
                            ? 'requestNotFound'
                            : [401, 403].includes(response.status)
                              ? 'forbidden'
                              : 'chatFailed',
                    );
                return response.json();
            })
            .then((body) => {
                if (!body.data?.request) throw new Error('chatFailed');
                if (!controller.signal.aborted) setDetail(body.data.request);
            })
            .catch((error) => {
                if (!controller.signal.aborted)
                    setDetailError(
                        ['requestNotFound', 'forbidden'].includes(error.message) ? error.message : 'chatFailed',
                    );
            });
        return () => controller.abort();
    }, [selectedId, token, guestToken, detailRetry]);
    const statusBadge = (status) =>
        status && (
            <span className={styles.status} data-status={status}>
                {t('supportManagement:statuses.' + status)}
            </span>
        );
    return (
        <main className={styles.container}>
            <header className={styles.pageHeader}>
                <div>
                    <div className={styles.titleRow}>
                        <h2>
                            {t('myRequests')}
                            {!listLoading && <span className={styles.count}> ({items.length})</span>}
                        </h2>
                    </div>
                </div>
                <Link className={styles.newRequest} to="/contact" aria-label={t('newRequest')} title={t('newRequest')}>
                    <FaHeadset className={styles.newRequestIcon} aria-hidden="true" />
                    <span className={styles.newRequestLabel}>{t('newRequest')}</span>
                </Link>
            </header>
            {!token && (
                <div className={styles.guestSession}>
                    {guestRequests.length > 0 && (
                        <div className={styles.guestTools}>
                            <button
                                type="button"
                                className={styles.guestTool}
                                onClick={() => {
                                    setConfirmEndSession(false);
                                    setShowRecovery(true);
                                }}
                                aria-haspopup="dialog"
                                aria-expanded={showRecovery}
                                aria-controls={showRecovery ? 'guest-recovery-dialog' : undefined}
                            >
                                <FiMail aria-hidden="true" />
                                {t('recoverRequests')}
                            </button>
                            <button
                                type="button"
                                className={styles.guestTool}
                                onClick={() => {
                                    setShowRecovery(false);
                                    setConfirmEndSession(true);
                                }}
                                aria-haspopup="dialog"
                                aria-expanded={confirmEndSession}
                                aria-controls={confirmEndSession ? 'guest-end-session-dialog' : undefined}
                            >
                                <FiLogOut aria-hidden="true" />
                                {t('endGuestSession')}
                            </button>
                        </div>
                    )}
                    {guestSessionExpired() && (
                        <p className={styles.sessionExpired} role="status">
                            {t('guestSessionExpired')}
                        </p>
                    )}
                    {guestRecoveryOnly && (
                        <div
                            id="guest-recovery-panel"
                            className={[styles.recoveryPanel, guestRecoveryOnly ? styles.recoveryOnly : ''].join(' ')}
                        >
                            {guestRecoveryOnly && <p className={styles.recoveryIntro}>{t('guestRecoveryIntro')}</p>}
                            <GuestSupportRecovery key={guestRequests.length > 0 ? 'active-guest' : 'fresh-guest'} />
                            <p className={styles.guestPrivacyNote}>{t('guestSharedDeviceHint')}</p>
                        </div>
                    )}
                    {guestRequests.length > 0 && (
                        <>
                            <Dialog
                                TransitionComponent={GuestDialogTransition}
                                transitionDuration={reduceMotion ? 0 : { enter: 280, exit: 200 }}
                                id="guest-recovery-dialog"
                                open={showRecovery}
                                keepMounted
                                onClose={() => setShowRecovery(false)}
                                maxWidth={false}
                                PaperProps={{ className: styles.guestDialogPaper }}
                                aria-labelledby="guest-recovery-dialog-title"
                            >
                                <GuestSupportRecovery
                                    key="recovery-dialog"
                                    titleId="guest-recovery-dialog-title"
                                    onClose={() => setShowRecovery(false)}
                                />
                            </Dialog>
                            <Dialog
                                TransitionComponent={GuestDialogTransition}
                                transitionDuration={reduceMotion ? 0 : { enter: 280, exit: 200 }}
                                id="guest-end-session-dialog"
                                open={confirmEndSession}
                                onClose={() => setConfirmEndSession(false)}
                                maxWidth={false}
                                PaperProps={{ className: styles.guestDialogPaper }}
                                aria-labelledby="guest-end-session-title"
                                aria-describedby="guest-end-session-description"
                            >
                                <div className={styles.sessionDialog}>
                                    <header className={styles.sessionDialogHeader}>
                                        <span className={styles.sessionDialogIcon}>
                                            <FiLogOut aria-hidden="true" />
                                        </span>
                                        <h3 id="guest-end-session-title">{t('endGuestSession')}</h3>
                                        <button
                                            type="button"
                                            className={styles.dialogClose}
                                            autoFocus
                                            onClick={() => setConfirmEndSession(false)}
                                            aria-label={t('close')}
                                        >
                                            <FiX aria-hidden="true" />
                                        </button>
                                    </header>
                                    <p id="guest-end-session-description">{t('endGuestSessionWarning')}</p>
                                    <footer className={styles.sessionDialogActions}>
                                        <button
                                            type="button"
                                            className={styles.sessionConfirm}
                                            onClick={() => {
                                                endGuestSupportSession();
                                                setShowRecovery(false);
                                                setConfirmEndSession(false);
                                                setItems([]);
                                                setDetail(null);
                                                selectRequest('');
                                            }}
                                        >
                                            {t('endGuestSessionConfirm')}
                                        </button>
                                    </footer>
                                </div>
                            </Dialog>
                        </>
                    )}
                </div>
            )}
            {listError && (
                <div className={styles.loadError} role="alert">
                    <p>{t('chatFailed')}</p>
                    <button
                        type="button"
                        className={styles.backButton}
                        onClick={() => setRevision((value) => value + 1)}
                    >
                        {t('retry')}
                    </button>
                </div>
            )}
            {selectedId && (
                <button className={styles.backButton} type="button" onClick={() => selectRequest('')}>
                    <FiArrowLeft aria-hidden="true" />
                    {t('backToRequests')}
                </button>
            )}
            <div className={[styles.layout, selectedId && !guestRecoveryOnly ? styles.withDetail : ''].join(' ')}>
                {!guestRecoveryOnly && (
                    <nav className={styles.requestList} aria-label={t('myRequests')}>
                        {listLoading ? (
                            <div className={styles.listLoading}>
                                <Loader iconSize={10} />
                            </div>
                        ) : !items.length && !listError ? (
                            <div className={styles.empty}>
                                <FiMessageSquare aria-hidden="true" />
                                <h3>{t('noRequests')}</h3>
                                <p>{t('emptyRequestsDescription')}</p>
                            </div>
                        ) : (
                            items.map((item) => (
                                <button
                                    type="button"
                                    key={item._id}
                                    ref={(element) => {
                                        if (element) requestButtons.current.set(item._id, element);
                                        else requestButtons.current.delete(item._id);
                                    }}
                                    className={[styles.requestCard, selectedId === item._id ? styles.active : ''].join(
                                        ' ',
                                    )}
                                    aria-current={selectedId === item._id ? 'true' : undefined}
                                    onClick={() => selectRequest(item._id)}
                                >
                                    <span className={styles.cardTop}>
                                        <span className={styles.cardTitleGroup}>
                                            <strong className={styles.cardTitle}>{subjectFor(item)}</strong>
                                            <FiArrowUpRight className={styles.cardArrow} aria-hidden="true" />
                                        </span>
                                        {item.ownerNotificationRead === false && (
                                            <span className={styles.unread}>{t('unread')}</span>
                                        )}
                                    </span>
                                    <span className={styles.requestId}>#{item._id}</span>
                                    {item.preview && <span className={styles.preview}>{item.preview}</span>}
                                    <span className={styles.cardFooter}>
                                        <span className={styles.cardDate}>
                                            {item.createdAt && (
                                                <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
                                            )}
                                        </span>
                                        {statusBadge(item.status)}
                                    </span>
                                </button>
                            ))
                        )}
                    </nav>
                )}
                {selectedId && (
                    <section className={styles.conversation} aria-label={t('requestDetails')}>
                        {detailError ? (
                            <div className={styles.loadError} role="alert">
                                <p>{t(detailError)}</p>
                                {detailError === 'chatFailed' && (
                                    <button
                                        type="button"
                                        className={styles.backButton}
                                        onClick={() => setDetailRetry((value) => value + 1)}
                                    >
                                        {t('retry')}
                                    </button>
                                )}
                            </div>
                        ) : selectedDetail ? (
                            <>
                                <div className={styles.issue}>
                                    <div className={styles.issueTop}>
                                        <h3 ref={detailHeading} tabIndex={-1}>
                                            {subjectFor(selectedDetail)}
                                        </h3>
                                        {statusBadge(selectedDetail.status)}
                                    </div>
                                    <div className={styles.issueMeta}>
                                        <span className={styles.reference}>
                                            <span>
                                                {t('supportManagement:id')}:{' '}
                                                <span className={styles.idValue}>#{selectedDetail._id}</span>
                                            </span>
                                            <button
                                                type="button"
                                                className={styles.copyButton}
                                                onClick={copyRequestId}
                                                aria-label={t(
                                                    'supportManagement:' +
                                                        (copyStatus === 'copied' ? 'copied' : 'copyId'),
                                                )}
                                                title={t(
                                                    'supportManagement:' +
                                                        (copyStatus === 'copied' ? 'copied' : 'copyId'),
                                                )}
                                            >
                                                {copyStatus === 'copied' ? (
                                                    <FiCheck aria-hidden="true" />
                                                ) : (
                                                    <FiCopy aria-hidden="true" />
                                                )}
                                            </button>
                                        </span>
                                        {selectedDetail.createdAt && (
                                            <span className={styles.detailDate}>
                                                <FiClock aria-hidden="true" />
                                                <time dateTime={selectedDetail.createdAt}>
                                                    {formatDate(selectedDetail.createdAt)}
                                                </time>
                                            </span>
                                        )}
                                    </div>
                                    {copyStatus === 'copyFailed' && (
                                        <p role="alert" className={styles.error}>
                                            {t('supportManagement:copyFailed')}
                                        </p>
                                    )}
                                    <div className={styles.issueBody}>
                                        <h4>{t('supportManagement:message')}</h4>
                                        <p>{selectedDetail.message}</p>
                                    </div>
                                </div>
                                <SupportChat
                                    key={selectedId + ':' + conversationVisit}
                                    requestId={selectedId}
                                    token={token || undefined}
                                    guestToken={guestToken}
                                    onRequestChange={setDetail}
                                />
                            </>
                        ) : (
                            <div className={styles.detailLoading}>
                                <Loader iconSize={10} />
                            </div>
                        )}
                    </section>
                )}
            </div>
        </main>
    );
};
export default SupportRequests;
