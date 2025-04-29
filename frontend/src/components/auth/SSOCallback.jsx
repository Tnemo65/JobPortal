import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { USER_API_END_POINT } from '@/utils/constant';
import { setUser } from '@/redux/authSlice';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const SSOCallback = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                if (success === 'true') {
                    // Fetch user profile using the cookie that was set during SSO authentication
                    const res = await axios.get(`${USER_API_END_POINT}/sso/profile`, { withCredentials: true });
                    if (res.data.success) {
                        dispatch(setUser(res.data.user));
                        toast.success(`Welcome back ${res.data.user.fullname}`);
                        
                        // Redirect based on user role
                        if (res.data.user.role === 'recruiter') {
                            navigate('/admin/companies');
                        } else {
                            navigate('/');
                        }
                    }
                } else {
                    // Handle authentication error
                    toast.error(error || 'Authentication failed');
                    navigate('/login');
                }
            } catch (err) {
                console.error('SSO callback error:', err);
                toast.error('Failed to complete authentication');
                navigate('/login');
            }
        };

        fetchUserProfile();
    }, [success, error, dispatch, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h2 className="mt-4 text-xl font-medium">Completing authentication...</h2>
            <p className="mt-2 text-sm text-muted-foreground">Please wait while we log you in.</p>
        </div>
    );
};

export default SSOCallback;