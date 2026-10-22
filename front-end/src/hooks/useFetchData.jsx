import { useState, useEffect } from 'react';
import { token } from '../../config';

const useFetchData = (url) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal,
                });

                if (!active) return;
                const result = await res.json();
                if (!active) return;

                if (!res.ok) {
                    throw new Error(result.message);
                }

                setData(result.data ? result.data : result);
            } catch (error) {
                if (active) setError(error.message);
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchData();
        return () => {
            active = false;
            controller.abort();
        };
    }, [url]);

    return { data, loading, error };
};

export default useFetchData;
