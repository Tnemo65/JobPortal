import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCompanies } from '@/redux/companySlice';
import axios from 'axios';
import { COMPANY_API_END_POINT } from '@/utils/constant';

const useGetAllCompanies = () => {
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    
    // Cập nhật hàm này để chấp nhận tham số bypass cache
    const getAllCompanies = async (bypassCache = false) => {
        try {
            setLoading(true);
            const url = `${COMPANY_API_END_POINT}/get`;
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
                dispatch(setCompanies(res.data.companies));
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };
    
    return { loading, getAllCompanies };
};

export default useGetAllCompanies;