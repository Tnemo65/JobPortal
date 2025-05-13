import React, { useState } from 'react'
import Navbar from '../shared/Navbar'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { COMPANY_API_END_POINT } from '@/utils/constant'
import { toast } from 'sonner'
import { useDispatch } from 'react-redux'
import { setSingleCompany, addCompany } from '@/redux/companySlice'
import { Textarea } from '../ui/textarea'
import { Loader2 } from 'lucide-react'
import useGetAllCompanies from '@/hooks/useGetAllCompanies'

const CompanyCreate = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const { getAllCompanies } = useGetAllCompanies();
    const [input, setInput] = useState({
        companyName: "",
        description: "",
        website: "",
        location: "",
        file: null
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInput(prev => ({ ...prev, [name]: value }));
    }

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setInput(prev => ({ ...prev, file }));
        }
    }

    const registerNewCompany = async (e) => {
        e.preventDefault();
        
        if (!input.companyName?.trim()) {
            toast.error("Company name is required");
            return;
        }

        try {
            setLoading(true);
            
            let res;
            
            if (input.file) {
                const formData = new FormData();
                formData.append("companyName", input.companyName);
                formData.append("description", input.description);
                formData.append("website", input.website);
                formData.append("location", input.location);
                formData.append("file", input.file);
                
                res = await axios.post(`${COMPANY_API_END_POINT}/register`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    withCredentials: true
                });
            } else {
                res = await axios.post(`${COMPANY_API_END_POINT}/register`, input, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                });
            }
            
            if (res?.data?.success) {
                // Cập nhật Redux store trực tiếp với công ty mới
                dispatch(setSingleCompany(res.data.company));
                dispatch(addCompany(res.data.company));
                    // Xóa cache API để đảm bảo dữ liệu mới nhất
    try {
        await axios.post(`${API_URL}/cache/clear`, { type: 'companies' }, {
            withCredentials: true
        });
    } catch (error) {
        console.log("Cache clear error:", error);
    }
    
    // Lưu flag trong sessionStorage để biết cần refresh
    sessionStorage.setItem('companyAdded', 'true');
    
                toast.success(res.data.message);
                
                // Chuyển hướng sau một khoảng thời gian ngắn để đảm bảo Redux đã cập nhật
                setTimeout(() => {
                    navigate("/admin/companies");
                }, 300);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || "Failed to create company");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <Navbar />
            <div className='max-w-4xl mx-auto my-8 px-4'>
                <div className='mb-8'>
                    <h1 className='font-bold text-2xl mb-2'>Create Your Company</h1>
                    <p className='text-gray-500'>Complete the form below to register your company</p>
                </div>

                <form onSubmit={registerNewCompany} className='space-y-6 bg-white p-8 rounded-lg shadow-md'>
                    <div className='space-y-4'>
                        <div>
                            <Label htmlFor="companyName">Company Name<span className="text-red-500">*</span></Label>
                            <Input
                                id="companyName"
                                name="companyName"
                                className="mt-1"
                                placeholder="JobHunt, Microsoft etc."
                                value={input.companyName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                className="mt-1"
                                placeholder="Tell us about your company..."
                                value={input.description}
                                onChange={handleChange}
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    name="website"
                                    className="mt-1"
                                    placeholder="https://example.com"
                                    value={input.website}
                                    onChange={handleChange}
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    name="location"
                                    className="mt-1"
                                    placeholder="City, Country"
                                    value={input.location}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        
                        <div>
                            <Label htmlFor="logo">Company Logo</Label>
                            <Input
                                id="logo"
                                name="file"
                                type="file"
                                accept="image/*"
                                className="mt-1"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>
                    
                    <div className='flex items-center gap-3 pt-4'>
                        <Button 
                            variant="outline" 
                            type="button"
                            onClick={() => navigate("/admin/companies")}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit"
                            disabled={loading || !input.companyName.trim()}
                            className="bg-accent hover:bg-accent/90"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : "Create Company"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CompanyCreate