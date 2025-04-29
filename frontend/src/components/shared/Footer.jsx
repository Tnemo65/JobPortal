import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Footer top with wave */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="absolute -top-5 left-0 w-full opacity-10">
            <path fill="#48A6A7" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,208C672,213,768,203,864,170.7C960,139,1056,85,1152,64C1248,43,1344,53,1392,58.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="absolute -top-20 left-0 w-full opacity-10">
            <path fill="#9ACBD0" fillOpacity="1" d="M0,160L48,144C96,128,192,96,288,117.3C384,139,480,213,576,208C672,203,768,117,864,106.7C960,96,1056,160,1152,170.7C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Company info */}
            <div className="space-y-4">
              <Link to="/" className="inline-block">
                <h2 className="text-2xl font-bold">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary-foreground">Job</span>
                  <span className="text-accent">Portal</span>
                </h2>
              </Link>
              <p className="text-primary-foreground/80 max-w-xs">
                Kết nối nhà tuyển dụng với nhân tài. Nền tảng tìm kiếm việc làm hàng đầu cho sinh viên và người tìm việc.
              </p>
              <div className="flex space-x-4 mt-4">
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-full bg-accent/20 hover:bg-accent flex items-center justify-center transition-all duration-300 group"
                  aria-label="Facebook"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-primary-foreground group-hover:text-primary-foreground">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-full bg-accent/20 hover:bg-accent flex items-center justify-center transition-all duration-300 group"
                  aria-label="Twitter"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-primary-foreground group-hover:text-primary-foreground">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-full bg-accent/20 hover:bg-accent flex items-center justify-center transition-all duration-300 group"
                  aria-label="LinkedIn"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-primary-foreground group-hover:text-primary-foreground">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-full bg-accent/20 hover:bg-accent flex items-center justify-center transition-all duration-300 group"
                  aria-label="Instagram"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-primary-foreground group-hover:text-primary-foreground">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4 border-b border-accent/30 pb-2">Khám phá</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/" className="text-primary-foreground/80 hover:text-accent transition-colors duration-200 inline-block">
                    Trang chủ
                  </Link>
                </li>
                <li>
                  <Link to="/jobs" className="text-primary-foreground/80 hover:text-accent transition-colors duration-200 inline-block">
                    Tìm việc làm
                  </Link>
                </li>
                <li>
                  <Link to="/browse" className="text-primary-foreground/80 hover:text-accent transition-colors duration-200 inline-block">
                    Duyệt theo danh mục
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-primary-foreground/80 hover:text-accent transition-colors duration-200 inline-block">
                    Đăng nhập
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="text-primary-foreground/80 hover:text-accent transition-colors duration-200 inline-block">
                    Đăng ký
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Employers */}
            <div>
              <h3 className="text-lg font-semibold mb-4 border-b border-accent/30 pb-2">Nhà tuyển dụng</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/admin/companies" className="text-primary-foreground/80 hover:text-accent transition-colors duration-200 inline-block">
                    Đăng tin tuyển dụng
                  </Link>
                </li>
                <li>
                  <Link to="/admin/jobs" className="text-primary-foreground/80 hover:text-accent transition-colors duration-200 inline-block">
                    Quản lý tin tuyển dụng
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-primary-foreground/80 hover:text-accent transition-colors duration-200 inline-block">
                    Giải pháp tuyển dụng
                  </a>
                </li>
                <li>
                  <a href="#" className="text-primary-foreground/80 hover:text-accent transition-colors duration-200 inline-block">
                    Báo giá dịch vụ
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4 border-b border-accent/30 pb-2">Liên hệ</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-primary-foreground/80">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-accent">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>123 Đường ABC, Quận XYZ, TP. HCM</span>
                </li>
                <li className="flex items-center gap-2 text-primary-foreground/80">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-accent">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <span>0901 234 567</span>
                </li>
                <li className="flex items-center gap-2 text-primary-foreground/80">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-accent">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <span>contact@jobportal.com</span>
                </li>
                <li className="flex items-center gap-2 text-primary-foreground/80">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-accent">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>Thứ 2 - Thứ 6: 8:00 - 17:00</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer bottom */}
      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-primary-foreground/70">
              © {currentYear} JobPortal. Tất cả các quyền được bảo lưu.
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors duration-200">
                Điều khoản sử dụng
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors duration-200">
                Chính sách bảo mật
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors duration-200">
                Trợ giúp
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;