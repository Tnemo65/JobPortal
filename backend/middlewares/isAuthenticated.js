import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
    try {
        let token;
        
        // Detailed logging for debugging
        console.log(`Auth - Request path: ${req.originalUrl || req.url}`);
        console.log(`Auth - Has cookies:`, !!req.cookies);
        console.log(`Auth - Cookie names:`, req.cookies ? Object.keys(req.cookies) : 'none');
        
        // Get token from HTTP-only cookies 
        if (req.cookies && req.cookies.access_token) {
            token = req.cookies.access_token;
            console.log('Auth - Using access_token cookie');
        }
        
        // Check if token exists
        if (!token) {
            console.log('Auth - No token found in HTTP-only cookies');
            return res.status(401).json({
                message: "Please log in to continue",
                success: false,
                code: "NO_TOKEN"
            });
        }
        
        try {
            // Verify token
            const decoded = await jwt.verify(token, process.env.SECRET_KEY);
            
            // Add detailed logging
            console.log(`Auth - Token verified for user ID: ${decoded.userId}`);
            
            if (!decoded || !decoded.userId) {
                return res.status(401).json({
                    message: "Invalid token",
                    success: false,
                    code: "INVALID_TOKEN"
                });
            }
            
            // Add userId to request for next middlewares/controllers
            req.id = decoded.userId;
            next();
        } catch (jwtError) {
            console.error('JWT verification error:', jwtError);
            
            // Try to refresh the token automatically
            try {
                if (req.cookies && req.cookies.refresh_token) {
                    console.log('Auth - Attempting token refresh');
                    // Call token refresh endpoint directly
                    const refreshToken = req.cookies.refresh_token;
                    const refreshed = await refreshUserToken(refreshToken);
                    
                    if (refreshed) {
                        console.log('Auth - Token refreshed successfully');
                        // Set new tokens as cookies
                        setAuthCookies(res, refreshed.accessToken, refreshed.refreshToken);
                        
                        // Add user ID to request
                        req.id = refreshed.userId;
                        return next();
                    }
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
            }
            
            // Handle specific JWT errors after refresh attempt fails
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    message: "Your session has expired. Please log in again",
                    success: false,
                    code: "TOKEN_EXPIRED"
                });
            } else {
                return res.status(401).json({
                    message: "Authentication failed",
                    success: false,
                    code: "AUTH_FAILED"
                });
            }
        }
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(500).json({
            message: "Authentication error. Please try again later",
            success: false,
            code: "SERVER_ERROR"
        });
    }
};

// Helper function to refresh tokens
async function refreshUserToken(refreshToken) {
    try {
        const decoded = await jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET || process.env.SECRET_KEY
        );
        
        if (decoded.userId && decoded.tokenType === 'refresh') {
            // Generate new tokens
            const accessToken = await jwt.sign(
                { userId: decoded.userId }, 
                process.env.SECRET_KEY, 
                { expiresIn: '1h' }
            );
            
            // No need to generate new refresh token if it's still valid
            return {
                accessToken,
                refreshToken, // Keep the same refresh token
                userId: decoded.userId
            };
        }
        return null;
    } catch (error) {
        console.error('Error refreshing token:', error);
        return null;
    }
}

export default isAuthenticated;