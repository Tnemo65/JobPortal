import { Company } from '../models/company.model.js';
import { Job } from '../models/job.model.js';

/**
 * Middleware kiểm tra người dùng có là chủ sở hữu của tài nguyên không
 * @param {string} resourceType Loại tài nguyên ('company' hoặc 'job')
 * @returns {Function} Middleware function
 */
const checkOwnership = (resourceType) => {
    return async (req, res, next) => {
        try {
            const userId = req.id;
            const resourceId = req.params.id;

            if (!resourceId) {
                return res.status(400).json({
                    message: "ID tài nguyên là bắt buộc",
                    success: false,
                    code: "MISSING_RESOURCE_ID"
                });
            }

            let resource;

            switch (resourceType) {
                case 'company':
                    resource = await Company.findById(resourceId);
                    break;
                case 'job':
                    resource = await Job.findById(resourceId);
                    break;
                default:
                    return res.status(400).json({
                        message: "Loại tài nguyên không hợp lệ",
                        success: false,
                        code: "INVALID_RESOURCE_TYPE"
                    });
            }

            if (!resource) {
                return res.status(404).json({
                    message: "Không tìm thấy tài nguyên",
                    success: false,
                    code: "RESOURCE_NOT_FOUND"
                });
            }

            // Kiểm tra quyền sở hữu
            const ownerField = resourceType === 'company' ? 'created_by' : 'created_by';
            const ownerId = resource[ownerField] ? resource[ownerField].toString() : null;

            if (ownerId !== userId) {
                return res.status(403).json({
                    message: "Bạn không có quyền thực hiện hành động này",
                    success: false,
                    code: "NOT_RESOURCE_OWNER"
                });
            }

            // Thêm tài nguyên vào request để sử dụng ở controller
            req.resource = resource;
            next();
        } catch (error) {
            console.error("Check ownership error:", error);
            return res.status(500).json({
                message: "Lỗi xác thực quyền sở hữu. Vui lòng thử lại sau",
                success: false,
                code: "OWNERSHIP_CHECK_ERROR"
            });
        }
    };
};

export default checkOwnership;