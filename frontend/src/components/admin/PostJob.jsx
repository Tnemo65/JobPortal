import React, { useState, useEffect } from 'react'
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { JOB_API_END_POINT, API_URL } from '@/utils/constant';
import { toast } from 'sonner';
import Navbar from '../shared/Navbar';
import { addAdminJob } from '@/redux/jobSlice';
import useGetAllCompanies from '@/hooks/useGetAllCompanies';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const initialState = {
    title: "",
    description: "",
    requirements: "",
    company: "",
    jobType: "",
    experienceLevel: "",
    location: "",
    salary: ""
};

const PostJob = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [input, setInput] = useState(initialState);
    const [loading, setLoading] = useState(false);
    const { companies } = useSelector(store => store.company);
    const { getAllCompanies } = useGetAllCompanies();

    useEffect(() => {
        getAllCompanies();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInput({ ...input, [name]: value });
    };

    const handleSelectChange = (name, value) => {
        setInput({ ...input, [name]: value });
    };

    const prepareRequirements = (requirementsString) => {
        if (!requirementsString) return [];
        
        // Split by new lines and filter out empty strings
        return requirementsString
            .split('\n')
            .map(item => item.trim())
            .filter(item => item !== '');
    };

    const createJob = async (e) => {
        e.preventDefault();

        if (!input.title || !input.description || !input.company || !input.jobType || !input.location) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            setLoading(true);

            const jobData = {
                ...input,
                requirements: prepareRequirements(input.requirements),
                salary: input.salary ? Number(input.salary) : undefined
            };

            const res = await axios.post(`${JOB_API_END_POINT}/create`, jobData, {
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
                
                // Chuyển hướng ngay lập tức, không cần setTimeout
                navigate("/admin/jobs");
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

                <form onSubmit={createJob} className='space-y-6 bg-white p-8 rounded-lg shadow-md'>
                    <div className='grid grid-cols-1 gap-6'>
                        <div>
                            <Label htmlFor="title">Job Title<span className="text-red-500">*</span></Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="e.g. Senior Frontend Developer"
                                className="mt-1"
                                value={input.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="company">Company<span className="text-red-500">*</span></Label>
                            <Select 
                                name="company" 
                                value={input.company} 
                                onValueChange={(value) => handleSelectChange("company", value)}
                                required
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select company" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies?.map((company) => (
                                        <SelectItem key={company._id} value={company._id}>
                                            {company.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="description">Job Description<span className="text-red-500">*</span></Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Describe the job role, responsibilities, and other details"
                                className="mt-1 min-h-[150px]"
                                value={input.description}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="requirements">Requirements (Each on a new line)</Label>
                            <Textarea
                                id="requirements"
                                name="requirements"
                                placeholder="List job requirements, each on a new line"
                                className="mt-1 min-h-[120px]"
                                value={input.requirements}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="jobType">Job Type<span className="text-red-500">*</span></Label>
                                <Select 
                                    name="jobType" 
                                    value={input.jobType} 
                                    onValueChange={(value) => handleSelectChange("jobType", value)}
                                    required
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select job type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Toàn thời gian">Toàn thời gian</SelectItem>
                                        <SelectItem value="Bán thời gian">Bán thời gian</SelectItem>
                                        <SelectItem value="Hợp đồng">Hợp đồng</SelectItem>
                                        <SelectItem value="Thực tập">Thực tập</SelectItem>
                                        <SelectItem value="Freelance">Freelance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="experienceLevel">Experience Level</Label>
                                <Select 
                                    name="experienceLevel" 
                                    value={input.experienceLevel} 
                                    onValueChange={(value) => handleSelectChange("experienceLevel", value)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select experience level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Mới đi làm">Mới đi làm</SelectItem>
                                        <SelectItem value="Sơ cấp">Sơ cấp</SelectItem>
                                        <SelectItem value="Trung cấp">Trung cấp</SelectItem>
                                        <SelectItem value="Cao cấp">Cao cấp</SelectItem>
                                        <SelectItem value="Chuyên gia">Chuyên gia</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="location">Location<span className="text-red-500">*</span></Label>
                                <Input
                                    id="location"
                                    name="location"
                                    className="mt-1"
                                    placeholder="City, Country"
                                    value={input.location}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="salary">Salary</Label>
                                <Input
                                    id="salary"
                                    name="salary"
                                    type="number"
                                    className="mt-1"
                                    placeholder="Monthly salary in VND"
                                    value={input.salary}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                        <Button 
                            variant="outline" 
                            type="button"
                            onClick={() => navigate("/admin/jobs")}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            className="bg-accent hover:bg-accent/90"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Job...
                                </>
                            ) : (
                                "Create Job"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PostJob;