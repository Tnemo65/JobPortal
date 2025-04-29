import { useState, useEffect } from 'react'
import { COMPANY_API_END_POINT } from '@/utils/constant';
import { toast } from 'sonner';
import axios from 'axios';

const useGetAllCompanies = () => {
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState([]);

    const getAllCompanies = async () => {
        try {
            setLoading(true);
            // Sử dụng axios bình thường thay vì createSecureAxios
            const res = await axios.get(COMPANY_API_END_POINT, {
                withCredentials: true
            });
            
            if (res.data.success) {
                setCompanies(res.data.companies);
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
    }, []);

    return {
        loading,
        companies,
        getAllCompanies
    };
}

export default useGetAllCompanies;