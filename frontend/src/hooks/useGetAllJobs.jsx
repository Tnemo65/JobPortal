import { useState, useEffect } from 'react'
import { JOB_API_END_POINT } from '@/utils/constant'
import { toast } from 'sonner'
import { useSelector, useDispatch } from 'react-redux';
import { setAllJobs } from '@/redux/jobSlice';
import api from '@/utils/api';

const useGetAllJobs = () => {
    const [loading, setLoading] = useState(false);
    const [jobs, setJobs] = useState([]);
    const { user } = useSelector(store => store.auth);
    const dispatch = useDispatch();

    const getAllJobs = async (filters = {}) => {
        try {
            setLoading(true);

            let queryParams = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key]) queryParams.append(key, filters[key]);
            });

            // Sử dụng API client
            const res = await api.get(`/job/get?${queryParams.toString()}`);
            
            if (res.data.success) {
                setJobs(res.data.jobs);
                dispatch(setAllJobs(res.data.jobs));
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || "Failed to fetch jobs");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getAllJobs();
    }, []);

    return {
        loading,
        jobs,
        getAllJobs
    };
}

export default useGetAllJobs;