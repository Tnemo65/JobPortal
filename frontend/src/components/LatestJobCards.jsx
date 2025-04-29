import React from 'react';
import { Badge } from './ui/badge';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage } from './ui/avatar';
import { Briefcase, MapPin, Clock, ChevronRight } from 'lucide-react';

const LatestJobCards = ({job}) => {
    const navigate = useNavigate();
    
    // Tính thời gian đăng bài
    const getTimeAgo = (mongodbTime) => {
        const createdAt = new Date(mongodbTime);
        const currentTime = new Date();
        const timeDifference = currentTime - createdAt;
        const days = Math.floor(timeDifference/(1000*24*60*60));
        
        if (days === 0) return "Hôm nay";
        if (days === 1) return "Hôm qua";
        if (days < 7) return `${days} ngày trước`;
        if (days < 30) return `${Math.floor(days/7)} tuần trước`;
        return `${Math.floor(days/30)} tháng trước`;
    };
    
    // Cắt ngắn mô tả nếu quá dài
    const truncateDescription = (text, maxLength = 90) => {
        if (!text) return "";
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    };
    
    return (
        <div 
            onClick={() => navigate(`/description/${job?._id}`)} 
            className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg border border-secondary/20 hover:border-accent/30 transition-all duration-300 h-full flex flex-col cursor-pointer hover:-translate-y-1"
        >
            {/* Company Info */}
            <div className="p-5 flex items-center gap-3 border-b border-secondary/20">
                <Avatar className="h-12 w-12 rounded-md shadow-sm">
                    <AvatarImage src={job?.company?.logo} />
                </Avatar>
                <div className="flex-1">
                    <h3 className="font-medium text-primary line-clamp-1">{job?.company?.name || "Công ty"}</h3>
                    <div className="flex items-center text-xs text-muted-foreground gap-2">
                        <Clock className="h-3 w-3" />
                        <span>{getTimeAgo(job?.createdAt)}</span>
                    </div>
                </div>
                <Badge variant="outline" className="bg-secondary/10 text-xs border-0">
                    {job?.jobType || "Full-time"}
                </Badge>
            </div>
            
            {/* Job Details */}
            <div className="p-5 flex-1 flex flex-col">
                <h2 className="font-bold text-lg mb-2 text-primary group-hover:text-accent transition-colors line-clamp-1">
                    {job?.title || "Vị trí việc làm"}
                </h2>
                
                <p className="text-sm text-muted-foreground mb-4 flex-1">
                    {truncateDescription(job?.description)}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                    <div className="inline-flex items-center text-xs bg-primary/5 text-primary px-3 py-1 rounded-full">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{job?.location || "Vị trí"}</span>
                    </div>
                    <div className="inline-flex items-center text-xs bg-accent/5 text-accent px-3 py-1 rounded-full">
                        <Briefcase className="h-3 w-3 mr-1" />
                        <span>{job?.position || "1"} vị trí</span>
                    </div>
                    <div className="inline-flex items-center text-xs bg-secondary/10 text-primary px-3 py-1 rounded-full">
                        <span>{job?.salary || "Thỏa thuận"} LPA</span>
                    </div>
                </div>
                
                <div className="text-xs text-primary flex justify-end items-center group-hover:text-accent font-medium transition-colors">
                    <span>Xem chi tiết</span>
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </div>
    )
}

export default LatestJobCards;