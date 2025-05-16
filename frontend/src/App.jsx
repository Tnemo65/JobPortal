import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Navbar from './components/shared/Navbar'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import Home from './components/Home'
import Jobs from './components/Jobs'
import Browse from './components/Browse'
import Profile from './components/Profile'
import JobDescription from './components/JobDescription'
import Companies from './components/admin/Companies'
import CompanyCreate from './components/admin/CompanyCreate'
import CompanySetup from './components/admin/CompanySetup'
import AdminJobs from "./components/admin/AdminJobs";
import PostJob from './components/admin/PostJob'
import Applicants from './components/admin/Applicants'
import ProtectedRoute from './components/admin/ProtectedRoute'
import SavedJobs from './components/SavedJobs'
import SSOCallback from './components/auth/SSOCallback'
import { store } from './redux/store'
import useAuthCheck from './hooks/useAuthCheck'
import { Loader2 } from 'lucide-react'


const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/signup',
    element: <Signup />
  },
  {
    path: "/jobs",
    element: <Jobs />
  },
  {
    path: "/description/:id",
    element: <JobDescription />
  },
  {
    path: "/browse",
    element: <Browse />
  },
  {
    path: "/profile",
    element: <Profile />
  },
  {
    path: "/saved-jobs",
    element: <SavedJobs />
  },
  {
    path: "/sso-callback",
    element: <SSOCallback />
  },
  // admin ke liye yha se start hoga
  {
    path:"/admin/companies",
    element: <ProtectedRoute><Companies/></ProtectedRoute>
  },
  {
    path:"/admin/companies/create",
    element: <ProtectedRoute><CompanyCreate/></ProtectedRoute> 
  },
  {
    path:"/admin/companies/:id",
    element:<ProtectedRoute><CompanySetup/></ProtectedRoute> 
  },
  {
    path:"/admin/jobs",
    element:<ProtectedRoute><AdminJobs/></ProtectedRoute> 
  },
  {
    path:"/admin/jobs/create",
    element:<ProtectedRoute><PostJob/></ProtectedRoute> 
  },
  {
    path:"/admin/jobs/:id/applicants",
    element:<ProtectedRoute><Applicants/></ProtectedRoute> 
  },

])

function App() {
  // Sử dụng hook để kiểm tra phiên đăng nhập
  const { checkingAuth } = useAuthCheck();
  
  // Hiển thị loading khi đang kiểm tra trạng thái đăng nhập
  // Giới hạn thời gian loading tối đa là 3 giây
  const [forceLoad, setForceLoad] = React.useState(false);
  
  React.useEffect(() => {
    // Nếu sau 3 giây vẫn đang loading, bắt buộc hiển thị ứng dụng
    const timer = setTimeout(() => {
      if (checkingAuth) {
        console.log("Force loading app after timeout");
        setForceLoad(true);
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [checkingAuth]);
  
  if (checkingAuth && !forceLoad) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div>
      <RouterProvider router={appRouter} />
    </div>
  )
}

export default App
