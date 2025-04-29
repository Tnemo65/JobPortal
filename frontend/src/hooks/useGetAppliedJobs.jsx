import { useState, useEffect, useCallback } from "react";
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

    const onGetJobs = useCallback(async (bypassCache = false) => {
        if (!user) return;
        
        try {
            setLoading(true);
            
            // Add query params for cache control
            const params = new URLSearchParams();
            
            // Add timestamp to force fresh data when needed
            if (bypassCache) {
                params.append('_t', Date.now());
            }
            
            const url = `${APPLICATION_API_END_POINT}/get${params.toString() ? `?${params.toString()}` : ''}`;
            
            const res = await axios.get(url, {
                withCredentials: true,
                headers: bypassCache ? {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                } : {}
            });
            
            if (res.data.success) {
                // Use optimized backend response - it now returns a single unified array
                const appliedJobs = res.data.appliedJobs || [];
                
                setJobs(appliedJobs);
                dispatch(setAllAppliedJobs(appliedJobs));
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || "Failed to get applied jobs");
        } finally {
            setLoading(false);
        }
    }, [dispatch, user]);

    useEffect(() => {
        if (user) {
            onGetJobs();
        }
    }, [user, onGetJobs]);

    // Function to force refresh data, bypassing cache
    const refreshAppliedJobs = () => onGetJobs(true);

    return { jobs, loading, refreshAppliedJobs };
}

export default useGetAppliedJobs;