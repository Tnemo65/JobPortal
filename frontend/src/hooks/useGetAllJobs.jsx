import { useState, useEffect, useCallback, useRef } from 'react'
import { JOB_API_END_POINT } from '@/utils/constant'
import { toast } from 'sonner'
import { useSelector, useDispatch } from 'react-redux';
import { setAllJobs } from '@/redux/jobSlice';
import api from '@/utils/api';

const useGetAllJobs = () => {
    const [loading, setLoading] = useState(false);
    const [jobs, setJobs] = useState([]);
    const { user } = useSelector(store => store.auth);
    const dispatch = useDispatch();
    const abortControllerRef = useRef(null);
    const lastFetchTimeRef = useRef(0);
    const isFirstLoadRef = useRef(true);
    const allJobsCache = useRef([]);
    
    // Prevent too frequent API calls
    const MIN_FETCH_INTERVAL = 500;

    // Hàm tìm kiếm và lọc công việc ở frontend
    const filterJobsLocally = (allJobs, filters = {}) => {
        if (!allJobs || allJobs.length === 0) return [];
        
        const { 
            keyword,
            location, 
            jobType, 
            experienceLevel,
            skills,
            salaryRange
        } = filters;
        
        // Bắt đầu với tất cả công việc
        return allJobs.filter(job => {
            // Lọc theo từ khóa
            if (keyword && keyword.trim().length > 0) {
                const keywordLower = keyword.toLowerCase();
                const matchesKeyword = 
                    (job.title && job.title.toLowerCase().includes(keywordLower)) ||
                    (job.description && job.description.toLowerCase().includes(keywordLower)) ||
                    (job.company && job.company.name && job.company.name.toLowerCase().includes(keywordLower));
                
                if (!matchesKeyword) return false;
            }
            
            // Lọc theo vị trí - OR logic trong cùng danh mục (chỉ cần khớp một địa điểm trong danh sách đã chọn)
            if (location && Array.isArray(location) && location.length > 0) {
                // Thay đổi logic thành OR - chỉ cần khớp với ít nhất một vị trí đã chọn
                const jobLocationLower = job.location ? job.location.toLowerCase() : '';
                const matchesAnyLocation = location.some(loc => 
                    jobLocationLower.includes(loc.toLowerCase())
                );
                if (!matchesAnyLocation) return false;
            }
            
            // Lọc theo loại công việc - OR logic trong cùng danh mục
            if (jobType && Array.isArray(jobType) && jobType.length > 0) {
                // Thay đổi logic thành OR - chỉ cần khớp với ít nhất một loại đã chọn
                const jobTypeLower = job.jobType ? job.jobType.toLowerCase() : '';
                const matchesAnyType = jobType.some(type => 
                    jobTypeLower === type.toLowerCase()
                );
                if (!matchesAnyType) return false;
            }
            
            // Lọc theo mức kinh nghiệm - OR logic trong cùng danh mục
            if (experienceLevel && Array.isArray(experienceLevel) && experienceLevel.length > 0) {
                // Thay đổi logic thành OR - chỉ cần khớp với ít nhất một mức kinh nghiệm đã chọn
                const jobExpLower = job.experienceLevel ? job.experienceLevel.toLowerCase() : '';
                const matchesAnyExp = experienceLevel.some(exp => 
                    jobExpLower === exp.toLowerCase()
                );
                if (!matchesAnyExp) return false;
            }
            
            // Lọc theo kỹ năng - OR logic trong cùng danh mục
            if (skills && Array.isArray(skills) && skills.length > 0) {
                // Chuyển đổi skills từ job thành mảng nếu có
                let jobSkillsArray = [];
                if (typeof job.skills === 'string') {
                    jobSkillsArray = job.skills.toLowerCase().split(',').map(s => s.trim());
                } else if (Array.isArray(job.skills)) {
                    jobSkillsArray = job.skills.map(s => s.toLowerCase());
                }
                
                // Kiểm tra xem job có chứa bất kỳ kỹ năng nào đã chọn không
                const matchesAnySkill = skills.some(skill => 
                    jobSkillsArray.includes(skill.toLowerCase())
                );
                
                if (!matchesAnySkill) return false;
            }
            
            // Lọc theo mức lương
            if (salaryRange && Array.isArray(salaryRange) && salaryRange.length > 0) {
                if (!job.salary) return false;
                
                // Tìm xem lương có nằm trong bất kỳ khoảng nào đã chọn không - OR logic
                const salary = Number(job.salary);
                const inAnySalaryRange = salaryRange.some(range => {
                    if (range && range.includes('-')) {
                        const [min, max] = range.split('-').map(Number);
                        return salary >= min && salary <= max;
                    }
                    return false;
                });
                
                if (!inAnySalaryRange) return false;
            }
            
            // Nếu vượt qua tất cả các điều kiện lọc
            return true;
        });
    };

    const getAllJobs = useCallback(async (filters = {}) => {
        try {
            // Cancel any previous ongoing request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            
            // Create new abort controller for this request
            abortControllerRef.current = new AbortController();
            
            // Throttle requests
            const now = Date.now();
            if (now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL) {
                console.log("Fetching jobs too frequently, throttling");
                await new Promise(resolve => setTimeout(resolve, MIN_FETCH_INTERVAL));
            }
            
            setLoading(true);
            lastFetchTimeRef.current = Date.now();

            // Kiểm tra xem có bất kỳ bộ lọc nào không
            const hasFilters = Object.keys(filters).some(key => {
                const value = filters[key];
                if (Array.isArray(value)) {
                    return value.length > 0;
                }
                return !!value;
            });

            // Nếu không có bộ lọc, hoặc chỉ có từ khóa tìm kiếm, lấy dữ liệu từ API
            if (!hasFilters || (Object.keys(filters).length === 1 && filters.keyword)) {
                // Extract keyword for API search
                const { keyword } = filters;

                let queryParams = new URLSearchParams();
                if (keyword) queryParams.append('keyword', keyword);

                // Get jobs from API
                const res = await api.get(`${JOB_API_END_POINT}/get?${queryParams.toString()}`, {
                    signal: abortControllerRef.current.signal
                });
                
                if (res.data.success) {
                    const fetchedJobs = res.data.jobs;
                    allJobsCache.current = fetchedJobs; // Lưu cache để sử dụng cho lọc ở phía frontend
                    setJobs(fetchedJobs);
                    dispatch(setAllJobs(fetchedJobs));
                }
            } else {
                // Nếu có bộ lọc phức tạp, áp dụng lọc phía client trên dữ liệu đã cache
                // Lấy dữ liệu mới từ API nếu cache rỗng
                if (allJobsCache.current.length === 0) {
                    const res = await api.get(`${JOB_API_END_POINT}/get`, {
                        signal: abortControllerRef.current.signal
                    });
                    
                    if (res.data.success) {
                        allJobsCache.current = res.data.jobs;
                    }
                }
                
                // Áp dụng lọc trên dữ liệu cache
                const filteredJobs = filterJobsLocally(allJobsCache.current, filters);
                setJobs(filteredJobs);
                dispatch(setAllJobs(filteredJobs));
            }
        } catch (error) {
            // Ignore abort errors as they are expected
            if (error.name === 'AbortError' || error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
                console.log('Request was aborted');
                return;
            }
            
            // Không hiển thị lỗi cho lần load đầu tiên nếu đang chuyển trang
            if (!isFirstLoadRef.current) {
                console.error("Failed to fetch jobs:", error);
                toast.error(error.response?.data?.message || "Không thể tải danh sách việc làm");
            }
        } finally {
            isFirstLoadRef.current = false;
            setLoading(false);
        }
    }, [dispatch]);

    useEffect(() => {
        // Fetch jobs on initial load
        getAllJobs();
        
        // Cleanup function to abort any pending request when unmounting
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [getAllJobs]);

    return {
        loading,
        jobs,
        getAllJobs
    };
}

export default useGetAllJobs;