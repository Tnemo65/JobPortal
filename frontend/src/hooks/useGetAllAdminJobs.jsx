import { useState, useEffect } from 'react'
import { JOB_API_END_POINT } from '@/utils/constant';
import { toast } from 'sonner';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setAllAdminJobs } from '@/redux/jobSlice';

const useGetAllAdminJobs = () => {
    const [loading, setLoading] = useState(false);
    const [jobs, setJobs] = useState([]);
    const dispatch = useDispatch();

    const getAllAdminJobs = async () => {
        try {
            setLoading(true);
            // Sử dụng axios bình thường thay vì createSecureAxios
            const res = await axios.get(`${JOB_API_END_POINT}/getadminjobs`, {
                withCredentials: true
            });
            
            if (res.data.success) {
                setJobs(res.data.jobs);
                dispatch(setAllAdminJobs(res.data.jobs));
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || "Failed to fetch jobs");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getAllAdminJobs();
    }, []);

    return {
        loading,
        jobs,
        getAllAdminJobs
    };
}

export default useGetAllAdminJobs;