import React, { useState, useEffect } from 'react'
import Navbar from '../shared/Navbar'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useSelector, useDispatch } from 'react-redux'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import axios from 'axios'
import { COMPANY_API_END_POINT, JOB_API_END_POINT } from '@/utils/constant'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Loader2, Building, Plus } from 'lucide-react'
import { Textarea } from '../ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import useGetAllAdminJobs from '@/hooks/useGetAllAdminJobs'
import { addAdminJob } from '@/redux/jobSlice'

const PostJob = () => {
    const [input, setInput] = useState({
        title: "",
        description: "",
        requirements: "",
        salary: "",
        location: "",
        jobType: "",
        experienceLevel: "",
        position: 1,
        companyId: ""
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { companies } = useSelector(store => store.company);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const { getAllAdminJobs } = useGetAllAdminJobs(); // Import hook để refresh danh sách công việc
    
    // Job type options
    const jobTypes = ["Full-time", "Part-time", "Contract", "Internship", "Remote"];
    
    // Experience level options
    const experienceLevels = ["Entry", "Junior", "Mid", "Senior", "Lead"];

    const changeEventHandler = (e) => {
        const { name, value } = e.target;
        setInput({ ...input, [name]: value });
    };

    const selectCompanyHandler = (companyId) => {
        setInput({...input, companyId});
        const company = companies.find(c => c._id === companyId);
        setSelectedCompany(company);
    };

    const selectJobTypeHandler = (type) => {
        setInput({...input, jobType: type});
    };

    const selectExperienceHandler = (level) => {
        setInput({...input, experienceLevel: level});
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        
        // Validate form
        if (!input.title?.trim()) {
            toast.error("Job title is required");
            return;
        }
        
        if (!input.description?.trim()) {
            toast.error("Job description is required");
            return;
        }
        
        if (!input.companyId) {
            toast.error("Please select a company");
            return;
        }
        
        if (!input.jobType) {
            toast.error("Job type is required");
            return;
        }
        
        if (!input.experienceLevel) {
            toast.error("Experience level is required");
            return;
        }
        
        if (!input.location?.trim()) {
            toast.error("Job location is required");
            return;
        }
        
        if (!input.salary) {
            toast.error("Salary information is required");
            return;
        }
        
        try {
            setLoading(true);
            
            // Format the requirements as an array from comma-separated text
            const formattedData = {
                ...input,
                requirements: input.requirements.trim() 
                    ? input.requirements.split(',').map(req => req.trim())
                    : []
            };
            
            const res = await axios.post(`${JOB_API_END_POINT}/post`, formattedData, {
                headers: {
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });
            
            if(res.data.success){
                toast.success(res.data.message || "Job posted successfully");
                
                // Cập nhật Redux store trực tiếp với công việc mới
                dispatch(addAdminJob(res.data.job));
                
    // Xóa cache API để đảm bảo dữ liệu mới nhất
    try {
        await axios.post(`${API_URL}/cache/clear`, { type: 'jobs' }, {
            withCredentials: true
        });
    } catch (error) {
        console.log("Cache clear error:", error);
    }
    
    // Lưu flag trong sessionStorage để biết cần refresh
    sessionStorage.setItem('jobAdded', 'true');
                    setTimeout(() => {
                    navigate("/admin/jobs");
                }, 300);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to post job");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Navbar />
            <div className='max-w-4xl mx-auto my-8 px-4'>
                <div className='mb-8'>
                    <h1 className='font-bold text-2xl mb-2'>Create New Job</h1>
                    <p className='text-gray-500'>Fill in the details to post a new job opportunity</p>
                </div>
                
                <form onSubmit={submitHandler} className='space-y-6 bg-white p-8 rounded-lg shadow-md'>
                    {/* Company Selection */}
                    <div className="space-y-4">
                        <Label>Select Company<span className="text-red-500">*</span></Label>
                        {companies.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {companies.map((company) => (
                                    <div 
                                        key={company._id}
                                        onClick={() => selectCompanyHandler(company._id)}
                                        className={`p-4 border rounded-lg cursor-pointer transition-all flex items-center gap-3 ${
                                            input.companyId === company._id 
                                                ? 'border-accent bg-accent/5 shadow-md' 
                                                : 'border-gray-200 hover:border-accent/50 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Avatar className="h-10 w-10 rounded-md">
                                            {company.logo ? (
                                                <AvatarImage src={company.logo} alt={company.name} />
                                            ) : (
                                                <AvatarFallback className="bg-accent/10 text-accent">
                                                    {company.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{company.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{company.location || "No location"}</p>
                                        </div>
                                    </div>
                                ))}
                                
                                <div 
                                    onClick={() => navigate('/admin/companies/create')} 
                                    className="p-4 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-accent hover:bg-accent/5 transition-all flex flex-col items-center justify-center gap-2 h-full"
                                >
                                    <div className="p-2 rounded-full bg-accent/10">
                                        <Plus className="h-5 w-5 text-accent" />
                                    </div>
                                    <p className="font-medium text-center">Create New Company</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-6 rounded-lg border border-dashed border-gray-300 text-center">
                                <Building className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-500 mb-4">You don't have any companies yet</p>
                                <Button 
                                    onClick={() => navigate('/admin/companies/create')}
                                    className="bg-accent hover:bg-accent/90"
                                >
                                    Create Your First Company
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Job details */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <Label htmlFor="title">Job Title<span className="text-red-500">*</span></Label>
                            <Input
                                id="title"
                                type="text"
                                name="title"
                                value={input.title}
                                onChange={changeEventHandler}
                                className="mt-1"
                                placeholder="e.g. Frontend Developer"
                            />
                        </div>
                        
                        <div>
                            <Label htmlFor="location">Location<span className="text-red-500">*</span></Label>
                            <Input
                                id="location"
                                type="text"
                                name="location"
                                value={input.location}
                                onChange={changeEventHandler}
                                className="mt-1"
                                placeholder="e.g. New York, NY or Remote"
                            />
                        </div>
                        
                        <div>
                            <Label>Job Type<span className="text-red-500">*</span></Label>
                            <Select onValueChange={selectJobTypeHandler} value={input.jobType}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select job type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {jobTypes.map(type => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div>
                            <Label>Experience Level<span className="text-red-500">*</span></Label>
                            <Select onValueChange={selectExperienceHandler} value={input.experienceLevel}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select experience level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {experienceLevels.map(level => (
                                            <SelectItem key={level} value={level}>{level}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div>
                            <Label htmlFor="salary">Salary<span className="text-red-500">*</span></Label>
                            <Input
                                id="salary"
                                type="number"
                                name="salary"
                                value={input.salary}
                                onChange={changeEventHandler}
                                className="mt-1"
                                placeholder="e.g. 50000"
                            />
                        </div>
                        
                        <div>
                            <Label htmlFor="position">Number of Positions<span className="text-red-500">*</span></Label>
                            <Input
                                id="position"
                                type="number"
                                name="position"
                                value={input.position}
                                onChange={changeEventHandler}
                                className="mt-1"
                                min="1"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <Label htmlFor="description">Job Description<span className="text-red-500">*</span></Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={input.description}
                            onChange={changeEventHandler}
                            className="mt-1 min-h-32"
                            placeholder="Describe the job role, responsibilities, and your company's mission"
                        />
                    </div>
                    
                    <div>
                        <Label htmlFor="requirements">Requirements (comma separated)</Label>
                        <Textarea
                            id="requirements"
                            name="requirements"
                            value={input.requirements}
                            onChange={changeEventHandler}
                            className="mt-1"
                            placeholder="e.g. 3+ years of React experience, Knowledge of TypeScript, Strong communication skills"
                        />
                        <p className="text-xs text-gray-500 mt-1">Separate each requirement with a comma</p>
                    </div>
                    
                    <div className="pt-4">
                        <Button 
                            type="submit" 
                            className="w-full bg-accent hover:bg-accent/90"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating job...
                                </>
                            ) : "Post New Job"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default PostJob