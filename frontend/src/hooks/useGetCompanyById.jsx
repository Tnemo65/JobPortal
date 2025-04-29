import { useState } from 'react'
import { useParams } from 'react-router-dom';
import { COMPANY_API_END_POINT } from '@/utils/constant';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const useGetCompanyById = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const getCompanyById = async () => {
        try {
            setLoading(true);
            // Sử dụng axios bình thường thay vì createSecureAxios
            const res = await axios.get(`${COMPANY_API_END_POINT}/${id}`, {
                withCredentials: true
            });
            if (res.data.success) {
                return res.data.company;
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || "Failed to fetch company");
            navigate('/admin/companies');
        } finally {
            setLoading(false);
        }
    }

    return {
        getCompanyById,
        loading
    }
}

export default useGetCompanyById;