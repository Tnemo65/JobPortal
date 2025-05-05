import React, { useEffect, useState } from 'react'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Edit2, Eye, MoreHorizontal, Users } from 'lucide-react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../ui/badge'
import { format } from 'date-fns'

const AdminJobsTable = () => { 
    const { allAdminJobs, searchJobByText } = useSelector(store => store.job);
    const [filterJobs, setFilterJobs] = useState([]);
    const navigate = useNavigate();

    // Format date helper
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            return format(new Date(dateString), 'MMM dd, yyyy');
        } catch (error) {
            return dateString.split('T')[0] || "N/A";
        }
    };

    useEffect(() => {
        if (allAdminJobs?.length > 0) {
            const filteredJobs = allAdminJobs.filter((job) => {
                if (!searchJobByText) {
                    return true;
                }
                const searchTerm = searchJobByText.toLowerCase();
                return (
                    (job?.title?.toLowerCase().includes(searchTerm)) || 
                    (job?.company?.name?.toLowerCase().includes(searchTerm))
                );
            });
            setFilterJobs(filteredJobs);
        } else {
            setFilterJobs([]);
        }
    }, [allAdminJobs, searchJobByText]);

    // Handle empty state
    if (filterJobs.length === 0) {
        return (
            <div className="text-center py-10 bg-white rounded-lg shadow">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Found</h3>
                <p className="text-gray-500 mb-6">
                    {searchJobByText ? 
                        "No jobs match your search criteria." : 
                        "You haven't posted any jobs yet."}
                </p>
                <button 
                    onClick={() => navigate('/admin/jobs/create')}
                    className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors"
                >
                    Post Your First Job
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <Table>
                <TableCaption>A list of your posted jobs</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Job Title</TableHead>
                        <TableHead>Applications</TableHead>
                        <TableHead>Posted Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filterJobs.map((job) => (
                        <TableRow key={job._id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8 rounded-md">
                                        {job?.company?.logo ? (
                                            <AvatarImage src={job.company.logo} alt={job.company.name} />
                                        ) : (
                                            <AvatarFallback className="bg-accent/10 text-accent rounded-md">
                                                {job?.company?.name?.substring(0, 2).toUpperCase() || "N/A"}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    <span className="truncate max-w-[150px]">{job.company?.name}</span>
                                </div>
                            </TableCell>
                            <TableCell>{job.title}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={`flex items-center gap-1 ${job.applicationCount > 0 ? 'bg-accent/10 hover:bg-accent/20 text-accent border-accent/20' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>
                                    <Users className="h-3.5 w-3.5" />
                                    <span>{job.applicationCount || 0} {job.applicationCount === 1 ? 'ứng viên' : 'ứng viên'}</span>
                                </Badge>
                            </TableCell>
                            <TableCell>{formatDate(job.createdAt)}</TableCell>
                            <TableCell className="text-right">
                                <Popover>
                                    <PopoverTrigger>
                                        <div className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 cursor-pointer hover:bg-gray-100">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-40" align="end">
                                        <div className="grid gap-1">
                                            <div 
                                                onClick={() => navigate(`/admin/jobs/${job._id}/applicants`)} 
                                                className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent/10 transition-colors"
                                            >
                                                <Eye className="h-4 w-4 text-accent" />
                                                <span>View Applicants</span>
                                            </div>
                                            {/* Currently, the edit job functionality isn't implemented in the backend, but we'll leave the UI element for future implementation */}
                                            {/* <div 
                                                onClick={() => navigate(`/admin/jobs/${job._id}/edit`)} 
                                                className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent/10 transition-colors"
                                            >
                                                <Edit2 className="h-4 w-4 text-accent" />
                                                <span>Edit Job</span>
                                            </div> */}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

export default AdminJobsTable