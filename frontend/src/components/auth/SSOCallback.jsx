import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setUser } from '../../redux/authSlice';
import { USER_API_END_POINT, GOOGLE_AUTH_CALLBACK_URL } from '../../utils/constant';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

const SSOCallback = () => {
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const handleRetry = () => {
    // Redirect to the Google OAuth login page
    window.location.href = `${USER_API_END_POINT}/auth/google?t=${Date.now()}`;
  };

  const processCallback = async () => {
    try {
      // Extract code and error from URL if present
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const urlError = params.get('error');
      const success = params.get('success') === 'true';
      const token = params.get('token');
      
      // Store token if provided directly in URL (from backend redirect)
      if (token) {
        localStorage.setItem('token', token);
      }
      
      // Handle explicit error in URL
      if (urlError) {
        console.error('Error from OAuth redirect:', urlError);
        setError(decodeURIComponent(urlError));
        setStatus('error');
        return;
      }
      
      // Handle success flag from redirect
      if (success === false) {
        setError('Authentication failed. The server reported an error.');
        setStatus('error');
        return;
      }
      
      // If no code, try to use token or check session
      if (!code) {
        try {
          // If we have a token in URL or localStorage, try to get user profile
          const savedToken = localStorage.getItem('token');
          
          if (token || savedToken) {
            // Try to get user profile with token
            const response = await axios.get(`${USER_API_END_POINT}/sso/profile`, { 
              withCredentials: true,
              headers: {
                'Authorization': `Bearer ${token || savedToken}`,
              },
              timeout: 8000 // 8 second timeout
            });
            
            if (response.data.success && response.data.user) {
              dispatch(setUser(response.data.user));
              toast.success(`Welcome back, ${response.data.user.fullname}`);
              
              // Redirect based on user role
              if (response.data.user.role === 'recruiter') {
                navigate('/admin/companies');
              } else {
                navigate('/');
              }
              return;
            }
          } else {
            // As fallback, check if we already have a session
            const response = await axios.get(`${USER_API_END_POINT}/me`, { 
              withCredentials: true,
              timeout: 5000 // 5 second timeout
            });
            
            if (response.data.success && response.data.user) {
              dispatch(setUser(response.data.user));
              toast.success(`Welcome back, ${response.data.user.fullname}`);
              
              // Redirect based on user role
              if (response.data.user.role === 'recruiter') {
                navigate('/admin/companies');
              } else {
                navigate('/');
              }
              return;
            }
          }
          
          // If we get here, we couldn't authenticate
          setError('No authorization code provided. The OAuth flow was not completed.');
          setErrorDetails('This could happen if the authentication was cancelled or if there was an error with the OAuth provider.');
          setStatus('error');
          return;
        } catch (profileError) {
          console.error('Error fetching profile:', profileError);
          setError('Failed to validate authentication');
          setErrorDetails(profileError.message);
          setStatus('error');
          return;
        }
      }

      // Exchange the code for tokens
      try {
        const response = await axios.get(`${GOOGLE_AUTH_CALLBACK_URL}?code=${encodeURIComponent(code)}`, {
          withCredentials: true,
          timeout: 10000 // 10 second timeout
        });

        if (response.data.success) {
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
          }
          
          dispatch(setUser(response.data.user));
          setStatus('success');
          
          // Show success message
          toast.success(`Welcome, ${response.data.user.fullname}`);
          
          // Redirect based on user role
          setTimeout(() => {
            if (response.data.user.role === 'recruiter') {
              navigate('/admin/companies');
            } else {
              navigate('/');
            }
          }, 500);
        } else {
          setError(response.data.message || 'Authentication failed');
          setErrorDetails('The server returned a failure response.');
          setStatus('error');
        }
      } catch (error) {
        console.error('OAuth code exchange error:', error);
        
        let errorMessage = 'Authentication process failed';
        let details = null;
        
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          errorMessage = error.response.data?.message || 'Server responded with an error';
          details = `Status: ${error.response.status}`;
          if (error.response.data?.details) {
            details += ` - ${error.response.data.details}`;
          }
        } else if (error.request) {
          // The request was made but no response was received
          errorMessage = 'No response from authentication server';
          details = 'This could be due to network issues or the server might be down.';
        } else {
          // Something happened in setting up the request that triggered an Error
          errorMessage = error.message || 'Failed to complete authentication';
        }
        
        setError(errorMessage);
        setErrorDetails(details);
        setStatus('error');
        
        // Show error toast
        toast.error('Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected SSOCallback error:', error);
      setError('An unexpected error occurred during authentication');
      setErrorDetails(error.message);
      setStatus('error');
      
      toast.error('Something went wrong. Please try again.');
    }
  };

  useEffect(() => {
    processCallback();
  }, [dispatch, location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <h1 className="text-xl font-semibold mb-2">Signing you in...</h1>
            <p className="text-gray-500">Please wait while we complete the authentication process.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="bg-green-100 p-2 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold mb-2">Authentication Successful!</h1>
            <p className="text-gray-500">Redirecting you to the dashboard...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="bg-red-100 p-2 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold mb-2">Authentication Failed</h1>
            <p className="text-gray-500 mb-2">{error}</p>
            {errorDetails && (
              <p className="text-xs text-gray-400 mb-4">{errorDetails}</p>
            )}
            
            <div className="flex flex-col gap-2 mt-4">
              <Button onClick={handleRetry} className="bg-primary hover:bg-primary/90">
                Try Again with Google
              </Button>
              <Button variant="outline" onClick={() => navigate('/login')} className="mt-2">
                Return to Login
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SSOCallback;