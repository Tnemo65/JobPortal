import React, { useEffect } from 'react'
import Navbar from './shared/Navbar'
import { useSelector } from 'react-redux'
import AppliedJobTable from './AppliedJobTable'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Loader2 } from 'lucide-react'
import useGetAppliedJobs from '@/hooks/useGetAppliedJobs'
import { Button } from './ui/button'

const AppliedJobs = () => {
    const { user } = useSelector(store => store.auth);
    const { allAppliedJobs } = useSelector(store => store.job);
    const { loading, refreshAppliedJobs } = useGetAppliedJobs();
    const navigate = useNavigate();

    // Load data when component mounts
    useEffect(() => {
        // Check if user is logged in
        if (!user) {
            toast.error("Vui lòng đăng nhập để xem công việc đã ứng tuyển");
            navigate("/login");
            return;
        }
        
        // Fetch fresh data every time component mounts
        refreshAppliedJobs();
        console.log(`Applied jobs fetched for user: ${user._id}`);
    }, []); // Remove 'user' dependency so it fetches every time component mounts

    // If user is not authenticated
    if (!user) {
        return (
            <div>
                <Navbar />
                <div className='max-w-7xl mx-auto my-10 px-4'>
                    <div className='bg-white p-8 rounded-lg shadow-md text-center border border-secondary/20'>
                        <p>Vui lòng đăng nhập để xem công việc đã ứng tuyển</p>
                        <Button 
                            onClick={() => navigate('/login')}
                            className='mt-4 bg-accent hover:bg-accent/90'
                        >
                            Đăng nhập
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div className='max-w-7xl mx-auto my-10 px-4'>
                <div className='flex items-center justify-between mb-6'>
                    <h1 className='font-bold text-2xl flex items-center gap-2'>
                        <Briefcase className="text-accent" />
                        Công việc đã ứng tuyển ({allAppliedJobs?.length || 0})
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
                ) : allAppliedJobs?.length > 0 ? (
                    <div className='bg-white rounded-lg shadow'>
                        <AppliedJobTable />
                    </div>
                ) : (
                    <div className='bg-white p-8 rounded-lg shadow-md text-center border border-secondary/20'>
                        <div className='mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4'>
                            <Briefcase className='h-8 w-8 text-accent' />
                        </div>
                        <h2 className='text-xl font-bold mb-2'>Bạn chưa ứng tuyển công việc nào</h2>
                        <p className='text-muted-foreground mb-6'>Khám phá và ứng tuyển vào các cơ hội việc làm để bắt đầu sự nghiệp của bạn.</p>
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

export default AppliedJobs
