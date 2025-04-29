import multer from "multer";

const storage = multer.memoryStorage();

// Cấu hình để xử lý một trường tùy chọn (có thể là "file" hoặc nhiều trường khác)
export const singleUpload = multer({storage}).single("file");

// Thêm các cấu hình cho các trường cụ thể khác
export const resumeUpload = multer({storage}).single("resume");
export const profilePhotoUpload = multer({storage}).single("profilePhoto");

// Cấu hình để xử lý nhiều trường cùng lúc nếu cần
export const multiFieldUpload = multer({storage}).fields([
    { name: 'file', maxCount: 1 },
    { name: 'resume', maxCount: 1 },
    { name: 'profilePhoto', maxCount: 1 }
]);