import React, { useState, useEffect } from 'react'
import Navbar from './shared/Navbar'
import { Avatar, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { Contact, Mail, Pen, Github, Linkedin, FileText, Facebook } from 'lucide-react'
import { Badge } from './ui/badge'
import { Label } from './ui/label'
import AppliedJobTable from './AppliedJobTable'
import UpdateProfileDialog from './UpdateProfileDialog'
import { useSelector } from 'react-redux'
import useGetAppliedJobs from '@/hooks/useGetAppliedJobs'

const Profile = () => {
    // Đảm bảo các công việc đã ứng tuyển được tải mới khi truy cập trang hồ sơ
    const { refreshAppliedJobs } = useGetAppliedJobs();
    const [open, setOpen] = useState(false);
    const {user} = useSelector(store=>store.auth);
    
    // State để lưu trữ dữ liệu người dùng (để cập nhật ngay sau khi chỉnh sửa)
    const [userData, setUserData] = useState(user);
    
    // Cập nhật userData khi user trong redux store thay đổi
    useEffect(() => {
        if (user) {
            setUserData(user);
        }
    }, [user]);
    
    // Cập nhật userData khi dialog đóng
    useEffect(() => {
        if (!open && user) {
            setUserData(user);
        }
    }, [open, user]);

    // Làm mới danh sách công việc đã ứng tuyển khi vào trang hồ sơ
    useEffect(() => {
        refreshAppliedJobs();
    }, [refreshAppliedJobs]);

    // Kiểm tra có resume hay không để hiển thị phù hợp
    const hasResume = userData?.profile?.resume && 
                    (typeof userData?.profile?.resume === 'string' || 
                    (typeof userData?.profile?.resume === 'object' && userData?.profile?.resume?.url));

    // Lấy URL của resume
    const resumeUrl = typeof userData?.profile?.resume === 'string' 
                    ? userData?.profile?.resume 
                    : userData?.profile?.resume?.url;

    // Lấy tiêu đề resume
    const resumeTitle = typeof userData?.profile?.resume === 'object' 
                    ? userData?.profile?.resume?.title || 'Resume' 
                    : userData?.profile?.resumeOriginalName || 'Resume';

    // Lấy avatar
    const avatarUrl = userData?.profile?.profilePhoto;

    return (
        <div>
            <Navbar />
            <div className='max-w-4xl mx-auto bg-white rounded-2xl border border-gray-200 p-8 mt-5'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                        <Avatar className='w-20 h-20'>
                            <AvatarImage src={avatarUrl} alt={userData?.fullname} />
                            {!avatarUrl && (
                                <div className="flex h-full w-full items-center justify-center bg-secondary text-4xl">
                                    {userData?.fullname?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </Avatar>
                        <div>
                            <h1 className='font-bold text-2xl'>{userData?.fullname}</h1>
                            <p className='text-gray-600'>{userData?.email}</p>
                        </div>
                    </div>
                    <Button onClick={() => setOpen(true)} variant="ghost" className='border border-gray-200 gap-2'>
                        <Pen className='w-4 h-4' />
                        Cập nhật hồ sơ
                    </Button>
                </div>
                
                {/* Bio */}
                <div className='my-5'>
                    <h2 className="font-bold text-lg mb-3">Giới thiệu</h2>
                    <p className='text-gray-700'>
                        {userData?.profile?.bio || <span className="text-gray-400">Chưa cập nhật</span>}
                    </p>
                </div>
                
                {/* Mạng xã hội */}
                <div className='my-5'>
                    <h2 className="font-bold text-lg mb-3">Liên kết mạng xã hội</h2>
                    <div className='space-y-2'>
                        <div className='flex items-center gap-3'>
                            <Github className="h-4 w-4 text-gray-600" />
                            {userData?.profile?.githubUsername ? (
                                <a 
                                    href={`https://github.com/${userData.profile.githubUsername}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-accent hover:underline"
                                >
                                    {userData.profile.githubUsername}
                                </a>
                            ) : (
                                <span className="text-gray-400">Chưa cập nhật</span>
                            )}
                        </div>
                        <div className='flex items-center gap-3'>
                            <Linkedin className="h-4 w-4 text-gray-600" />
                            {userData?.profile?.linkedinUsername ? (
                                <a 
                                    href={`https://linkedin.com/in/${userData.profile.linkedinUsername}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-accent hover:underline"
                                >
                                    {userData.profile.linkedinUsername}
                                </a>
                            ) : (
                                <span className="text-gray-400">Chưa cập nhật</span>
                            )}
                        </div>
                        <div className='flex items-center gap-3'>
                            <Facebook className="h-4 w-4 text-gray-600" />
                            {userData?.profile?.facebookUsername ? (
                                <a 
                                    href={`https://facebook.com/${userData.profile.facebookUsername}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-accent hover:underline"
                                >
                                    {userData.profile.facebookUsername}
                                </a>
                            ) : (
                                <span className="text-gray-400">Chưa cập nhật</span>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Thông tin liên hệ */}
                <div className='my-5'>
                    <h2 className="font-bold text-lg mb-3">Thông tin liên hệ</h2>
                    <div className='flex items-center gap-3 my-2'>
                        <Mail className="h-4 w-4 text-gray-600" />
                        <span>{user?.email}</span>
                    </div>
                    <div className='flex items-center gap-3 my-2'>
                        <Contact className="h-4 w-4 text-gray-600" />
                        <span>{user?.phoneNumber || <span className="text-gray-400">Chưa cập nhật</span>}</span>
                    </div>
                </div>
                
                {/* Skills */}
                <div className='my-5'>
                    <h2 className="font-bold text-lg mb-3">Kỹ năng</h2>
                    <div className='flex flex-wrap gap-2'>
                        {
                            userData?.profile?.skills && userData?.profile?.skills.length !== 0 
                            ? userData?.profile?.skills.map((item, index) => <Badge key={index}>{item}</Badge>) 
                            : <span className="text-gray-400">Chưa cập nhật</span>
                        }
                    </div>
                </div>
                
                {/* Resume */}
                <div className='my-5'>
                    <h2 className="font-bold text-lg mb-3">CV / Resume</h2>
                    <div className='flex items-center gap-3'>
                        <FileText className="h-4 w-4 text-gray-600" />
                        {hasResume ? (
                            <a 
                                href={resumeUrl} 
                                target='_blank' 
                                rel="noopener noreferrer" 
                                className='text-accent hover:underline'
                            >
                                {resumeTitle}
                            </a>
                        ) : (
                            <span className="text-gray-400">Chưa cập nhật</span>
                        )}
                    </div>
                </div>
            </div>
            
            <div className='max-w-4xl mx-auto bg-white rounded-2xl border border-gray-200 p-8 mt-6'>
                <h1 className='font-bold text-lg mb-5'>Công việc đã ứng tuyển</h1>
                {/* Applied Job Table */}
                <AppliedJobTable />
            </div>
            
            <UpdateProfileDialog open={open} setOpen={setOpen}/>
        </div>
    )
}

export default Profile