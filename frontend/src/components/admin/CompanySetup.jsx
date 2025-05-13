import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { toast } from 'sonner';
import { COMPANY_API_END_POINT, API_URL } from '@/utils/constant';
import useGetCompanyById from '@/hooks/useGetCompanyById';
import { updateCompany } from '@/redux/companySlice';
import Navbar from '../shared/Navbar';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';

const CompanySetup = () => {
    const params = useParams();
    useGetCompanyById(params.id);
    const [input, setInput] = useState({
        name: "",
        description: "",
        website: "",
        location: "",
        file: null
    });
    const {singleCompany} = useSelector(store=>store.company);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    }

    const changeFileHandler = (e) => {
        const file = e.target.files?.[0];
        setInput({ ...input, file });
    }

    const submitHandler = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("name", input.name);
        formData.append("description", input.description);
        formData.append("website", input.website);
        formData.append("location", input.location);
        if (input.file) {
            formData.append("file", input.file);
        }
        try {
            setLoading(true);
            const res = await axios.put(`${COMPANY_API_END_POINT}/update/${params.id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true
            });
            
            if (res.data.success) {
                // Cập nhật Redux store trực tiếp
                dispatch(updateCompany(res.data.company));
                
                // Xóa cache API để đảm bảo dữ liệu mới nhất
                try {
                    await axios.post(`${API_URL}/cache/clear`, { type: 'companies' }, {
                        withCredentials: true
                    });
                } catch (error) {
                    console.log("Cache clear error:", error);
                }
                
                // Lưu flag trong sessionStorage để biết cần refresh
                sessionStorage.setItem('companyUpdated', 'true');
                
                toast.success(res.data.message);
                navigate("/admin/companies");
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setInput({
            name: singleCompany.name || "",
            description: singleCompany.description || "",
            website: singleCompany.website || "",
            location: singleCompany.location || "",
            file: null
        })
    },[singleCompany]);

    return (
        <div>
            <Navbar />
            <div className='max-w-xl mx-auto my-10'>
                <form onSubmit={submitHandler} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
                    <div>
                        <Label htmlFor="name">Company Name</Label>
                        <Input 
                            id="name"
                            className='mt-1'
                            name="name"
                            value={input.name}
                            onChange={changeEventHandler}
                            required
                        />
                    </div>
                    
                    <div>
                        <Label htmlFor="description">Company Description</Label>
                        <Textarea
                            id="description"
                            className='mt-1'
                            name="description"
                            value={input.description}
                            onChange={changeEventHandler}
                        />
                    </div>
                    
                    <div>
                        <Label htmlFor="website">Website</Label>
                        <Input 
                            id="website"
                            className='mt-1'
                            name="website"
                            value={input.website}
                            onChange={changeEventHandler}
                        />
                    </div>
                    
                    <div>
                        <Label htmlFor="location">Location</Label>
                        <Input 
                            id="location"
                            className='mt-1'
                            name="location"
                            value={input.location}
                            onChange={changeEventHandler}
                        />
                    </div>
                    
                    <div>
                        <Label htmlFor="file">Logo</Label>
                        <Input 
                            id="file"
                            className='mt-1'
                            name="file"
                            type="file"
                            accept='image/*'
                            onChange={changeFileHandler}
                        />
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
                            disabled={loading}
                            className="bg-accent hover:bg-accent/90"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : "Update Company"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CompanySetup;