import React from 'react'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { useSelector } from 'react-redux'

const AppliedJobTable = () => {
    const {allAppliedJobs} = useSelector(store=>store.job);
    
    // Hàm xử lý hiển thị ngày
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return dateString.split("T")[0];
    };

    const getStatusBadge = (job) => {
        // Nếu là dữ liệu từ application (có trường status)
        if (job.status) {
            return (
                <Badge className={`${
                    job.status === "rejected" ? 'bg-red-400' : 
                    job.status === 'pending' ? 'bg-gray-400' : 
                    'bg-green-400'
                }`}>
                    {job.status.toUpperCase()}
                </Badge>
            );
        }
        // Nếu là dữ liệu trực tiếp từ job (không có trường status)
        return <Badge className="bg-blue-400">APPLIED</Badge>;
    };

    // Hiển thị dữ liệu công việc phù hợp với cả hai nguồn dữ liệu
    const renderJobRow = (job) => {
        // Xử lý trường hợp dữ liệu từ application
        if (job.job) {
            return (
                <TableRow key={job._id}>
                    <TableCell>{formatDate(job.createdAt)}</TableCell>
                    <TableCell>{job.job.title}</TableCell>
                    <TableCell>{job.job.company?.name}</TableCell>
                    <TableCell className="text-right">{getStatusBadge(job)}</TableCell>
                </TableRow>
            );
        }
        // Xử lý trường hợp dữ liệu trực tiếp từ job (từ appliedJobs)
        return (
            <TableRow key={job._id}>
                <TableCell>{formatDate(job.createdAt)}</TableCell>
                <TableCell>{job.title}</TableCell>
                <TableCell>{job.company?.name}</TableCell>
                <TableCell className="text-right">{getStatusBadge(job)}</TableCell>
            </TableRow>
        );
    };

    return (
        <div>
            <Table>
                <TableCaption>A list of your applied jobs</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Job Role</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {
                        allAppliedJobs.length <= 0 ? 
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">You haven't applied to any job yet.</TableCell>
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