import { apiCache } from '../utils/api-cache.js';

/**
 * Middleware để xóa cache cho các nhóm cụ thể sau khi thực hiện thay đổi dữ liệu
 * @param {string[]} groups - Các nhóm cache cần xóa (jobs, companies, applications, user)
 * @returns {Function} Express middleware function
 */
export const clearCacheGroups = (groups = []) => {
    return (req, res, next) => {
        // Giữ lại phương thức nguyên bản của res.json
        const originalJson = res.json;

        // Override phương thức json để xóa cache sau khi phản hồi thành công
        res.json = function(data) {
            // Chỉ xóa cache nếu hoạt động thành công
            if (data && data.success === true) {
                for (const group of groups) {
                    switch (group) {
                        case 'jobs':
                            // Xóa tất cả cache liên quan đến công việc
                            apiCache.clear('/api/v1/job/get');
                            apiCache.clear('/api/v1/job/getadminjobs');
                            break;

                        case 'companies':
                            // Xóa tất cả cache liên quan đến công ty
                            apiCache.clear('/api/v1/company/get');
                            break;

                        case 'applications':
                            // Xóa tất cả cache liên quan đến ứng tuyển
                            apiCache.clear('/api/v1/application/get');
                            apiCache.clear('/api/v1/application/applicants');
                            break;

                        case 'user':
                            // Xóa tất cả cache liên quan đến người dùng cụ thể
                            if (req.id) {
                                apiCache.clear(`user_${req.id}`);
                            }
                            break;

                        case 'saved_jobs':
                            // Xóa cache công việc đã lưu
                            apiCache.clear('/api/v1/user/jobs/saved');
                            break;

                        case 'notifications':
                            // Xóa cache thông báo
                            apiCache.clear('/api/v1/user/notifications');
                            break;

                        default:
                            // Không làm gì
                            break;
                    }
                }
            }

            // Gọi phương thức nguyên bản
            return originalJson.call(this, data);
        };

        next();
    };
};

export default clearCacheGroups;