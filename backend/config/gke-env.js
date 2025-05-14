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
      process.env.FRONTEND_URL = 'https://jobmarket.fun';
      console.log(`Set default FRONTEND_URL: ${process.env.FRONTEND_URL}`);
    }
    
    if (!process.env.BASE_URL) {
      process.env.BASE_URL = 'https://34.81.121.101';
      console.log(`Set default BASE_URL: ${process.env.BASE_URL}`);
    }
    
    // Enable secure cookies for HTTPS in GKE
    if (process.env.DISABLE_SECURE_COOKIES === 'true') {
      process.env.SECURE_COOKIES = 'false';
      console.log("Warning: Secure cookies have been manually disabled");
    } else {
      // Since we're using HTTPS everywhere now
      process.env.SECURE_COOKIES = 'true';
      console.log("Secure cookies enabled for HTTPS connections in GKE");
    }
    
    console.log("GKE environment variables configured successfully");
  }
};

// Export a function to check if cookies should be secure
export const shouldUseCookiesSecure = () => {
  // Only disable secure cookies if explicitly set to false
  if (process.env.SECURE_COOKIES === 'false') {
    return false;
  }
  
  // Always use secure cookies with HTTPS
  return true;
};
