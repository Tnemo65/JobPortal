/**
 * Environment configuration helper for GKE deployment
 */

export const setupGKEEnvironment = () => {
  // Check if running in Kubernetes
  if (process.env.KUBERNETES_SERVICE_HOST) {
    console.log("Detected Kubernetes environment - setting production variables");
    
    // Force production mode
    process.env.NODE_ENV = 'production';
    
    // Set default URLs if not provided
    if (!process.env.FRONTEND_URL) {
      process.env.FRONTEND_URL = 'http://35.234.9.125';
      console.log(`Set default FRONTEND_URL: ${process.env.FRONTEND_URL}`);
    }
    
    if (!process.env.BACKEND_URL) {
      process.env.BACKEND_URL = 'http://34.81.121.101';
      console.log(`Set default BACKEND_URL: ${process.env.BACKEND_URL}`);
    }
    
    // Force secure cookies off if using HTTP in GKE
    if (process.env.DISABLE_SECURE_COOKIES === 'true' || 
        (!process.env.FRONTEND_URL?.startsWith('https') && 
         !process.env.BACKEND_URL?.startsWith('https'))) {
      process.env.SECURE_COOKIES = 'false';
      console.log("Secure cookies disabled for HTTP connections in GKE");
    } else {
      process.env.SECURE_COOKIES = 'true';
    }
    
    console.log("GKE environment variables configured successfully");
  }
};

// Export a function to check if cookies should be secure
export const shouldUseCookiesSecure = () => {
  // In GKE with HTTP, we disable secure cookies
  if (process.env.SECURE_COOKIES === 'false') {
    return false;
  }
  
  // Otherwise use secure in production
  return process.env.NODE_ENV === 'production';
};
