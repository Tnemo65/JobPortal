import React, { useEffect, useState } from 'react'
import Navbar from '../shared/Navbar'
import { Input } from '../ui/input'
import { Button } from '../ui/button' 
import { useNavigate } from 'react-router-dom' 
import { useDispatch } from 'react-redux' 
import AdminJobsTable from './AdminJobsTable'
import useGetAllAdminJobs from '@/hooks/useGetAllAdminJobs'
import { setSearchJobByText } from '@/redux/jobSlice'

const AdminJobs = () => {
  useGetAllAdminJobs();
  const [input, setInput] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
useEffect(() => {
    const jobChanged = 
        sessionStorage.getItem('jobAdded') || 
        sessionStorage.getItem('jobUpdated');
        
    if (jobChanged) {
        getAllAdminJobs(true);
        
        sessionStorage.removeItem('jobAdded');
        sessionStorage.removeItem('jobUpdated');
        
        const message = sessionStorage.getItem('jobAdded')
            ? "Thêm công việc thành công!"
            : "Cập nhật công việc thành công!";
            
        toast.success(message, {
            autoClose: 1500,
            position: "bottom-right"
        });
    }
}, []);
  useEffect(() => {
    dispatch(setSearchJobByText(input));
  }, [input]);
  return (
    <div>
      <Navbar />
      <div className='max-w-6xl mx-auto my-10'>
        <div className='flex items-center justify-between my-5'>
          <Input
            className="w-fit"
            placeholder="Filter by name, role"
            onChange={(e) => setInput(e.target.value)}
          />
          <Button onClick={() => navigate("/admin/jobs/create")}>New Jobs</Button>
        </div>
        <AdminJobsTable />
      </div>
    </div>
  )
}

export default AdminJobs