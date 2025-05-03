import React, { useEffect, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'
import { Avatar, AvatarImage } from '../ui/avatar'
import { LogOut, User2, Bell, Search, Menu, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { USER_API_END_POINT } from '@/utils/constant'
import { setUser } from '@/redux/authSlice'
import { toast } from 'sonner'
import api from '@/utils/api'

const Navbar = () => {
    const { user } = useSelector(store => store.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [showNoti, setShowNoti] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user) return;
            try {
                const res = await api.get(`/user/notifications`);
                if (res.data.success) setNotifications(res.data.notifications);
            } catch (err) {
                // silent
            }
        };
        fetchNotifications();
    }, [user]);

    useEffect(() => {
        if (!showNoti || !user) return;
        const unread = notifications.filter(n => !n.read);
        if (unread.length > 0) {
            // Gọi API đánh dấu tất cả là đã đọc
            const markAllRead = async () => {
                try {
                    await api.post(`/user/notifications/read-all`);
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                } catch {}
            };
            markAllRead();
        }
    }, [showNoti, user]);

    const handleNotificationClick = async (noti) => {
        if (!noti.read) {
            // Gọi API đánh dấu đã đọc
            try {
                await api.post(`/user/notifications/${noti._id}/read`);
                setNotifications(prev => prev.map(n => n._id === noti._id ? { ...n, read: true } : n));
            } catch {}
        }
        if (user && user.role === 'recruiter' && noti.meta && noti.meta.jobId) {
            navigate(`/admin/jobs/${noti.meta.jobId}/applicants`);
            setShowNoti(false);
        }
    };

    const logoutHandler = async () => {
        try {
            // Sử dụng API client
            const res = await api.get(`/user/logout`);
            
            if (res.data.success) {
                dispatch(setUser(null));
                navigate("/");
                toast.success(res.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || "Logout failed");
        }
    }
    
    return (
        <div className={`${scrolled ? 'py-2 bg-primary/95 backdrop-blur-sm shadow-lg' : 'py-4 bg-primary'} border-b border-border sticky top-0 z-50 transition-all duration-300`}>
            <div className="flex items-center justify-between mx-auto max-w-7xl px-4 md:px-6">
                <div className="flex items-center gap-2">
                    <Link to="/">
                        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-primary-foreground drop-shadow-sm transition-transform duration-200 hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(72,166,167,0.6)]">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary-foreground">Job</span>
                            <span className="text-accent transition-colors duration-300">Portal</span>
                        </h1>
                    </Link>
                </div>
                
                {/* Mobile menu button */}
                <div className="md:hidden">
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)} 
                        className="p-2 text-primary-foreground hover:bg-accent/20 rounded-full transition-all"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
                
                {/* Desktop navigation */}
                <div className="hidden md:flex items-center gap-10">
                    <ul className="flex font-medium items-center gap-6">
                        {
                            user && user.role === 'recruiter' ? (
                                <>
                                    <li>
                                        <Link to="/admin/companies" className="relative group transition-colors duration-200 text-primary-foreground hover:text-accent">
                                            Companies
                                            <span className="absolute bottom-0 left-0 w-full h-0.5 rounded-full bg-gradient-to-r from-accent to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/admin/jobs" className="relative group transition-colors duration-200 text-primary-foreground hover:text-accent">
                                            Jobs
                                            <span className="absolute bottom-0 left-0 w-full h-0.5 rounded-full bg-gradient-to-r from-accent to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                                        </Link>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li>
                                        <Link to="/" className="relative group transition-colors duration-200 text-primary-foreground hover:text-accent">
                                            Home
                                            <span className="absolute bottom-0 left-0 w-full h-0.5 rounded-full bg-gradient-to-r from-accent to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/jobs" className="relative group transition-colors duration-200 text-primary-foreground hover:text-accent">
                                            Jobs
                                            <span className="absolute bottom-0 left-0 w-full h-0.5 rounded-full bg-gradient-to-r from-accent to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/browse" className="relative group transition-colors duration-200 text-primary-foreground hover:text-accent">
                                            Browse
                                            <span className="absolute bottom-0 left-0 w-full h-0.5 rounded-full bg-gradient-to-r from-accent to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                                        </Link>
                                    </li>
                                    {user && (
                                    <li>
                                        <Link to="/saved-jobs" className="relative group transition-colors duration-200 text-primary-foreground hover:text-accent">
                                            Saved Jobs
                                            <span className="absolute bottom-0 left-0 w-full h-0.5 rounded-full bg-gradient-to-r from-accent to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                                        </Link>
                                    </li>
                                    )}
                                </>
                            )
                        }
                    </ul>
                    {user && (
                        <div className="relative">
                            <button 
                                onClick={() => setShowNoti(!showNoti)} 
                                className="group relative p-2 rounded-full transition-all hover:bg-accent/10 hover:shadow-lg hover:scale-110 duration-200 focus:outline-none"
                            >
                                <Bell 
                                    size={22} 
                                    className="text-primary-foreground group-hover:text-accent transition-colors duration-200" 
                                />
                                {notifications.filter(n => !n.read).length > 0 && showNoti === false && (
                                    <span className="absolute top-0 right-0 bg-accent text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-lg">{notifications.filter(n => !n.read).length}</span>
                                )}
                            </button>
                            {showNoti && (
                                <div className="absolute right-0 mt-2 w-80 bg-background shadow-2xl rounded-lg z-50 max-h-96 overflow-y-auto border border-border animate-in fade-in-50 slide-in-from-top-5 duration-300">
                                    <div className="p-3 font-semibold border-b border-border text-primary flex justify-between items-center">
                                        <span>Thông báo</span>
                                        {notifications.filter(n => !n.read).length > 0 && (
                                            <span className="bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full">{notifications.filter(n => !n.read).length} mới</span>
                                        )}
                                    </div>
                                    {notifications.length === 0 ? (
                                        <div className="p-6 text-muted-foreground text-center">
                                            <Bell size={24} className="mx-auto mb-2 opacity-20" />
                                            Không có thông báo nào
                                        </div>
                                    ) : notifications.map((noti, idx) => (
                                        <div 
                                            key={noti._id || idx} 
                                            className={`p-3 border-b last:border-b-0 ${!noti.read ? 'bg-secondary/20' : ''} cursor-pointer hover:bg-secondary/30 transition-all duration-200`} 
                                            onClick={() => handleNotificationClick(noti)}
                                        >
                                            <div className="text-sm text-primary">{noti.message}</div>
                                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                <span>{new Date(noti.createdAt).toLocaleString()}</span>
                                                {!noti.read && <span className="h-2 w-2 rounded-full bg-accent"></span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {
                        !user ? (
                            <div className="flex items-center gap-3">
                                <Link to="/login">
                                    <Button className="rounded-full shadow-md transition-all bg-accent hover:bg-accent/90 text-primary-foreground">
                                        Đăng nhập
                                    </Button>
                                </Link>
                                <Link to="/signup">
                                    <Button className="rounded-full shadow-md transition-all bg-accent hover:bg-accent/90 text-primary-foreground">
                                        Đăng ký
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Avatar className="cursor-pointer border-2 border-accent/30 hover:border-accent shadow-md transition-all duration-200 hover:scale-110">
                                            <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname} />
                                        </Avatar>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80">
                                        <div className="p-2">
                                            <div className="flex gap-3 items-center">
                                                <Avatar className="h-14 w-14 border-2 border-primary">
                                                    <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname} />
                                                </Avatar>
                                                <div>
                                                    <h4 className="font-bold text-primary">{user?.fullname}</h4>
                                                    <p className="text-sm text-muted-foreground line-clamp-2">{user?.profile?.bio || "Không có thông tin"}</p>
                                                </div>
                                            </div>
                                            <div className="border-t border-border mt-3 pt-3">
                                                {
                                                    user && user.role === 'student' && (
                                                        <Link to="/profile">
                                                            <Button 
                                                                variant="outline" 
                                                                className="w-full justify-start gap-2 mb-2 hover:bg-accent/10"
                                                            >
                                                                <User2 size={18} />
                                                                Xem hồ sơ
                                                            </Button>
                                                        </Link>
                                                    )
                                                }
                                                <Button 
                                                    variant="outline" 
                                                    className="w-full justify-start gap-2 border-accent/50 text-accent hover:bg-accent/10"
                                                    onClick={logoutHandler}
                                                >
                                                    <LogOut size={18}/>
                                                    Đăng xuất
                                                </Button>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )
                    }
                </div>
                
                {/* Mobile navigation menu */}
                {isMenuOpen && (
                    <div className="md:hidden fixed inset-0 z-50 bg-primary/95 pt-20">
                        <div className="container mx-auto px-4">
                            <ul className="flex flex-col gap-5 text-center mb-10">
                                {
                                    user && user.role === 'recruiter' ? (
                                        <>
                                            <li onClick={() => setIsMenuOpen(false)}>
                                                <Link to="/admin/companies" className="text-xl font-medium text-primary-foreground hover:text-accent transition-colors block py-2">
                                                    Companies
                                                </Link>
                                            </li>
                                            <li onClick={() => setIsMenuOpen(false)}>
                                                <Link to="/admin/jobs" className="text-xl font-medium text-primary-foreground hover:text-accent transition-colors block py-2">
                                                    Jobs
                                                </Link>
                                            </li>
                                        </>
                                    ) : (
                                        <>
                                            <li onClick={() => setIsMenuOpen(false)}>
                                                <Link to="/" className="text-xl font-medium text-primary-foreground hover:text-accent transition-colors block py-2">
                                                    Home
                                                </Link>
                                            </li>
                                            <li onClick={() => setIsMenuOpen(false)}>
                                                <Link to="/jobs" className="text-xl font-medium text-primary-foreground hover:text-accent transition-colors block py-2">
                                                    Jobs
                                                </Link>
                                            </li>
                                            <li onClick={() => setIsMenuOpen(false)}>
                                                <Link to="/browse" className="text-xl font-medium text-primary-foreground hover:text-accent transition-colors block py-2">
                                                    Browse
                                                </Link>
                                            </li>
                                            {user && (
                                            <li onClick={() => setIsMenuOpen(false)}>
                                                <Link to="/saved-jobs" className="text-xl font-medium text-primary-foreground hover:text-accent transition-colors block py-2">
                                                    Saved Jobs
                                                </Link>
                                            </li>
                                            )}
                                        </>
                                    )
                                }
                            </ul>
                            
                            <div className="flex flex-col gap-4">
                                {!user ? (
                                    <>
                                        <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                                            <Button className="w-full bg-accent hover:bg-accent/90 text-primary-foreground">
                                                Đăng nhập
                                            </Button>
                                        </Link>
                                        <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                                            <Button className="w-full bg-accent hover:bg-accent/90 text-primary-foreground">
                                                Đăng ký
                                            </Button>
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        {user.role === 'student' && (
                                            <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                                                <Button variant="outline" className="w-full justify-center gap-2">
                                                    <User2 size={18} />
                                                    Xem hồ sơ
                                                </Button>
                                            </Link>
                                        )}
                                        <Button 
                                            variant="outline"
                                            className="w-full justify-center gap-2 border-accent text-accent"
                                            onClick={() => {
                                                logoutHandler();
                                                setIsMenuOpen(false);
                                            }}
                                        >
                                            <LogOut size={18}/>
                                            Đăng xuất
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Navbar