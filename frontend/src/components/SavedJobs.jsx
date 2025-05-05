import React, { useEffect } from 'react'
import Navbar from './shared/Navbar'
import { useSelector } from 'react-redux'
import Job from './Job'
import { Bookmark, Loader2 } from 'lucide-react'
import useGetSavedJobs from '@/hooks/useGetSavedJobs'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from './ui/button'

const SavedJobs = () => {
    // Lấy danh sách công việc đã lưu từ Redux store
    const { savedJobs } = useSelector(store => store.auth);
    // Sử dụng hook đã cải tiến để lấy dữ liệu
    const { loading, refetch } = useGetSavedJobs();
    const navigate = useNavigate();

    // Làm mới danh sách khi component được mount
    useEffect(() => {
        refetch(true); // Bypass cache to get fresh data
    }, []);

    return (
        <div>
            <Navbar />
            <div className='max-w-7xl mx-auto my-10 px-4'>
                <div className='flex items-center justify-between mb-6'>
                    <h1 className='font-bold text-2xl flex items-center gap-2'>
                        <Bookmark className="text-accent" />
                        Công việc đã lưu ({savedJobs?.length || 0})
                    </h1>
                    <Button 
                        onClick={() => navigate('/jobs')} 
                        variant="outline"
                        className="border-accent text-accent hover:bg-accent/10"
                    >
                        Tìm thêm việc làm
                    </Button>
                </div>

                {loading ? (
                    <div className='flex justify-center items-center h-64'>
                        <Loader2 className='h-8 w-8 animate-spin text-accent' />
                    </div>
                ) : savedJobs?.length > 0 ? (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {savedJobs.map(job => (
                            <motion.div
                                key={job._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Job job={job} />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className='bg-white p-8 rounded-lg shadow-md text-center border border-secondary/20'>
                        <div className='mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4'>
                            <Bookmark className='h-8 w-8 text-accent' />
                        </div>
                        <h2 className='text-xl font-bold mb-2'>Bạn chưa lưu công việc nào</h2>
                        <p className='text-muted-foreground mb-6'>Lưu các công việc yêu thích để xem sau và theo dõi quá trình ứng tuyển của bạn.</p>
                        <Button 
                            onClick={() => navigate('/jobs')}
                            className='bg-accent hover:bg-accent/90'
                        >
                            Tìm việc làm
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SavedJobs