import socket from '../../../utils/services/socket';
import SupportChat from '../../../components/SupportChat/SupportChat';
import { forwardRef, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Slide, useMediaQuery } from '@mui/material';
import { FiCheck, FiCopy, FiX } from 'react-icons/fi';
import Select from 'react-select';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames/bind';
import { authContext } from '../../../context/AuthContext';
import { BASE_URL } from '../../../../config';
import Loader from '../../../components/Loader/Loader';
import Pagination from '../../../components/Pagination/Pagination';
import AdminSearch from '../AdminSearch/AdminSearch';
import { getSelectionStyles } from '../../../components/Selections/selectStyles';
import styles from './SupportManagement.module.scss';

const MobileDialogTransition = forwardRef(function MobileDialogTransition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});
const cx = classNames.bind(styles);
const statuses = ['new', 'in-progress', 'resolved', 'spam'];
const selectionStyles = getSelectionStyles('100%');
const detailSelectionStyles = {
    ...selectionStyles,
    control: (provided, state) => ({
        ...selectionStyles.control(provided, state),
        minWidth: 0,
        border:
            state.isFocused || state.menuIsOpen ? '2px solid var(--primaryColor)' : '2px solid var(--darkGrayColor)',
    }),
};

const SupportManagement = () => {
    const isMobileDialog = useMediaQuery('(max-width:768px)');
    const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
    const { t, i18n } = useTranslation('supportManagement');
    const { token, user } = useContext(authContext);
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedId = searchParams.get('request') || '';
    const [query, setQuery] = useState('');
    const [filters, setFilters] = useState({ q: '', status: '', from: '', to: '' });
    const [page, setPage] = useState(1);
    const [reload, setReload] = useState(0);
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState('');
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');
    const [draftStatus, setDraftStatus] = useState('new');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [copyStatus, setCopyStatus] = useState('');
    const [detailReload, setDetailReload] = useState(0);
    const saveLock = useRef(false);
    const activeRequest = useRef(selectedId);
    activeRequest.current = selectedId;
    const [limit, setLimit] = useState(10);
    const isVietnamese = i18n.language?.startsWith('vi');
    const locale = isVietnamese ? 'vi-VN' : 'en-US';
    const formatDate = (value) =>
        new Date(value).toLocaleDateString(locale, {
            timeZone: 'Asia/Ho_Chi_Minh',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    const formatTime = (value) =>
        new Date(value).toLocaleTimeString(locale, {
            timeZone: 'Asia/Ho_Chi_Minh',
            hour: '2-digit',
            minute: '2-digit',
            hour12: !isVietnamese,
        });
    const date = (value) => formatDate(value) + ' · ' + formatTime(value);
    const api = useCallback(
        async (path, options = {}) => {
            const response = await fetch(`${BASE_URL}/contacts${path}`, {
                ...options,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            });
            const result = await response.json();
            if (!response.ok) {
                const error = new Error(result.code || 'loadFailed');
                error.code = response.status === 401 || response.status === 403 ? 'forbidden' : result.code;
                throw error;
            }
            return result;
        },
        [token],
    );

    useEffect(() => {
        if (query.trim() === filters.q) return;
        const timer = setTimeout(() => {
            setFilters((current) => ({ ...current, q: query.trim() }));
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [query, filters.q]);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setListError('');
        const load = async () => {
            try {
                const params = new URLSearchParams({ ...filters, page: String(page), limit: String(limit) });
                const result = await api('?' + params, { signal: controller.signal });
                if (controller.signal.aborted) return;
                const lastPage = Math.max(1, Math.ceil(result.total / limit));
                if (page > lastPage) {
                    setPage(lastPage);
                    return;
                }
                setItems(result.data);
                setTotal(result.total);
            } catch (error) {
                if (!controller.signal.aborted) setListError(error.code || 'loadFailed');
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };
        load();
        return () => controller.abort();
    }, [api, filters, page, limit, reload]);

    useEffect(() => {
        if (!selectedId) {
            setDetail(null);
            return;
        }
        const controller = new AbortController();
        setDetail(null);
        setDetailLoading(true);
        setDetailError('');
        setSaved(false);
        const load = async () => {
            try {
                const result = await api('/' + selectedId + '/read', { method: 'POST', signal: controller.signal });
                if (controller.signal.aborted) return;
                setDetail(result.data);
                setDraftStatus(result.data.status);
                setReload((n) => n + 1);
                setItems((current) =>
                    current.map((item) => (item._id === selectedId ? { ...item, isRead: true } : item)),
                );
            } catch (error) {
                if (!controller.signal.aborted) setDetailError(error.code || 'loadFailed');
            } finally {
                if (!controller.signal.aborted) setDetailLoading(false);
            }
        };
        load();
        return () => controller.abort();
    }, [api, selectedId, detailReload]);

    useEffect(() => {
        setNote('');
        setCopyStatus('');
    }, [selectedId]);

    const copyRequestId = async () => {
        if (!detail) return;
        const id = detail._id;
        try {
            await navigator.clipboard.writeText(id);
            if (activeRequest.current === id) setCopyStatus('copied');
        } catch {
            if (activeRequest.current === id) setCopyStatus('copyFailed');
        }
    };

    useEffect(() => {
        let timer;
        const refresh = () => {
            clearTimeout(timer);
            timer = setTimeout(() => setReload((n) => n + 1), 150);
        };
        const visible = () => {
            if (!document.hidden) refresh();
        };
        socket.on('support-notification', refresh);
        socket.on('support-requests-changed', refresh);
        socket.on('connect', refresh);
        window.addEventListener('focus', visible);
        return () => {
            clearTimeout(timer);
            socket.off('support-notification', refresh);
            socket.off('support-requests-changed', refresh);
            socket.off('connect', refresh);
            window.removeEventListener('focus', visible);
        };
    }, []);

    const selectRequest = (id) => {
        setNote('');
        setDetailError('');
        setSaved(false);
        setSearchParams((current) => {
            const next = new URLSearchParams(current);
            if (id) next.set('request', id);
            else next.delete('request');
            return next;
        });
    };
    const changeFilter = (name, value) => {
        setFilters((current) => ({ ...current, [name]: value }));
        setPage(1);
    };
    const save = async (assignment) => {
        if (!detail || saveLock.current) return;
        const id = detail._id;
        saveLock.current = true;
        setSaving(true);
        setSaved(false);
        setDetailError('');
        try {
            const result = await api('/' + id, {
                method: 'PATCH',
                body: JSON.stringify({
                    version: detail.__v,
                    ...(assignment
                        ? { assignment }
                        : {
                              status: draftStatus,
                              ...(note.trim() ? { note: note.trim() } : {}),
                          }),
                }),
            });
            if (activeRequest.current !== id) return;
            setDetail(result.data);
            setDraftStatus(result.data.status);
            if (!assignment) setNote('');
            setSaved(true);
            setReload((n) => n + 1);
        } catch (error) {
            if (activeRequest.current === id) setDetailError(error.code || 'saveFailed');
        } finally {
            saveLock.current = false;
            setSaving(false);
        }
    };
    const statusOptions = statuses.map((value) => ({ value, label: t('statuses.' + value) }));
    const ownAssignment = detail?.assignee?.id === user?._id;
    const errorText = (code) =>
        t(
            'errors.' +
                ([
                    'invalidFilters',
                    'invalidId',
                    'notFound',
                    'invalidUpdate',
                    'conflict',
                    'alreadyAssigned',
                    'forbidden',
                    'saveFailed',
                ].includes(code)
                    ? code
                    : 'loadFailed'),
        );

    return (
        <section className={cx('container')}>
            <AdminSearch title={t('title')} total={total} placeholder={t('search')} query={query} setQuery={setQuery} />
            <div className={cx('filters')}>
                <div>
                    <label htmlFor="support-status">{t('status')}</label>
                    <Select
                        inputId="support-status"
                        instanceId="support-status"
                        styles={selectionStyles}
                        options={[{ value: '', label: t('allStatuses') }, ...statusOptions]}
                        value={
                            statusOptions.find((option) => option.value === filters.status) || {
                                value: '',
                                label: t('allStatuses'),
                            }
                        }
                        onChange={(option) => changeFilter('status', option.value)}
                        isSearchable={false}
                    />
                </div>
                <div>
                    <label htmlFor="support-from">{t('from')}</label>
                    <input
                        id="support-from"
                        type="date"
                        value={filters.from}
                        max={filters.to || undefined}
                        onChange={(e) => changeFilter('from', e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="support-to">{t('to')}</label>
                    <input
                        id="support-to"
                        type="date"
                        value={filters.to}
                        min={filters.from || undefined}
                        onChange={(e) => changeFilter('to', e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="support-page-size">{t('requestsPerPage')}</label>
                    <Select
                        inputId="support-page-size"
                        instanceId="support-page-size"
                        styles={selectionStyles}
                        options={[5, 10, 20].map((value) => ({ value, label: String(value) }))}
                        value={{ value: limit, label: String(limit) }}
                        onChange={(option) => {
                            setLimit(option.value);
                            setPage(1);
                        }}
                        isSearchable={false}
                    />
                </div>
                <button type="button" onClick={() => setReload((n) => n + 1)} disabled={loading}>
                    {t('refresh')}
                </button>
            </div>
            {loading ? (
                <Loader />
            ) : listError ? (
                <div role="alert" className={cx('error')}>
                    {errorText(listError)}
                </div>
            ) : items.length === 0 ? (
                <p className={cx('empty')}>{t('empty')}</p>
            ) : (
                <>
                    <p className={cx('timezone-note')}>{t('timezoneNote')}</p>
                    <div className={cx('table-wrapper')}>
                        <table>
                            <colgroup>
                                <col className={cx('sender-column')} />
                                <col className={cx('issue-column')} />
                                <col className={cx('date-column')} />
                                <col className={cx('status-column')} />
                                <col className={cx('assignee-column')} />
                            </colgroup>
                            <thead>
                                <tr>
                                    {['sender', 'issue', 'submittedDate', 'status', 'assigneeShort'].map((key) => (
                                        <th key={key} scope="col">
                                            {t(key)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => {
                                    const subject =
                                        item.category === 'other'
                                            ? item.subject
                                            : t('contact:categories.' + item.category);
                                    const assignee = item.assignee?.fullname || t('unassignedShort');
                                    return (
                                        <tr
                                            key={item._id}
                                            className={cx('request-row', { unread: !item.isRead })}
                                            tabIndex={0}
                                            aria-label={t('viewRequest', { id: '#' + item._id })}
                                            onClick={() => selectRequest(item._id)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault();
                                                    selectRequest(item._id);
                                                }
                                            }}
                                        >
                                            <td>
                                                <span className={cx('sender-name', 'truncate')} title={item.fullname}>
                                                    {item.fullname}
                                                </span>
                                                <span className={cx('secondary', 'truncate')} title={item.email}>
                                                    {item.email}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={cx('issue-heading')}>
                                                    {!item.isRead && (
                                                        <span className={cx('unread-dot')} aria-label={t('unread')} />
                                                    )}
                                                    <span className={cx('issue-title', 'truncate')} title={subject}>
                                                        {subject}
                                                    </span>
                                                </div>
                                                <span className={cx('request-meta')} title={'#' + item._id}>
                                                    <span>#{item._id}</span>
                                                    {!item.isRead && (
                                                        <>
                                                            <span aria-hidden="true"> · </span>
                                                            <span>{t('unread')}</span>
                                                        </>
                                                    )}
                                                </span>
                                            </td>
                                            <td>
                                                <time dateTime={item.createdAt}>
                                                    <span className={cx('date-text')}>
                                                        {formatDate(item.createdAt)}
                                                    </span>
                                                    <span className={cx('secondary')}>
                                                        {formatTime(item.createdAt)}
                                                    </span>
                                                </time>
                                            </td>
                                            <td>
                                                <span className={cx('badge', item.status)}>
                                                    {t('statuses.' + item.status)}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    className={cx('truncate', { secondary: !item.assignee?.id })}
                                                    title={assignee}
                                                >
                                                    {assignee}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
            {!loading && !listError && total > limit && (
                <Pagination
                    totalItems={total}
                    itemsPerPage={limit}
                    currentPage={page - 1}
                    setCurrentPage={(selectedPage) => setPage(selectedPage + 1)}
                />
            )}
            <Dialog
                open={Boolean(selectedId)}
                onClose={() => !saving && selectRequest('')}
                fullWidth
                fullScreen={isMobileDialog}
                TransitionComponent={isMobileDialog ? MobileDialogTransition : undefined}
                transitionDuration={reduceMotion ? 0 : undefined}
                maxWidth="md"
                PaperProps={{ className: cx('dialog-paper') }}
                aria-labelledby="support-dialog-title"
            >
                <DialogTitle component="div" className={cx('dialog-header')}>
                    <h2>{t('details')}</h2>
                    <button type="button" disabled={saving} onClick={() => selectRequest('')} aria-label={t('close')}>
                        <FiX aria-hidden="true" />
                    </button>
                </DialogTitle>
                <DialogContent className={cx('dialog-content')} dividers>
                    <div className={cx('detail')}>
                        {detailLoading ? (
                            <Loader />
                        ) : (
                            detail && (
                                <>
                                    <section className={cx('detail-section', 'request-summary')}>
                                        <div className={cx('summary-heading')}>
                                            <h3>
                                                {detail.category === 'other'
                                                    ? detail.subject
                                                    : t('contact:categories.' + detail.category)}
                                            </h3>
                                            <span className={cx('summary-status', 'summary-' + detail.status)}>
                                                {t('statuses.' + detail.status)}
                                            </span>
                                        </div>
                                        <div className={cx('summary-reference')}>
                                            <span>{t('id')}:</span>
                                            <span className={cx('full-request-id')}>#{detail._id}</span>
                                            <button
                                                type="button"
                                                className={cx('copy-id')}
                                                onClick={copyRequestId}
                                                aria-label={t('copyId')}
                                            >
                                                {copyStatus === 'copied' ? (
                                                    <FiCheck aria-hidden="true" />
                                                ) : (
                                                    <FiCopy aria-hidden="true" />
                                                )}
                                                {t(copyStatus === 'copied' ? 'copied' : 'copy')}
                                            </button>
                                        </div>
                                        {copyStatus === 'copyFailed' && (
                                            <p className={cx('copy-feedback')} role="alert">
                                                {t(copyStatus)}
                                            </p>
                                        )}
                                        <p className={cx('summary-date')}>
                                            {t('submittedDate')}:{' '}
                                            <time dateTime={detail.createdAt}>{date(detail.createdAt)}</time>
                                        </p>
                                        <div className={cx('summary-people')}>
                                            <div className={cx('sender-summary')}>
                                                <h4>{t('sender')}</h4>
                                                <div className={cx('sender-identity')}>
                                                    <strong>{detail.fullname}</strong>
                                                    <span className={cx('account-badge')}>
                                                        {t('roles.' + detail.senderRole)}
                                                    </span>
                                                </div>
                                                <p className={cx('contact-line')}>
                                                    <span className={cx('sr-only')}>{t('email')}: </span>
                                                    {detail.email}
                                                </p>
                                                <p className={cx('contact-line')}>
                                                    <span className={cx('sr-only')}>{t('phone')}: </span>
                                                    {detail.phone}
                                                </p>
                                            </div>
                                            <div>
                                                <h4>{t('processing')}</h4>
                                                <span className={cx('summary-label')}>{t('assignee')}</span>
                                                <p className={cx('summary-assignee')}>
                                                    {detail.assignee?.fullname || t('unassigned')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={cx('summary-message')}>
                                            <h4>{t('message')}</h4>
                                            <p className={cx('message')}>{detail.message}</p>
                                        </div>
                                    </section>
                                    <section className={cx('detail-section')}>
                                        <h3>{t('processing')}</h3>
                                        <form
                                            id="support-update-form"
                                            onSubmit={(event) => {
                                                event.preventDefault();
                                                save();
                                            }}
                                        >
                                            <div className={cx('processing-controls')}>
                                                <div className={cx('status-control')}>
                                                    <label htmlFor="support-detail-status">{t('status')}</label>
                                                    <Select
                                                        inputId="support-detail-status"
                                                        instanceId="support-detail-status"
                                                        styles={detailSelectionStyles}
                                                        options={statusOptions}
                                                        value={statusOptions.find(
                                                            (option) => option.value === draftStatus,
                                                        )}
                                                        onChange={(option) => {
                                                            setDraftStatus(option.value);
                                                            setSaved(false);
                                                        }}
                                                        isDisabled={saving}
                                                        isSearchable={false}
                                                        menuPlacement="auto"
                                                        maxMenuHeight={180}
                                                    />
                                                </div>
                                                <div className={cx('assignment')}>
                                                    <span className={cx('field-label')}>{t('assignee')}</span>
                                                    <div className={cx('assignee-control')}>
                                                        <span className={cx('assignee-name')}>
                                                            {detail.assignee?.fullname || t('unassigned')}
                                                        </span>
                                                        {!detail.assignee?.id && (
                                                            <button
                                                                type="button"
                                                                disabled={saving}
                                                                onClick={() => save('claim')}
                                                            >
                                                                {t('claim')}
                                                            </button>
                                                        )}
                                                        {ownAssignment && (
                                                            <button
                                                                type="button"
                                                                disabled={saving}
                                                                onClick={() => save('release')}
                                                            >
                                                                {t('release')}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={cx('note-control')}>
                                                <label htmlFor="support-note">{t('note')}</label>
                                                <textarea
                                                    id="support-note"
                                                    rows={4}
                                                    maxLength={2000}
                                                    value={note}
                                                    disabled={saving}
                                                    onChange={(event) => {
                                                        setNote(event.target.value);
                                                        setSaved(false);
                                                    }}
                                                    placeholder={t('notePlaceholder')}
                                                />
                                            </div>
                                        </form>
                                    </section>
                                    <section className={cx('detail-section')}>
                                        <h3>{t('history')}</h3>
                                        {!detail.history?.length ? (
                                            <p className={cx('history-empty')}>{t('noHistory')}</p>
                                        ) : (
                                            <ol className={cx('history')}>
                                                {detail.history.map((entry, index) => (
                                                    <li key={entry._id || index}>
                                                        <div className={cx('history-heading')}>
                                                            <strong>{entry.actorName}</strong>
                                                            <time dateTime={entry.at}>{date(entry.at)}</time>
                                                        </div>
                                                        <p>
                                                            {entry.type === 'status'
                                                                ? t('statusChange', {
                                                                      from: t('statuses.' + entry.from),
                                                                      to: t('statuses.' + entry.to),
                                                                  })
                                                                : entry.type === 'note'
                                                                ? entry.note
                                                                : t(entry.type === 'claim' ? 'claimed' : 'released')}
                                                        </p>
                                                    </li>
                                                ))}
                                            </ol>
                                        )}
                                    </section>
                                </>
                            )
                        )}
                        {detail && !detailLoading && (
                            <SupportChat key={detail._id} requestId={detail._id} token={token} />
                        )}
                        {detailError && (
                            <div role="alert" className={cx('error')}>
                                {errorText(detailError)}{' '}
                                <button type="button" disabled={saving} onClick={() => setDetailReload((n) => n + 1)}>
                                    {t('reloadDetails')}
                                </button>
                            </div>
                        )}
                        {saved && (
                            <p role="status" className={cx('saved-message')}>
                                {t('saved')}
                            </p>
                        )}
                    </div>
                </DialogContent>
                <DialogActions className={cx('dialog-footer')}>
                    {detail && !detailLoading && (
                        <button
                            type="submit"
                            form="support-update-form"
                            className={cx('save-button')}
                            disabled={saving || (draftStatus === detail.status && !note.trim())}
                        >
                            {saving ? t('saving') : t('save')}
                        </button>
                    )}
                </DialogActions>
            </Dialog>
        </section>
    );
};
export default SupportManagement;
