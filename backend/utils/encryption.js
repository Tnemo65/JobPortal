import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

dotenv.config();

// Đảm bảo có SECRET_ENCRYPTION_KEY trong biến môi trường
const SECRET_KEY = process.env.SECRET_ENCRYPTION_KEY || process.env.SECRET_KEY;

/**
 * Mã hóa dữ liệu nhạy cảm
 * @param {String} text - Dữ liệu cần mã hóa
 * @returns {String} Dữ liệu đã mã hóa
 */
export const encryptData = (text) => {
    if (!text) return null;
    try {
        return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
    } catch (error) {
        console.error('Encryption error:', error);
        return null;
    }
};

/**
 * Giải mã dữ liệu nhạy cảm
 * @param {String} encryptedText - Dữ liệu đã mã hóa
 * @returns {String} Dữ liệu đã giải mã
 */
export const decryptData = (encryptedText) => {
    if (!encryptedText) return null;
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
};