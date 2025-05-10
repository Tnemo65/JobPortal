import React, { useEffect } from 'react'
import Navbar from './shared/Navbar'
import HeroSection from './HeroSection'
import CategoryCarousel from './CategoryCarousel'
import LatestJobs from './LatestJobs'
import Footer from './shared/Footer'
import useGetAllJobs from '@/hooks/useGetAllJobs'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  useGetAllJobs();
  const { user } = useSelector(store => store.auth);
  const navigate = useNavigate();
  
  // Kiểm tra nếu user là admin và redirect chỉ lần đầu tiên khi component được mount
  // Sử dụng useRef để theo dõi xem đã thực hiện redirect chưa
  const hasRedirected = React.useRef(false);
  
  useEffect(() => {
    // Chỉ redirect nếu user là admin và chưa redirect trước đó
    if (user?.role === 'admin' && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate("/admin/companies", { replace: true });
    }
  }, [user, navigate]);
  return (
    <div>
      <Navbar />
      <HeroSection />
      <CategoryCarousel />
      <LatestJobs />
      <Footer />
    </div>
  )
}

export default Home