import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { USER_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import axios from 'axios';
import { setSavedJobs, clearSavedJobs } from "@/redux/authSlice";

const useGetSavedJobs = () => {
    const { user } = useSelector(store => store.auth);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    // Sử dụng useCallback để đảm bảo hàm không tạo lại khi render
    const fetchSavedJobs = useCallback(async (bypassCache = false) => {
        if (!user) {
            // Clear saved jobs if no user is logged in
            dispatch(clearSavedJobs());
            return;
        }
        
        try {
            setLoading(true);
            
            // Add a unique timestamp to bypass cache when requested
            const cacheBuster = bypassCache ? `?_=${Date.now()}` : '';
            
            const res = await axios.get(`${USER_API_END_POINT}/jobs/saved${cacheBuster}`, {
                withCredentials: true,
                headers: bypassCache ? {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                } : {}
            });
            
            if (res.data.success) {
                // Cập nhật danh sách công việc đã lưu trong Redux
                const savedJobsList = res.data.savedJobs || [];
                dispatch(setSavedJobs(savedJobsList));
                console.log('Saved jobs fetched:', savedJobsList.length, 'for user:', user._id);
            } else {
                // If the API call was successful but the response indicates failure
                console.warn('API returned success: false for saved jobs');
                dispatch(clearSavedJobs());
            }
        } catch (error) {
            console.error("Failed to fetch saved jobs:", error);
            toast.error(error.response?.data?.message || "Không thể tải danh sách công việc đã lưu");
            // Clear saved jobs on error to prevent showing incorrect data
            dispatch(clearSavedJobs());
        } finally {
            setLoading(false);
        }
    }, [user, dispatch]);

    // Fetch saved jobs when user changes or component mounts
    useEffect(() => {
        // Clear saved jobs when user changes or logs out
        if (!user) {
            dispatch(clearSavedJobs());
            return;
        }
        
        // Fetch saved jobs for the current user
        fetchSavedJobs();
        
    }, [user, fetchSavedJobs]);

    return { loading, refetch: fetchSavedJobs };
};

export default useGetSavedJobs;