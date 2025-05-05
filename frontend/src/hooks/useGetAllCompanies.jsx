import { useState, useEffect } from 'react'
import { COMPANY_API_END_POINT } from '@/utils/constant';
import { toast } from 'sonner';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setCompanies } from '@/redux/companySlice';

const useGetAllCompanies = () => {
    const [loading, setLoading] = useState(false);
    const [localCompanies, setLocalCompanies] = useState([]);
    const dispatch = useDispatch();

    const getAllCompanies = async () => {
        try {
            setLoading(true);
            // Sử dụng axios bình thường thay vì createSecureAxios
            const res = await axios.get(COMPANY_API_END_POINT, {
                withCredentials: true
            });
            
            if (res.data.success) {
                setLocalCompanies(res.data.companies);
                // Cập nhật Redux store với danh sách công ty
                dispatch(setCompanies(res.data.companies));
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || "Failed to fetch companies");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getAllCompanies();
    }, [dispatch]);

    return {
        loading,
        companies: localCompanies,
        getAllCompanies
    };
}

export default useGetAllCompanies;