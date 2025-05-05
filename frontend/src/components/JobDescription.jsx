import React, { useEffect, useState, useCallback } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { APPLICATION_API_END_POINT, JOB_API_END_POINT, USER_API_END_POINT } from '@/utils/constant';
import { setSingleJob } from '@/redux/jobSlice';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { 
    Briefcase, 
    MapPin, 
    Calendar, 
    Banknote, 
    Clock, 
    Users, 
    GraduationCap, 
    Building, 
    CheckCircle2, 
    Share2, 
    BookmarkPlus,
    ChevronLeft,
    ExternalLink,
    Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarImage } from './ui/avatar';
import Navbar from './shared/Navbar';
import { addSavedJob, removeSavedJob } from '@/redux/authSlice';
import useGetAppliedJobs from '@/hooks/useGetAppliedJobs';

const JobDescription = () => {
    const {singleJob} = useSelector(store => store.job);
    const {user, savedJobs} = useSelector(store=>store.auth);
    const isIntiallyApplied = singleJob?.applications?.some(application => application.applicant === user?._id) || false;
    const [isApplied, setIsApplied] = useState(isIntiallyApplied);
    const [isSaved, setIsSaved] = useState(false);
    const [isApplying, setIsApplying] = useState(false); // New state for tracking application submission
    const { refreshAppliedJobs } = useGetAppliedJobs(); // Hook để làm mới danh sách công việc đã ứng tuyển

    const params = useParams();
    const jobId = params.id;
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Kiểm tra công việc đã lưu chưa
    useEffect(() => {
        if (savedJobs && singleJob) {
            const jobIsSaved = savedJobs.some(savedJob => savedJob._id === singleJob._id);
            setIsSaved(jobIsSaved);
        }
    }, [savedJobs, singleJob]);

    // Format date to be more readable
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

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

    // Hàm xử lý lưu/bỏ lưu công việc với cập nhật UI realtime
    const toggleSaveJob = async () => {
        if (!user) {
            toast.error("Vui lòng đăng nhập để lưu công việc");
            navigate("/login");
            return;
        }

        // Cập nhật UI ngay lập tức để trải nghiệm người dùng mượt mà
        const previousSavedState = isSaved;
        setIsSaved(!isSaved);

        try {
            if (previousSavedState) {
                // Bỏ lưu công việc
                const res = await axios.post(`${USER_API_END_POINT}/jobs/unsave/${jobId}`, {}, {
                    withCredentials: true
                });
                if (res.data.success) {
                    dispatch(removeSavedJob(jobId));
                    toast.success(res.data.message || "Đã bỏ lưu công việc");
                } else {
                    // Khôi phục trạng thái nếu API thất bại
                    setIsSaved(true);
                    toast.error(res.data.message || "Không thể bỏ lưu công việc");
                }
            } else {
                // Lưu công việc
                const res = await axios.post(`${USER_API_END_POINT}/jobs/save/${jobId}`, {}, {
                    withCredentials: true
                });
                if (res.data.success) {
                    dispatch(addSavedJob(singleJob));
                    toast.success(res.data.message || "Đã lưu công việc");
                } else {
                    // Khôi phục trạng thái nếu API thất bại
                    setIsSaved(false);
                    toast.error(res.data.message || "Không thể lưu công việc");
                }
            }
        } catch (error) {
            console.log(error);
            // Khôi phục trạng thái nếu xảy ra lỗi
            setIsSaved(previousSavedState);
            toast.error(error.response?.data?.message || "Đã xảy ra lỗi khi thực hiện thao tác");
        }
    };

    const applyJobHandler = async () => {
        // Check if user is logged in first
        if (!user) {
            toast.error("Vui lòng đăng nhập để ứng tuyển");
            navigate("/login");
            return;
        }
        
        // Optimistic UI update
        setIsApplying(true);
        const previousAppliedState = isApplied;
        setIsApplied(true);
        
        // Create optimistic application data
        const optimisticApplication = { applicant: user._id };
        const updatedSingleJob = {
            ...singleJob,
            applications: [...(singleJob.applications || []), optimisticApplication]
        };
        
        // Update UI immediately
        dispatch(setSingleJob(updatedSingleJob));
        
        try {
            const res = await axios.get(`${APPLICATION_API_END_POINT}/apply/${jobId}`, {
                withCredentials: true
            });
            
            if (res.data.success) {
                toast.success(res.data.message || "Ứng tuyển thành công");
                
                // Cập nhật danh sách công việc đã ứng tuyển
                refreshAppliedJobs(); 
                
                // Cập nhật thông tin người dùng với công việc đã ứng tuyển
                try {
                    // Lấy thông tin profile user mới nhất (có danh sách công việc đã apply)
                    const userProfileRes = await axios.get(`${USER_API_END_POINT}/sso/profile`, {
                        withCredentials: true
                    });
                    
                    if (userProfileRes.data.success) {
                        // Cập nhật thông tin người dùng trong redux store
                        dispatch(setUser(userProfileRes.data.user));
                    }
                } catch (profileError) {
                    console.log("Không thể cập nhật thông tin người dùng:", profileError);
                    // Không hiển thị lỗi cho người dùng vì đã apply thành công
                }
            } else {
                // Revert UI state on failure
                const revertedSingleJob = {
                    ...singleJob,
                    applications: singleJob.applications.filter(app => app.applicant !== user._id)
                };
                setIsApplied(previousAppliedState);
                dispatch(setSingleJob(revertedSingleJob));
                toast.error(res.data.message || "Không thể ứng tuyển vào lúc này");
            }
        } catch (error) {
            console.log(error);
            // Revert UI state on error
            const revertedSingleJob = {
                ...singleJob,
                applications: singleJob.applications.filter(app => app.applicant !== user._id)
            };
            setIsApplied(previousAppliedState);
            dispatch(setSingleJob(revertedSingleJob));
            toast.error(error.response?.data?.message || "Không thể ứng tuyển vào lúc này");
        } finally {
            setIsApplying(false);
        }
    }

    useEffect(()=>{

        const fetchSingleJob = async () => {
            try {
                const res = await axios.get(`${JOB_API_END_POINT}/get/${jobId}`,{withCredentials:true});
                if(res.data.success){
                    dispatch(setSingleJob(res.data.job));
                    setIsApplied(res.data.job.applications.some(application=>application.applicant === user?._id)) // Ensure the state is in sync with fetched data
                }
            } catch (error) {
                console.log(error);
                toast.error("Không thể tải thông tin công việc. Vui lòng thử lại sau.");
            }
        }
        if (jobId) {
            fetchSingleJob();
        } 
    },[jobId,dispatch, user?._id]);

    // Array of job benefits - could be dynamic in a real application
    const benefits = [
        "Flexible working hours",
        "Health insurance",
        "Professional development",
        "Competitive salary",
        "Remote work options"
    ];

    if (!singleJob) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="bg-secondary/5 min-h-screen pb-16">
                {/* Hero Section with Company Info */}
                <div className="bg-gradient-to-r from-primary/90 to-accent/90 text-white">
                    <div className="max-w-7xl mx-auto px-4 py-8">
                        <div className="flex items-center mb-4">
                            <Link to="/jobs" className="flex items-center text-white/90 hover:text-white transition-colors">
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                <span>Back to jobs</span>
                            </Link>
                        </div>
                        
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            <Avatar className="h-20 w-20 rounded-lg border-4 border-white/20 shadow-lg">
                                <AvatarImage src={singleJob?.company?.logo} alt={singleJob?.company?.name} />
                            </Avatar>
                            
                            <div className="flex-1">
                                <motion.h1 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-3xl font-bold mb-2"
                                >
                                    {singleJob?.title}
                                </motion.h1>
                                
                                <div className="flex flex-wrap items-center gap-4 text-white/90">
                                    <div className="flex items-center gap-1">
                                        <Building className="h-4 w-4" />
                                        <span>{singleJob?.company?.name || "Company"}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        <span>{singleJob?.location}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>Posted on {formatDate(singleJob?.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-4 md:mt-0 flex gap-3 self-start">
                                <Button 
                                    onClick={isApplied ? null : applyJobHandler} 
                                    disabled={isApplied || isApplying}
                                    className={`${isApplied 
                                        ? 'bg-white/20 hover:bg-white/20 text-white cursor-not-allowed' 
                                        : 'bg-white hover:bg-white/90 text-primary'} 
                                        transition-all duration-300 shadow-md hover:shadow-lg px-6`}
                                >
                                    {isApplying ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Applying...
                                        </>
                                    ) : isApplied ? 'Application Submitted' : 'Apply Now'}
                                </Button>
                                
                                <Button 
                                    variant="outline" 
                                    onClick={toggleSaveJob}
                                    className={`bg-transparent border-white border hover:bg-white/10 transition-all duration-300 ${isSaved ? 'text-accent border-accent fill-accent' : 'text-white'}`}
                                    title={isSaved ? "Unsave this job" : "Save this job"}
                                >
                                    <BookmarkPlus className={`h-5 w-5 ${isSaved ? 'fill-accent' : ''}`} />
                                </Button>
                                
                                <Button 
                                    variant="outline" 
                                    className="bg-transparent border-white border text-white hover:bg-white/10"
                                    title="Share this job"
                                >
                                    <Share2 className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                        
                        {/* Job Highlight Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-full">
                                        <Briefcase className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-white/70 text-sm">Job Type</p>
                                        <p className="font-medium">{singleJob?.jobType}</p>
                                    </div>
                                </div>
                            </motion.div>
                            
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-full">
                                        <Banknote className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-white/70 text-sm">Salary</p>
                                        <p className="font-medium">{formatSalary(singleJob?.salary)}</p>
                                    </div>
                                </div>
                            </motion.div>
                            
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-full">
                                        <GraduationCap className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-white/70 text-sm">Experience</p>
                                        <p className="font-medium">{singleJob?.experienceLevel} years</p>
                                    </div>
                                </div>
                            </motion.div>
                            
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-full">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-white/70 text-sm">Vacancies</p>
                                        <p className="font-medium">{singleJob?.position} position{singleJob?.position > 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Main Job Info */}
                        <div className="lg:col-span-2">
                            {/* Description */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-6 rounded-xl shadow-md mb-8"
                            >
                                <h2 className="text-xl font-bold mb-4 flex items-center">
                                    <Briefcase className="mr-2 h-5 w-5 text-accent" />
                                    About This Role
                                </h2>
                                <div className="prose max-w-none">
                                    <p className="text-gray-700 leading-relaxed">{singleJob?.description}</p>
                                </div>
                            </motion.div>
                            
                            {/* Requirements */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white p-6 rounded-xl shadow-md mb-8"
                            >
                                <h2 className="text-xl font-bold mb-4 flex items-center">
                                    <CheckCircle2 className="mr-2 h-5 w-5 text-accent" />
                                    Requirements & Skills
                                </h2>
                                <ul className="space-y-3">
                                    {Array.isArray(singleJob?.requirements) 
                                        ? singleJob?.requirements.map((req, index) => (
                                            <li key={index} className="flex items-start">
                                                <div className="min-w-[24px] h-6 flex items-center justify-center mt-0.5">
                                                    <div className="h-2 w-2 rounded-full bg-accent"></div>
                                                </div>
                                                <span className="text-gray-700">{req}</span>
                                            </li>
                                        ))
                                        : typeof singleJob?.requirements === 'string' ? (
                                            <li className="flex items-start">
                                                <div className="min-w-[24px] h-6 flex items-center justify-center mt-0.5">
                                                    <div className="h-2 w-2 rounded-full bg-accent"></div>
                                                </div>
                                                <span className="text-gray-700">{singleJob?.requirements}</span>
                                            </li>
                                        ) : (
                                            <li className="text-gray-500">No specific requirements listed</li>
                                        )
                                    }
                                </ul>
                            </motion.div>
                            
                            {/* Benefits */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white p-6 rounded-xl shadow-md"
                            >
                                <h2 className="text-xl font-bold mb-4 flex items-center">
                                    <GraduationCap className="mr-2 h-5 w-5 text-accent" />
                                    Benefits & Perks
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {benefits.map((benefit, index) => (
                                        <div key={index} className="flex items-center gap-2 bg-secondary/10 px-4 py-3 rounded-lg">
                                            <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
                                            <span>{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                        
                        {/* Right Column - Company Info & Stats */}
                        <div>
                            {/* Company Card */}
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white p-6 rounded-xl shadow-md mb-8"
                            >
                                <h2 className="text-xl font-bold mb-4 flex items-center">
                                    <Building className="mr-2 h-5 w-5 text-accent" />
                                    About The Company
                                </h2>
                                <div className="flex items-center gap-4 mb-4">
                                    <Avatar className="h-16 w-16 rounded-lg shadow border border-gray-100">
                                        <AvatarImage src={singleJob?.company?.logo} alt={singleJob?.company?.name} />
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold text-lg">{singleJob?.company?.name}</h3>
                                        <p className="text-sm text-gray-600">{singleJob?.location}</p>
                                    </div>
                                </div>
                                
                                <p className="text-gray-700 mb-4">{singleJob?.company?.description || "A leading company in the industry with a focus on innovation and growth."}</p>
                                
                                {singleJob?.company?.website && (
                                    <a 
                                        href={singleJob?.company?.website} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-accent hover:text-accent/80 flex items-center gap-1 text-sm font-medium"
                                    >
                                        Visit Website
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                )}
                            </motion.div>
                            
                            {/* Job Stats */}
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white p-6 rounded-xl shadow-md"
                            >
                                <h2 className="text-xl font-bold mb-4 flex items-center">
                                    <Clock className="mr-2 h-5 w-5 text-accent" />
                                    Job Stats
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                        <span className="text-gray-600">Posted on</span>
                                        <span className="font-medium">{formatDate(singleJob?.createdAt)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                        <span className="text-gray-600">Applicants</span>
                                        <span className="font-medium">{singleJob?.applications?.length || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                        <span className="text-gray-600">Job type</span>
                                        <Badge className="font-semibold bg-accent/10 text-accent border-0">{singleJob?.jobType}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                        <span className="text-gray-600">Experience</span>
                                        <span className="font-medium">{singleJob?.experienceLevel} years</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Salary</span>
                                        <span className="font-medium">{formatSalary(singleJob?.salary)}</span>
                                    </div>
                                </div>
                            </motion.div>
                            
                            {/* Apply Button (Mobile Sticky) */}
                            <div className="lg:hidden sticky bottom-4 mt-8">
                                <Button 
                                    onClick={isApplied ? null : applyJobHandler}
                                    disabled={isApplied || isApplying}
                                    className={`w-full py-6 text-lg shadow-lg ${
                                        isApplied 
                                            ? 'bg-gray-400 hover:bg-gray-400' 
                                            : 'bg-accent hover:bg-accent/90'
                                    }`}
                                >
                                    {isApplying ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Applying...
                                        </>
                                    ) : isApplied ? 'Application Submitted' : 'Apply Now'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default JobDescription