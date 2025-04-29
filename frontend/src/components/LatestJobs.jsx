import React from 'react'
import LatestJobCards from './LatestJobCards';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion'; 
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LatestJobs = () => {
    const {allJobs} = useSelector(store=>store.job);
    const navigate = useNavigate();
   
    return (
        <section id="latest-jobs" className="py-20 bg-gradient-to-b from-background to-secondary/10">
            <div className="container px-4 mx-auto">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-10">
                    <div>
                        <div className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                            Vị trí hàng đầu
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-3">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Latest & Top</span>
                            <span> Job Openings</span>
                        </h2>
                        <p className="text-muted-foreground max-w-xl">
                            Khám phá những cơ hội việc làm mới nhất và hàng đầu từ các công ty uy tín. Hãy ứng tuyển ngay hôm nay!
                        </p>
                    </div>
                    
                    <Button 
                        variant="outline" 
                        onClick={() => navigate('/jobs')}
                        className="mt-6 md:mt-0 group border-accent text-accent hover:bg-accent/10 rounded-full px-6 inline-flex items-center gap-1 transition-all"
                    >
                        Xem tất cả công việc
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>

                {/* Job Cards with Animation */}
                {allJobs.length <= 0 ? (
                    <div className="text-center py-16">
                        <div className="flex justify-center mb-4 opacity-30">
                            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"></path>
                                <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"></path>
                            </svg>
                        </div>
                        <h3 className="text-xl font-medium mb-2">Không có công việc nào</h3>
                        <p className="text-muted-foreground">Hiện tại chưa có vị trí nào được đăng tải. Vui lòng quay lại sau.</p>
                    </div>
                ) : (
                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.1
                                }
                            }
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {allJobs?.slice(0,6).map((job) => (
                            <motion.div
                                key={job._id}
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
                                }}
                            >
                                <LatestJobCards job={job}/>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
                
                {/* CTA Section */}
                <div className="mt-16 text-center">
                    <div className="inline-block w-16 h-1 bg-accent rounded-full mb-4"></div>
                    <h3 className="text-2xl font-bold mb-3">Không tìm thấy công việc phù hợp?</h3>
                    <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                        Khám phá thêm hàng trăm cơ hội việc làm khác trên nền tảng của chúng tôi.
                    </p>
                    <Button 
                        onClick={() => navigate('/browse')} 
                        className="bg-accent hover:bg-accent/90 text-white rounded-full"
                    >
                        Tìm kiếm công việc ngay
                    </Button>
                </div>
            </div>
        </section>
    )
}

export default LatestJobs