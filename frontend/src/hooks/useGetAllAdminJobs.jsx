import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setAllAdminJobs } from '@/redux/jobSlice'; // Sửa từ setAdminJobs thành setAllAdminJobs
import axios from 'axios';
import { JOB_API_END_POINT } from '@/utils/constant';

const useGetAllAdminJobs = () => {
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    
    // Cập nhật hàm này để chấp nhận tham số bypass cache
    const getAllAdminJobs = async (bypassCache = false) => {
        try {
            setLoading(true);
            const url = `${JOB_API_END_POINT}/getadminjobs`;
            const config = {
                withCredentials: true,
                headers: bypassCache ? {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                } : {}
            };
            
            const res = await axios.get(url, config);
            
            if (res.data.success) {
                dispatch(setAllAdminJobs(res.data.jobs)); // Sửa từ setAdminJobs thành setAllAdminJobs
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };
    
    return { loading, getAllAdminJobs };
};

export default useGetAllAdminJobs;