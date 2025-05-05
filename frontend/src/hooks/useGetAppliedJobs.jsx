import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { APPLICATION_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import axios from "axios";
import { setAllAppliedJobs } from "@/redux/jobSlice";
import api from "@/utils/api"; // Import API client để xử lý token tốt hơn

const useGetAppliedJobs = () => {
    const { user } = useSelector(store => store.auth);
    const { allAppliedJobs } = useSelector(store => store.job);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const cancelTokenRef = useRef(null);
    const fetchTimeoutRef = useRef(null);
    const lastFetchTimeRef = useRef(0);
    const isFirstLoadRef = useRef(true);
    
    // Prevent fetching too often - set minimum interval between requests
    const MIN_FETCH_INTERVAL = 1000; // Giảm xuống 1 giây

    const onGetJobs = useCallback(async (bypassCache = false) => {
        if (!user) return; // Don't fetch if no user
        if (loading) return; // Don't fetch if already loading
        
        const now = Date.now();
        if (now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL) {
            // Too soon since last fetch, wait a bit
            return;
        }
        
        lastFetchTimeRef.current = now;

        // Clear any scheduled fetch
        if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
        }

        // Schedule the fetch with a slight delay to debounce
        fetchTimeoutRef.current = setTimeout(async () => {
            try {
                setLoading(true);
                
                // Get params
                const params = new URLSearchParams();
                if (bypassCache) {
                    params.append('_', Date.now()); // Add cache busting parameter
                }
                
                // Sử dụng API client tích hợp sẵn xác thực
                const response = await api.get(`/application/get${params.toString() ? `?${params.toString()}` : ''}`, {
                    withCredentials: true,
                    headers: bypassCache ? {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                    } : {}
                });
                
                if (response.data.success) {
                    const appliedJobs = response.data.appliedJobs || [];
                    console.log("Loaded applied jobs:", appliedJobs.length);
                    setJobs(appliedJobs);
                    dispatch(setAllAppliedJobs(appliedJobs));
                }
            } catch (error) {
                console.error("Failed to fetch applied jobs:", error);
                
                // Không hiển thị lỗi cho lần tải đầu tiên nếu đang chuyển trang
                if (!isFirstLoadRef.current) {
                    toast.error(error.response?.data?.message || "Không thể tải danh sách công việc đã ứng tuyển");
                }
            } finally {
                isFirstLoadRef.current = false;
                setLoading(false);
            }
        }, 200); // Giảm debounce time xuống 200ms
    }, [user, loading, dispatch]);

    // Run effect when user changes or component mounts
    useEffect(() => {
        let isMounted = true;
        
        if (user && isMounted) {
            // Call immediately when component mounts
            onGetJobs();
        }
        
        return () => {
            isMounted = false;
            // Clear any pending timeout when unmounting
            if (fetchTimeoutRef.current) {
                clearTimeout(fetchTimeoutRef.current);
            }
        };
    }, [user, onGetJobs]); // Bao gồm onGetJobs trong dependency để đảm bảo hook được gọi khi user thay đổi

    // Function to force refresh data, bypassing cache
    const refreshAppliedJobs = useCallback(() => {
        console.log("Refreshing applied jobs...");
        onGetJobs(true);
    }, [onGetJobs]);

    return { jobs, loading, refreshAppliedJobs };
}

export default useGetAppliedJobs;