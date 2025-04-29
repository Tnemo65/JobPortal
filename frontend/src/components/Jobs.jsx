import React, { useEffect, useState } from 'react'
import Navbar from './shared/Navbar'
import FilterCard from './FilterCard'
import Job from './Job';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import useGetAllJobs from '@/hooks/useGetAllJobs';

const Jobs = () => {
    const { allJobs, searchedQuery } = useSelector(store => store.job);
    const [filterJobs, setFilterJobs] = useState([]);
    const { loading } = useGetAllJobs();

    useEffect(() => {
        if (allJobs && allJobs.length > 0) {
            if (searchedQuery) {
                const filteredJobs = allJobs.filter((job) => {
                    return job.title.toLowerCase().includes(searchedQuery.toLowerCase()) ||
                        job.description.toLowerCase().includes(searchedQuery.toLowerCase()) ||
                        job.location.toLowerCase().includes(searchedQuery.toLowerCase())
                })
                setFilterJobs(filteredJobs)
            } else {
                setFilterJobs(allJobs)
            }
        } else {
            setFilterJobs([]);
        }
    }, [allJobs, searchedQuery]);

    return (
        <div>
            <Navbar />
            <div className='max-w-7xl mx-auto mt-5'>
                <div className='flex gap-5'>
                    <div className='w-20%'>
                        <FilterCard />
                    </div>
                    
                    {loading ? (
                        <div className='flex-1 flex items-center justify-center'>
                            <div className='text-center'>
                                <div className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#7209b7] mx-auto'></div>
                                <p className='mt-2 text-gray-600'>Đang tải dữ liệu...</p>
                            </div>
                        </div>
                    ) : filterJobs.length <= 0 ? (
                        <div className='flex-1 flex items-center justify-center'>
                            <p className='text-gray-600 text-lg'>Không tìm thấy công việc phù hợp</p>
                        </div>
                    ) : (
                        <div className='flex-1 h-[88vh] overflow-y-auto pb-5'>
                            <div className='grid grid-cols-3 gap-4'>
                                {
                                    filterJobs.map((job) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: 100 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -100 }}
                                            transition={{ duration: 0.3 }}
                                            key={job?._id}>
                                            <Job job={job} />
                                        </motion.div>
                                    ))
                                }
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Jobs