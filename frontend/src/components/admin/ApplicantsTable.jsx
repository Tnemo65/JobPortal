import React, { useState } from 'react'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { FileText, MoreHorizontal, Check, X, Github, Linkedin, Clock, Calendar, Users } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { APPLICATION_API_END_POINT } from '@/utils/constant';
import axios from 'axios';
import { Badge } from '../ui/badge';

const shortlistingStatus = ["Accepted", "Rejected", "Interview"];

const ApplicantsTable = () => {
    // Sử dụng giá trị mặc định là {} nếu application không tồn tại trong store
    const application = useSelector(store => store.application || {});
    const { applicants } = application;
    const [updatingId, setUpdatingId] = useState(null);
    const [localStatus, setLocalStatus] = useState({});

    const statusHandler = async (status, id) => {
        const previousStatus = localStatus[id] || getStatusFromItem(id);

        setLocalStatus({
            ...localStatus,
            [id]: status
        });

        setUpdatingId(id);

        try {
            const res = await axios.post(`${APPLICATION_API_END_POINT}/status/${id}/update`, 
                { status },
                { withCredentials: true }
            );
            
            if (res.data.success) {
                toast.success(res.data.message);
            } else {
                setLocalStatus({
                    ...localStatus,
                    [id]: previousStatus
                });
                toast.error(res.data.message);
            }
        } catch (error) {
            setLocalStatus({
                ...localStatus,
                [id]: previousStatus
            });
            toast.error(error.response?.data?.message || "Không thể cập nhật trạng thái");
        } finally {
            setUpdatingId(null);
        }
    };

    const getStatusFromItem = (id) => {
        const item = applicants?.applications?.find(app => app._id === id);
        return item?.status || 'pending';
    };

    const renderStatus = (item) => {
        const status = localStatus[item._id] || item.status || 'pending';
        
        switch(status.toLowerCase()) {
            case 'accepted':
                return (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        <span>Đã chấp nhận</span>
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        <span>Từ chối</span>
                    </Badge>
                );
            case 'interview':
                return (
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Phỏng vấn</span>
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Đang xử lý</span>
                    </Badge>
                );
        }
    };

    const getResumeTitle = (resume) => {
        if (!resume) return 'NA';
        
        if (typeof resume === 'object') {
            return resume.title || resume.originalName || 'Resume';
        } else {
            const urlParts = resume.split('/');
            return urlParts[urlParts.length - 1] || 'Resume';
        }
    }

    if (!applicants?.applications || applicants.applications.length === 0) {
        return (
            <div className="bg-white p-8 rounded-lg text-center border">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium">Chưa có ứng viên nào</h3>
                <p className="text-gray-500 mt-2">
                    Công việc này chưa có ứng viên nào ứng tuyển.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <Table>
                <TableCaption>Danh sách ứng viên đã ứng tuyển</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Họ tên</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Liên hệ</TableHead>
                        <TableHead>Mạng xã hội</TableHead>
                        <TableHead>CV</TableHead>
                        <TableHead>Ngày ứng tuyển</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {applicants?.applications?.map((item) => (
                        <TableRow key={item._id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{item?.applicant.fullname}</TableCell>
                            <TableCell>{item?.applicant.email}</TableCell>
                            <TableCell>{item?.applicant.phoneNumber}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    {item?.applicant.profile?.githubLink && (
                                        <a 
                                            href={item.applicant.profile.githubLink} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="p-1.5 rounded-full hover:bg-accent/10 transition-colors"
                                        >
                                            <Github className="h-4 w-4 text-gray-600" />
                                        </a>
                                    )}
                                    {item?.applicant.profile?.linkedinLink && (
                                        <a 
                                            href={item.applicant.profile.linkedinLink} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="p-1.5 rounded-full hover:bg-accent/10 transition-colors"
                                        >
                                            <Linkedin className="h-4 w-4 text-blue-600" />
                                        </a>
                                    )}
                                    {!item?.applicant.profile?.githubLink && !item?.applicant.profile?.linkedinLink && (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                {(item?.applicant.profile && item?.applicant.profile.resume) ? 
                                    <a 
                                        href={typeof item.applicant.profile.resume === 'object' 
                                            ? item.applicant.profile.resume.url 
                                            : item.applicant.profile.resume} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="group flex items-center gap-2 text-sm hover:text-accent"
                                    >
                                        <div className="bg-accent/10 p-1.5 rounded-md group-hover:bg-accent/20 transition-colors">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <span className="font-medium group-hover:underline line-clamp-1">
                                            {typeof item.applicant.profile.resume === 'object' 
                                                ? item.applicant.profile.resume.title || item.applicant.profile.resume.originalName || 'Resume'
                                                : item.applicant.profile.resumeOriginalName || 'Resume'}
                                        </span>
                                    </a> 
                                    : <span className="text-gray-400">Không có CV</span>
                                }
                            </TableCell>
                            <TableCell>{new Date(item?.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>{renderStatus(item)}</TableCell>
                            <TableCell className="text-right">
                                <Popover>
                                    <PopoverTrigger className={`cursor-pointer inline-flex h-9 items-center justify-center rounded-md px-3 ${updatingId === item._id ? 'opacity-50 pointer-events-none' : ''}`}>
                                        {updatingId === item._id ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full"></div>
                                        ) : (
                                            <MoreHorizontal className="h-4 w-4" />
                                        )}
                                    </PopoverTrigger>
                                    <PopoverContent className="w-48">
                                        <div className="space-y-1">
                                            {shortlistingStatus.map((status, index) => {
                                                const currentStatus = (localStatus[item._id] || item.status || 'pending').toLowerCase();
                                                const buttonStatus = status.toLowerCase();
                                                const isCurrentStatus = currentStatus === buttonStatus;
                                                
                                                return (
                                                    <div 
                                                        onClick={() => !isCurrentStatus && statusHandler(status.toLowerCase(), item._id)} 
                                                        key={index} 
                                                        className={`flex items-center gap-2.5 p-2 rounded-md transition-colors ${
                                                            isCurrentStatus 
                                                                ? 'bg-accent/10 cursor-default'
                                                                : 'cursor-pointer hover:bg-secondary/10'
                                                        }`}
                                                    >
                                                        {buttonStatus === "accepted" ? (
                                                            <Check className={`h-4 w-4 ${isCurrentStatus ? 'text-accent' : 'text-green-500'}`} />
                                                        ) : buttonStatus === "rejected" ? (
                                                            <X className={`h-4 w-4 ${isCurrentStatus ? 'text-accent' : 'text-red-500'}`} />
                                                        ) : (
                                                            <Calendar className={`h-4 w-4 ${isCurrentStatus ? 'text-accent' : 'text-blue-500'}`} />
                                                        )}
                                                        <span className={isCurrentStatus ? 'font-medium' : ''}>{status}</span>
                                                        {isCurrentStatus && (
                                                            <Check className="h-3 w-3 ml-auto text-accent" />
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export default ApplicantsTable