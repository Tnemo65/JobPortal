import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Search, Briefcase, Star, TrendingUp, ChevronRight, ChevronDown } from 'lucide-react'
import { useDispatch } from 'react-redux';
import { setSearchedQuery } from '@/redux/jobSlice';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const HeroSection = () => {
    const [query, setQuery] = useState("");
    const [jobCount, setJobCount] = useState(0);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        // Animate job count on load
        const interval = setInterval(() => {
            setJobCount(prev => {
                if (prev < 1200) {
                    return prev + 17;
                }
                clearInterval(interval);
                return 1200;
            });
        }, 30);

        return () => clearInterval(interval);
    }, []);

    const searchJobHandler = () => {
        dispatch(setSearchedQuery(query));
        navigate("/browse");
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            searchJobHandler();
        }
    };

    const scrollToLatestJobs = () => {
        const latestJobsSection = document.getElementById('latest-jobs');
        if (latestJobsSection) {
            latestJobsSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Animation variants
    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    // Bouncing animation for the scroll down button
    const bouncingAnimation = {
        y: [0, -10, 0],
        transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
        }
    };

    return (
        <div className="relative overflow-hidden bg-gradient-to-b from-secondary/40 to-background/40 pt-16 pb-24">
            {/* Decorative shapes */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <svg className="absolute -top-24 -left-40 text-primary opacity-[0.03] w-[600px] h-[600px]" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <path fill="currentColor" d="M46.5,-46.1C62.2,-33.4,78.4,-16.7,79.8,1.4C81.2,19.5,67.8,38.9,52.1,55.8C36.4,72.6,18.2,87,-1.6,88.6C-21.4,90.2,-42.8,79,-58.4,62.2C-74,45.4,-83.7,22.7,-82.2,1.5C-80.6,-19.7,-67.9,-39.3,-52.3,-52C-36.7,-64.8,-18.3,-70.6,-0.8,-69.8C16.8,-69,30.9,-58.7,46.5,-46.1Z" transform="translate(100 100)" />
                </svg>
                <svg className="absolute top-1/3 -right-40 text-accent opacity-[0.03] w-[600px] h-[600px]" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <path fill="currentColor" d="M50.6,-58.8C63.3,-45.9,69.7,-27.6,70.8,-9.7C72,8.2,68.1,25.7,58.5,39.8C48.9,53.9,33.6,64.7,15.8,70.7C-1.9,76.6,-22.2,77.8,-38.8,70C-55.5,62.2,-68.5,45.5,-74.2,26.6C-79.8,7.7,-78,-13.4,-69.3,-30.7C-60.6,-48.1,-45,-61.6,-28.6,-69.3C-12.2,-77,-6.1,-78.9,6.8,-86.9C19.7,-94.8,37.9,-71.7,50.6,-58.8Z" transform="translate(100 100)" />
                </svg>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center max-w-4xl mx-auto">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.2
                                }
                            }
                        }}
                        className="flex flex-col gap-6"
                    >
                        <motion.div variants={fadeInUp} className="flex justify-center">
                            <span className="px-4 py-2 rounded-full bg-accent/20 text-accent font-medium inline-flex items-center gap-2">
                                <Star className="h-4 w-4" fill="currentColor" />
                                <span>Nền tảng tìm việc #1 Việt Nam</span>
                            </span>
                        </motion.div>

                        <motion.h1 variants={fadeInUp} className="text-4xl md:text-6xl font-bold leading-tight">
                            Tìm kiếm, ứng tuyển & <br /> 
                            <span className="relative">
                                <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                                    Công việc mơ ước
                                </span>
                                <span className="absolute bottom-0 left-0 w-full h-3 bg-secondary/30 -z-10"></span>
                            </span>
                        </motion.h1>

                        <motion.p variants={fadeInUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Khám phá hơn {jobCount.toLocaleString()}+ cơ hội việc làm hấp dẫn từ các công ty hàng đầu. Nền tảng kết nối tài năng với nhà tuyển dụng hiệu quả nhất.
                        </motion.p>

                        <motion.div variants={fadeInUp} className="mt-6">
                            <div className="relative flex shadow-xl border border-secondary/50 pl-4 rounded-full items-center gap-4 mx-auto max-w-xl bg-background">
                                <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm công việc mơ ước của bạn..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="py-4 outline-none border-none w-full bg-transparent text-foreground"
                                />
                                <Button 
                                    onClick={searchJobHandler} 
                                    className="rounded-full px-6 py-6 bg-accent hover:bg-accent/90 text-white shadow-lg transition-all"
                                >
                                    <span className="hidden md:inline mr-2">Tìm kiếm</span>
                                    <Search className="h-5 w-5" />
                                </Button>
                            </div>
                        </motion.div>

                        <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4 pt-6 text-center">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Briefcase className="h-4 w-4" />
                                <span>1200+ Công việc mới</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Star className="h-4 w-4" />
                                <span>Công ty hàng đầu</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <TrendingUp className="h-4 w-4" />
                                <span>Mức lương cạnh tranh</span>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Stats & Categories */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        className="mt-16 flex flex-wrap justify-center gap-6 md:gap-12"
                    >
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-secondary/20 transition-transform hover:-translate-y-1">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                                <Briefcase className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-1">1200+</h3>
                            <p className="text-sm text-muted-foreground">Công việc mới mỗi tháng</p>
                        </div>
                        
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-secondary/20 transition-transform hover:-translate-y-1">
                            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4 mx-auto">
                                <Star className="h-6 w-6 text-accent" />
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-1">700+</h3>
                            <p className="text-sm text-muted-foreground">Công ty hàng đầu</p>
                        </div>
                        
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-secondary/20 transition-transform hover:-translate-y-1">
                            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mb-4 mx-auto">
                                <TrendingUp className="h-6 w-6 text-secondary" />
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-1">20K+</h3>
                            <p className="text-sm text-muted-foreground">Ứng viên thành công</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2, duration: 0.8 }}
                        className="mt-8"
                    >
                        <Button 
                            variant="outline" 
                            onClick={() => navigate('/jobs')}
                            className="group border-accent text-accent hover:bg-accent/10 rounded-full px-6 inline-flex items-center gap-1 transition-all"
                        >
                            Khám phá tất cả công việc
                            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </motion.div>
                </div>
            </div>

            {/* Scroll Down Button */}
            <motion.div 
                className="absolute bottom-12 left-0 right-0 flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
            >
                <motion.button
                    animate={bouncingAnimation}
                    onClick={scrollToLatestJobs}
                    className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl border border-secondary/20 group transition-all duration-300 hover:bg-accent/10"
                    aria-label="Cuộn xuống phần việc làm mới nhất"
                >
                    <ChevronDown className="h-6 w-6 text-primary group-hover:text-accent" />
                </motion.button>
            </motion.div>

            {/* Wave divider */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto">
                    <path fill="#F2EFE7" fillOpacity="1" d="M0,256L60,250.7C120,245,240,235,360,224C480,213,600,203,720,208C840,213,960,235,1080,229.3C1200,224,1320,192,1380,176L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
                </svg>
            </div>
        </div>
    );
}

export default HeroSection;