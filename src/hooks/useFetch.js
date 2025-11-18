import { useState, useEffect } from "react";
import API from "../api/api";

const useFetch = (endpoint, dependencies = []) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await API.get(endpoint);
                if (isMounted) {
                    setData(res.data);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.response?.data || "Something went wrong");
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false; // cleanup on unmount
        };
    }, dependencies); // dependency array allows re-fetch on change

    return { data, loading, error, refetch: () => API.get(endpoint).then(res => setData(res.data)) };
};

export default useFetch;
