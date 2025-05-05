import React, { useEffect, useState } from 'react'
import Navbar from './shared/Navbar'
import FilterCard from './FilterCard'
import Job from './Job';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, SlidersHorizontal, X, Info } from 'lucide-react';
import useGetAllJobs from '@/hooks/useGetAllJobs';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { setSearchedQuery } from '@/redux/jobSlice';

const Jobs = () => {
    const { allJobs, searchedQuery } = useSelector(store => store.job);
    const [filterJobs, setFilterJobs] = useState([]);
    const [sortOption, setSortOption] = useState("newest");  // Mặc định sắp xếp theo mới nhất
    const { loading, getAllJobs } = useGetAllJobs();
    const dispatch = useDispatch();

    // Fetch jobs when component mounts
    useEffect(() => {
        getAllJobs();
    }, []);

    // Filter and sort jobs
    useEffect(() => {
        if (allJobs && allJobs.length > 0) {
            let filtered = [...allJobs];

            // Apply search/filter
            if (searchedQuery) {
                const searchTermsArray = searchedQuery.toLowerCase().split(' ').filter(term => term.length > 0);
                
                if (searchTermsArray.length > 0) {
                    filtered = filtered.filter((job) => 
                        searchTermsArray.some(term => 
                            (job.title && job.title.toLowerCase().includes(term)) ||
                            (job.description && job.description.toLowerCase().includes(term)) ||
                            (job.location && job.location.toLowerCase().includes(term)) ||
                            (job.jobType && job.jobType.toLowerCase().includes(term)) ||
                            (job.experienceLevel && job.experienceLevel.toLowerCase().includes(term)) ||
                            (job.company && job.company.name && job.company.name.toLowerCase().includes(term))
                        )
                    );
                }
            }

            // Apply sorting
            filtered = sortJobs(filtered, sortOption);
            
            setFilterJobs(filtered);
        } else {
            setFilterJobs([]);
        }
    }, [allJobs, searchedQuery, sortOption]);

    // Handle sorting
    const sortJobs = (jobs, option) => {
        switch (option) {
            case "newest":
                return [...jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case "oldest":
                return [...jobs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            case "az":
                return [...jobs].sort((a, b) => a.title.localeCompare(b.title));
            case "za":
                return [...jobs].sort((a, b) => b.title.localeCompare(a.title));
            default:
                return jobs;
        }
    };

    // Handle sort change
    const handleSortChange = (value) => {
        setSortOption(value);
    };

    return (
        <div>
            <Navbar />
            <div className='max-w-7xl mx-auto px-4 mt-5'>
                {/* Mobile Filter Toggle */}
                <div className="md:hidden flex justify-between items-center mb-4">
                    <h1 className='font-medium text-xl'>Tìm kiếm việc làm</h1>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                                <Filter className="h-4 w-4" />
                                Bộ lọc
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] sm:w-[380px] px-2 pb-20">
                            <div className="h-full overflow-y-auto pt-2">
                                <FilterCard />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Search results summary */}
                <div className="flex flex-wrap items-center justify-between mb-5">
                    <div>
                        <h1 className='text-xl font-bold hidden md:block'>Việc làm dành cho bạn</h1>
                        <p className='text-gray-500 text-sm mt-1'>
                            {filterJobs.length} vị trí phù hợp {searchedQuery ? 'với tìm kiếm của bạn' : ''}
                        </p>
                    </div>
                    
                    {/* Sort dropdown */}
                    <div className="flex items-center gap-2 mt-2 md:mt-0">
                        <div className="flex items-center">
                            <SlidersHorizontal className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-sm mr-2 hidden sm:inline">Sắp xếp:</span>
                        </div>
                        <Select value={sortOption} onValueChange={handleSortChange}>
                            <SelectTrigger className="w-[130px] h-9 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Mới nhất</SelectItem>
                                <SelectItem value="oldest">Cũ nhất</SelectItem>
                                <SelectItem value="az">Tên A-Z</SelectItem>
                                <SelectItem value="za">Tên Z-A</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className='flex flex-col md:flex-row gap-5'>
                    {/* Desktop Filter Column */}
                    <div className='hidden md:block w-[280px] lg:w-[320px] shrink-0 h-fit sticky top-4'>
                        <FilterCard />
                    </div>
                    
                    {/* Jobs Content */}
                    <div className='flex-1'>
                        {loading ? (
                            <div className='flex items-center justify-center h-64'>
                                <div className='text-center'>
                                    <div className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent mx-auto'></div>
                                    <p className='mt-2 text-gray-600'>Đang tải dữ liệu...</p>
                                </div>
                            </div>
                        ) : filterJobs.length <= 0 ? (
                            <div className='flex items-center justify-center h-64 bg-white rounded-lg p-8 text-center'>
                                <div>
                                    <div className='mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4'>
                                        <Info className='h-8 w-8 text-gray-400' />
                                    </div>
                                    <h2 className='text-xl font-bold mb-2'>Không tìm thấy công việc phù hợp</h2>
                                    <p className='text-muted-foreground mb-6'>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn để tìm thấy các cơ hội việc làm.</p>
                                    <Button 
                                        variant="outline"
                                        className="border-accent text-accent hover:bg-accent/10"
                                        onClick={() => {
                                            dispatch(setSearchedQuery(''));
                                            getAllJobs();
                                        }}
                                    >
                                        Xóa bộ lọc
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className='pb-10'>
                                <AnimatePresence>
                                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                        {filterJobs.map((job) => (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ duration: 0.3 }}
                                                key={job?._id}
                                                layout
                                            >
                                                <Job job={job} />
                                            </motion.div>
                                        ))}
                                    </div>
                                </AnimatePresence>
                                
                                {/* Show more results button */}
                                {filterJobs.length > 0 && filterJobs.length % 9 === 0 && (
                                    <div className="text-center mt-8">
                                        <Button 
                                            variant="outline" 
                                            className="border-accent text-accent hover:bg-accent/10"
                                        >
                                            Xem thêm việc làm
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Jobs