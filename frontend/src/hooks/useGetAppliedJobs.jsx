import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { APPLICATION_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import axios from "axios";
import { setAllAppliedJobs } from "@/redux/jobSlice";

const useGetAppliedJobs = () => {
    const { user } = useSelector(store => store.auth);
    const { allAppliedJobs } = useSelector(store => store.job);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const cancelTokenRef = useRef(null);
    const fetchTimeoutRef = useRef(null);
    const lastFetchTimeRef = useRef(0);
    
    // Prevent fetching too often - set minimum interval between requests (e.g., 2 seconds)
    const MIN_FETCH_INTERVAL = 2000;

    const onGetJobs = useCallback(async (bypassCache = false) => {
        if (!user || loading) return; // Don't fetch if already loading
        
        const now = Date.now();
        if (now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL && !bypassCache) {
            console.log("Fetch prevented - too soon after previous fetch");
            return;
        }
        
        // Cancel any in-progress requests
        if (cancelTokenRef.current) {
            cancelTokenRef.current.cancel('Request superseded by newer request');
        }
        
        // Clear any pending fetch timeout
        if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
        }
        
        // Debounce the request
        fetchTimeoutRef.current = setTimeout(async () => {
            try {
                setLoading(true);
                lastFetchTimeRef.current = Date.now();
                
                // Create a new cancel token
                cancelTokenRef.current = axios.CancelToken.source();
                
                // Add query params for cache control
                const params = new URLSearchParams();
                
                // Add timestamp for cache busting only when explicitly requested
                if (bypassCache) {
                    params.append('_t', Date.now());
                }
                
                const url = `${APPLICATION_API_END_POINT}/get${params.toString() ? `?${params.toString()}` : ''}`;
                
                const res = await axios.get(url, {
                    withCredentials: true,
                    cancelToken: cancelTokenRef.current.token,
                    headers: bypassCache ? {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                    } : {}
                });
                
                if (res.data.success) {
                    const appliedJobs = res.data.appliedJobs || [];
                    setJobs(appliedJobs);
                    dispatch(setAllAppliedJobs(appliedJobs));
                }
            } catch (error) {
                // Don't report canceled requests as errors
                if (axios.isCancel(error)) {
                    console.log('Request canceled:', error.message);
                    return;
                }
                
                console.error("API Error:", error);
                
                // Don't show toast for resource errors to avoid additional rendering
                if (error.message !== "net::ERR_INSUFFICIENT_RESOURCES") {
                    toast.error(error.response?.data?.message || "Failed to get applied jobs");
                }
            } finally {
                setLoading(false);
            }
        }, 300); // 300ms debounce time
    }, [user, loading, dispatch]);

    // Only run effect on mount or when user changes
    useEffect(() => {
        let isMounted = true;
        
        if (user && isMounted) {
            onGetJobs();
        }
        
        return () => {
            isMounted = false;
            // Cancel any pending requests when unmounting
            if (cancelTokenRef.current) {
                cancelTokenRef.current.cancel('Component unmounted');
            }
            // Clear any pending fetch timeout
            if (fetchTimeoutRef.current) {
                clearTimeout(fetchTimeoutRef.current);
            }
        };
    }, [user]); // Don't include onGetJobs in the dependency array

    // Function to force refresh data, bypassing cache
    const refreshAppliedJobs = useCallback(() => {
        onGetJobs(true);
    }, [onGetJobs]);

    return { jobs, loading, refreshAppliedJobs };
}

export default useGetAppliedJobs;