import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { USER_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import axios from 'axios';
import { setSavedJobs } from "@/redux/authSlice";

const useGetSavedJobs = () => {
    const { user, savedJobs } = useSelector(store => store.auth);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    // Sử dụng useCallback để đảm bảo hàm onGetJobs không được tạo lại mỗi lần render
    const onGetJobs = useCallback(async () => {
        if (!user) return;
        
        try {
            setLoading(true);
            
            const res = await axios.get(`${USER_API_END_POINT}/jobs/saved`, {
                withCredentials: true,
                // Thêm timestamp để đảm bảo request luôn được thực hiện mới
                params: { _t: new Date().getTime() }
            });
            
            if (res.data.success) {
                setJobs(res.data.savedJobs);
                dispatch(setSavedJobs(res.data.savedJobs));
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || "Failed to get saved jobs");
        } finally {
            setLoading(false);
        }
    }, [user, dispatch]);

    // Gọi API khi người dùng đã đăng nhập hoặc khi savedJobs thay đổi
    useEffect(() => {
        onGetJobs();
    }, [onGetJobs, savedJobs?.length]);

    return { jobs, loading, refetch: onGetJobs };
}

export default useGetSavedJobs;