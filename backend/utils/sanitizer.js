/**
 * Module cung cấp các tiện ích để sanitize dữ liệu đầu vào
 * Giúp ngăn chặn các cuộc tấn công XSS và SQL Injection
 */

/**
 * Loại bỏ các ký tự nguy hiểm có thể gây XSS từ một chuỗi
 * @param {String} text - Chuỗi cần làm sạch
 * @returns {String} Chuỗi đã được làm sạch
 */
export const sanitizeString = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // Loại bỏ các thẻ HTML và convert HTML entities
    return text
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .replace(/`/g, '&#x60;');
};

/**
 * Loại bỏ các ký tự có thể gây SQL Injection
 * @param {String} text - Chuỗi cần làm sạch
 * @returns {String} Chuỗi đã được làm sạch
 */
export const sanitizeSql = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // Loại bỏ các ký tự liên quan đến SQL Injection
    return text
        .replace(/;/g, '')
        .replace(/'/g, '')
        .replace(/--/g, '')
        .replace(/\/\*/g, '')
        .replace(/\*\//g, '')
        .replace(/xp_/g, '')
        .replace(/UNION/gi, '')
        .replace(/SELECT/gi, '')
        .replace(/DROP/gi, '')
        .replace(/INSERT/gi, '')
        .replace(/UPDATE/gi, '')
        .replace(/DELETE/gi, '')
        .replace(/EXEC/gi, '');
};

/**
 * Làm sạch một đối tượng, áp dụng sanitizeString cho mọi giá trị chuỗi
 * @param {Object} data - Đối tượng cần làm sạch
 * @returns {Object} Đối tượng đã được làm sạch
 */
export const sanitizeObject = (data) => {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = {};
    
    Object.keys(data).forEach(key => {
        if (typeof data[key] === 'string') {
            sanitized[key] = sanitizeString(data[key]);
        } else if (typeof data[key] === 'object' && data[key] !== null) {
            sanitized[key] = sanitizeObject(data[key]);
        } else {
            sanitized[key] = data[key];
        }
    });
    
    return sanitized;
};

/**
 * Middleware để sanitize dữ liệu trong req.body, req.query và req.params
 */
export const sanitizeMiddleware = (req, res, next) => {
    try {
        // Sanitize req.body
        if (req.body) {
            req.body = sanitizeObject(req.body);
        }
        
        // Sanitize req.query
        if (req.query) {
            req.query = sanitizeObject(req.query);
        }
        
        // Sanitize req.params
        if (req.params) {
            req.params = sanitizeObject(req.params);
        }
        
        next();
    } catch (error) {
        console.error('Sanitize error:', error);
        next();
    }
};

export default sanitizeMiddleware;