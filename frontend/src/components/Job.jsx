import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Bookmark, AlertCircle } from 'lucide-react'
import { Avatar, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { USER_API_END_POINT } from '@/utils/constant'
import { toast } from 'sonner'
import { addSavedJob, removeSavedJob } from '@/redux/authSlice'

const Job = ({job}) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, savedJobs } = useSelector(store => store.auth);
    const [isSaved, setIsSaved] = useState(false);
    const [isUnsaving, setIsUnsaving] = useState(false);

    // Cải thiện kiểm tra công việc đã được lưu chưa
    useEffect(() => {
        if (savedJobs && savedJobs.length > 0) {
            const jobIsSaved = savedJobs.some(savedJob => savedJob._id === job._id);
            setIsSaved(jobIsSaved);
        }
    }, [savedJobs, job._id]);

    const daysAgoFunction = (mongodbTime) => {
        const createdAt = new Date(mongodbTime);
        const currentTime = new Date();
        const timeDifference = currentTime - createdAt;
        return Math.floor(timeDifference/(1000*24*60*60));
    }

    // Hàm định dạng tiền lương
    const formatSalary = (salary) => {
        if (!salary) return "Thỏa thuận";
        
        // Chuyển đổi sang định dạng tiền Việt Nam
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(salary);
    };
    
    const toggleSaveJob = async () => {
        if (!user) {
            toast.error("Vui lòng đăng nhập để lưu công việc");
            navigate("/login");
            return;
        }

        // Cập nhật UI ngay lập tức để tránh độ trễ cảm nhận của người dùng
        const previousSavedState = isSaved;
        setIsSaved(!isSaved);
        setIsUnsaving(previousSavedState);

        try {
            if (previousSavedState) {
                // Bỏ lưu công việc
                const res = await axios.post(`${USER_API_END_POINT}/jobs/unsave/${job._id}`, {}, {
                    withCredentials: true
                });
                
                if (res.data.success) {
                    dispatch(removeSavedJob(job._id));
                    toast.success(res.data.message || "Đã bỏ lưu công việc");
                } else {
                    // Khôi phục trạng thái nếu API thất bại
                    setIsSaved(true);
                    toast.error(res.data.message || "Không thể bỏ lưu công việc");
                }
            } else {
                // Lưu công việc
                const res = await axios.post(`${USER_API_END_POINT}/jobs/save/${job._id}`, {}, {
                    withCredentials: true
                });
                
                if (res.data.success) {
                    dispatch(addSavedJob(job));
                    toast.success(res.data.message || "Đã lưu công việc");
                } else {
                    // Khôi phục trạng thái nếu API thất bại
                    setIsSaved(false);
                    toast.error(res.data.message || "Không thể lưu công việc");
                }
            }
        } catch (error) {
            console.log(error);
            // Khôi phục lại trạng thái ban đầu nếu xảy ra lỗi
            setIsSaved(previousSavedState);
            toast.error(error.response?.data?.message || "Đã xảy ra lỗi khi thực hiện thao tác");
        } finally {
            setIsUnsaving(false);
        }
    };
    
    return (
        <div className='p-5 rounded-md shadow-xl bg-white border border-gray-100 transition-all duration-300 hover:shadow-2xl'>
            <div className='flex items-center justify-between'>
                <p className='text-sm text-gray-500'>{daysAgoFunction(job?.createdAt) === 0 ? "Today" : `${daysAgoFunction(job?.createdAt)} ngày trước`}</p>
                <Button 
                    variant="outline" 
                    className={`rounded-full transition-all duration-300 ${isSaved ? 'border-accent' : ''}`} 
                    size="icon"
                    onClick={toggleSaveJob}
                    disabled={isUnsaving}
                >
                    <Bookmark className={`${isSaved ? "fill-accent text-accent" : ""} ${isUnsaving ? "animate-pulse" : ""}`} />
                </Button>
            </div>

            <div className='flex items-center gap-2 my-2'>
                <Button className="p-6" variant="outline" size="icon">
                    <Avatar>
                        <AvatarImage src={job?.company?.logo} />
                    </Avatar>
                </Button>
                <div>
                    <h1 className='font-medium text-lg'>{job?.company?.name}</h1>
                    <p className='text-sm text-gray-500'>{job?.location || "Việt Nam"}</p>
                </div>
            </div>

            <div>
                <h1 className='font-bold text-lg my-2 line-clamp-1'>{job?.title}</h1>
                <p className='text-sm text-gray-600 line-clamp-2'>{job?.description}</p>
            </div>

            <div className='flex items-center gap-2 mt-4 flex-wrap'>
                <Badge className={'text-blue-700 font-bold'} variant="ghost">{job?.position} vị trí</Badge>
                <Badge className={'text-[#F83002] font-bold'} variant="ghost">{job?.jobType}</Badge>
                <Badge className={'text-[#7209b7] font-bold'} variant="ghost">{formatSalary(job?.salary)}</Badge>
            </div>
            <div className='flex items-center gap-4 mt-4'>
                <Button 
                    onClick={()=> navigate(`/description/${job?._id}`)} 
                    variant="outline"
                    className="transition-all hover:border-primary hover:text-primary"
                >
                    Chi tiết
                </Button>
                <Button 
                    className={
                        isSaved 
                        ? "bg-accent/90 hover:bg-accent transition-all duration-300" 
                        : "bg-[#7209b7] hover:bg-[#7209b7]/90 transition-all duration-300"
                    }
                    onClick={toggleSaveJob}
                    disabled={isUnsaving}
                >
                    {isUnsaving ? "Đang xử lý..." : isSaved ? "Bỏ lưu" : "Lưu công việc"}
                </Button>
            </div>
        </div>
    )
}

export default Job