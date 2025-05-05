import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { USER_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import axios from 'axios';
import { setSavedJobs } from "@/redux/authSlice";

const useGetSavedJobs = () => {
    const { user } = useSelector(store => store.auth);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    // Sử dụng useCallback để đảm bảo hàm không tạo lại khi render
    const fetchSavedJobs = useCallback(async (bypassCache = false) => {
        if (!user) return;
        
        try {
            setLoading(true);
            
            const res = await axios.get(`${USER_API_END_POINT}/jobs/saved`, {
                withCredentials: true,
                headers: bypassCache ? {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                } : {}
            });
            
            if (res.data.success) {
                // Cập nhật danh sách công việc đã lưu trong Redux
                dispatch(setSavedJobs(res.data.savedJobs || []));
                console.log('Saved jobs fetched:', res.data.savedJobs?.length || 0);
            }
        } catch (error) {
            console.error("Failed to fetch saved jobs:", error);
            toast.error(error.response?.data?.message || "Không thể tải danh sách công việc đã lưu");
        } finally {
            setLoading(false);
        }
    }, [user, dispatch]);

    // Fetch saved jobs when user changes or component mounts
    useEffect(() => {
        if (user) {
            fetchSavedJobs();
        }
    }, [user, fetchSavedJobs]);

    return { loading, refetch: fetchSavedJobs };
};

export default useGetSavedJobs;