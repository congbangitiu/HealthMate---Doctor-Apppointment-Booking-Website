import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

let apiPromise;
const loadApi = () => {
    if (window.grecaptcha?.render) return Promise.resolve(window.grecaptcha);
    if (!apiPromise) {
        apiPromise = new Promise((resolve, reject) => {
            window.contactRecaptchaReady = () => {
                resolve(window.grecaptcha);
                delete window.contactRecaptchaReady;
            };
            const script = document.createElement('script');
            script.src = 'https://www.google.com/recaptcha/api.js?onload=contactRecaptchaReady&render=explicit';
            script.async = true;
            script.defer = true;
            script.onerror = () => {
                script.remove();
                delete window.contactRecaptchaReady;
                apiPromise = undefined;
                reject(new Error('CAPTCHA unavailable'));
            };
            document.head.appendChild(script);
        });
    }
    return apiPromise;
};

const Recaptcha = ({ siteKey, resetKey, onChange, errorMessage, language }) => {
    const container = useRef(null);
    const callback = useRef(onChange);
    callback.current = onChange;
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        let active = true;
        let widget;
        setFailed(false);
        callback.current('');
        const host = document.createElement('div');
        container.current.replaceChildren(host);
        loadApi()
            .then((api) => {
                if (!active) return;
                widget = api.render(host, {
                    sitekey: siteKey,
                    hl: language,
                    callback: (token) => active && callback.current(token),
                    'expired-callback': () => active && callback.current(''),
                    'error-callback': () => {
                        if (active) {
                            callback.current('');
                            setFailed(true);
                        }
                    },
                });
            })
            .catch(() => active && setFailed(true));
        return () => {
            active = false;
            if (widget !== undefined) window.grecaptcha?.reset(widget);
        };
    }, [siteKey, resetKey, language]);
    return (
        <>
            <div ref={container} />
            {failed && <p role="alert">{errorMessage}</p>}
        </>
    );
};
Recaptcha.propTypes = {
    siteKey: PropTypes.string.isRequired,
    resetKey: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    errorMessage: PropTypes.string.isRequired,
    language: PropTypes.string,
};

export default Recaptcha;
