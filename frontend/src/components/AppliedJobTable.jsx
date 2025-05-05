import React from 'react'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { useSelector } from 'react-redux'
import { Loader2 } from 'lucide-react'
import useGetAppliedJobs from '@/hooks/useGetAppliedJobs'

const AppliedJobTable = () => {
    const { allAppliedJobs } = useSelector(store => store.job);
    // Sử dụng hook để theo dõi trạng thái loading
    const { loading } = useGetAppliedJobs();
    
    // Hàm xử lý hiển thị ngày
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            // Định dạng ngày tháng dễ đọc hơn
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return dateString.split("T")[0] || 'N/A';
        }
    };

    // Hàm xử lý hiển thị trạng thái
    const getStatusBadge = (job) => {
        // Lấy trạng thái từ đối tượng job
        let status = job.status || 'pending';
        
        // Chuyển đổi trạng thái thành tiếng Việt và thiết lập màu sắc
        let statusText = status.toUpperCase();
        let badgeClass = '';
        
        switch(status.toLowerCase()) {
            case 'rejected':
                statusText = 'TỪ CHỐI';
                badgeClass = 'bg-red-400';
                break;
            case 'accepted':
                statusText = 'CHẤP NHẬN';
                badgeClass = 'bg-green-400';
                break;
            case 'interview':
                statusText = 'PHỎNG VẤN';
                badgeClass = 'bg-blue-400';
                break;
            case 'pending':
            default:
                statusText = 'ĐANG XỬ LÝ';
                badgeClass = 'bg-gray-400';
                break;
        }
        
        return <Badge className={badgeClass}>{statusText}</Badge>;
    };

    // Hiển thị dữ liệu công việc phù hợp với cả hai nguồn dữ liệu
    const renderJobRow = (job) => {
        // Xử lý trường hợp dữ liệu từ application
        if (job.job) {
            return (
                <TableRow key={job._id} className="hover:bg-slate-50">
                    <TableCell>{formatDate(job.createdAt)}</TableCell>
                    <TableCell className="font-medium">{job.job.title}</TableCell>
                    <TableCell>{job.job.company?.name || 'N/A'}</TableCell>
                    <TableCell className="text-right">{getStatusBadge(job)}</TableCell>
                </TableRow>
            );
        }
        
        // Xử lý trường hợp dữ liệu trực tiếp từ job (từ appliedJobs)
        return (
            <TableRow key={job._id} className="hover:bg-slate-50">
                <TableCell>{formatDate(job.createdAt)}</TableCell>
                <TableCell className="font-medium">{job.title}</TableCell>
                <TableCell>{job.company?.name || 'N/A'}</TableCell>
                <TableCell className="text-right">{getStatusBadge(job)}</TableCell>
            </TableRow>
        );
    };

    // Hiển thị trạng thái đang tải
    if (loading) {
        return (
            <div className="py-8 flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                <span className="ml-2">Đang tải danh sách công việc...</span>
            </div>
        );
    }

    return (
        <div>
            <Table>
                <TableCaption className="italic text-gray-500">Danh sách công việc bạn đã ứng tuyển</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Ngày ứng tuyển</TableHead>
                        <TableHead>Vị trí công việc</TableHead>
                        <TableHead>Công ty</TableHead>
                        <TableHead className="text-right">Trạng thái</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {
                        !allAppliedJobs || allAppliedJobs.length <= 0 ? 
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                    Bạn chưa ứng tuyển vào vị trí nào
                                </TableCell>
                            </TableRow> 
                        : 
                            allAppliedJobs.map(job => renderJobRow(job))
                    }
                </TableBody>
            </Table>
        </div>
    )
}

export default AppliedJobTable