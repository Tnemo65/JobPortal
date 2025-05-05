import React, { useEffect, useState } from 'react'
import Navbar from '../shared/Navbar'
import ApplicantsTable from './ApplicantsTable'
import axios from 'axios';
import { APPLICATION_API_END_POINT } from '@/utils/constant';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setAllApplicants } from '@/redux/applicationSlice';
import { Loader2 } from 'lucide-react';

const Applicants = () => {
    const params = useParams();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const application = useSelector(store => store.application) || {};
    const { applicants } = application;

    useEffect(() => {
        const fetchAllApplicants = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${APPLICATION_API_END_POINT}/${params.id}/applicants`, { withCredentials: true });
                dispatch(setAllApplicants(res.data.job));
            } catch (error) {
                console.log(error);
                setError(error.response?.data?.message || "Không thể tải danh sách ứng viên");
            } finally {
                setLoading(false);
            }
        }
        fetchAllApplicants();
    }, [params.id, dispatch]);

    if (loading) {
        return (
            <div>
                <Navbar />
                <div className='max-w-7xl mx-auto p-4'>
                    <div className="flex justify-center items-center h-64">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
                            <p className="mt-2 text-gray-500">Đang tải danh sách ứng viên...</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div>
                <Navbar />
                <div className='max-w-7xl mx-auto p-4'>
                    <div className="flex justify-center items-center h-64">
                        <div className="text-center">
                            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Đã xảy ra lỗi</h3>
                            <p className="mt-2 text-gray-500">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div>
            <Navbar />
            <div className='max-w-7xl mx-auto p-4'>
                <h1 className='font-bold text-xl my-5'>Applicants {applicants?.applications?.length || 0}</h1>
                <ApplicantsTable />
            </div>
        </div>
    )
}

export default Applicants