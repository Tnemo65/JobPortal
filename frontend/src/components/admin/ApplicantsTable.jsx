import React from 'react'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { FileText, MoreHorizontal, Check, X, Github, Linkedin } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { APPLICATION_API_END_POINT } from '@/utils/constant';
import axios from 'axios';
import { Badge } from '../ui/badge';

const shortlistingStatus = ["Accepted", "Rejected"];

const ApplicantsTable = () => {
    const { applicants } = useSelector(store => store.application);

    const statusHandler = async (status, id) => {
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.post(`${APPLICATION_API_END_POINT}/status/${id}/update`, { status });
            if (res.data.success) {
                toast.success(res.data.message);
            }
        } catch (error) {
            toast.error(error.response.data.message);
        }
    }

    // Format file name for display
    const getResumeTitle = (resume) => {
        if (!resume) return 'NA';
        
        if (typeof resume === 'object') {
            return resume.title || resume.originalName || 'Resume';
        } else {
            // For string format, extract filename from URL or use fallback
            const urlParts = resume.split('/');
            return urlParts[urlParts.length - 1] || 'Resume';
        }
    }

    return (
        <div>
            <Table>
                <TableCaption>A list of your recent applied user</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>FullName</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Social Links</TableHead>
                        <TableHead>Resume</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {
                        applicants && applicants?.applications?.map((item) => (
                            <tr key={item._id}>
                                <TableCell>{item?.applicant?.fullname}</TableCell>
                                <TableCell>{item?.applicant?.email}</TableCell>
                                <TableCell>{item?.applicant?.phoneNumber}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        {item.applicant?.profile?.githubUsername && (
                                            <a 
                                                href={`https://github.com/${item.applicant.profile.githubUsername}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="flex items-center gap-1 text-gray-700 hover:text-accent transition-colors"
                                                title={`GitHub: ${item.applicant.profile.githubUsername}`}
                                            >
                                                <Github size={16} />
                                                <span className="text-xs">{item.applicant.profile.githubUsername}</span>
                                            </a>
                                        )}
                                        {item.applicant?.profile?.linkedinUsername && (
                                            <a 
                                                href={`https://linkedin.com/in/${item.applicant.profile.linkedinUsername}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="flex items-center gap-1 text-gray-700 hover:text-accent transition-colors"
                                                title={`LinkedIn: ${item.applicant.profile.linkedinUsername}`}
                                            >
                                                <Linkedin size={16} />
                                                <span className="text-xs">{item.applicant.profile.linkedinUsername}</span>
                                            </a>
                                        )}
                                        {!item.applicant?.profile?.githubUsername && !item.applicant?.profile?.linkedinUsername && (
                                            <span className="text-gray-400 text-xs">Không có liên kết</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {
                                        item.applicant?.profile?.resume ? 
                                        <a 
                                            className="flex items-center gap-2 text-accent hover:text-accent/80 transition-colors group" 
                                            href={typeof item.applicant.profile.resume === 'string' 
                                                ? item.applicant.profile.resume 
                                                : item.applicant.profile.resume.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                        >
                                            <div className="bg-accent/10 p-1.5 rounded-md group-hover:bg-accent/20 transition-colors">
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium group-hover:underline">
                                                {typeof item.applicant.profile.resume === 'object' 
                                                    ? item.applicant.profile.resume.title || item.applicant.profile.resume.originalName || 'Resume'
                                                    : item.applicant.profile.resumeOriginalName || 'Resume'}
                                            </span>
                                        </a> 
                                        : <span className="text-gray-400">Không có CV</span>
                                    }
                                </TableCell>
                                <TableCell>{item?.applicant.createdAt.split("T")[0]}</TableCell>
                                <TableCell className="float-right">
                                    <Popover>
                                        <PopoverTrigger className="cursor-pointer">
                                            <MoreHorizontal />
                                        </PopoverTrigger>
                                        <PopoverContent className="w-48">
                                            {
                                                shortlistingStatus.map((status, index) => {
                                                    return (
                                                        <div 
                                                            onClick={() => statusHandler(status, item?._id)} 
                                                            key={index} 
                                                            className='flex items-center gap-2.5 p-2 cursor-pointer hover:bg-secondary/10 rounded-md transition-colors'
                                                        >
                                                            {status === "Accepted" ? (
                                                                <Check className="h-4 w-4 text-green-500" />
                                                            ) : (
                                                                <X className="h-4 w-4 text-red-500" />
                                                            )}
                                                            <span>{status}</span>
                                                        </div>
                                                    )
                                                })
                                            }
                                        </PopoverContent>
                                    </Popover>
                                </TableCell>
                            </tr>
                        ))
                    }
                </TableBody>
            </Table>
        </div>
    )
}

export default ApplicantsTable