import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const ProtectedRoute = ({children}) => {
    const {user} = useSelector(store=>store.auth);
    const navigate = useNavigate();

    useEffect(() => {
        // Chỉ chuyển hướng khi đã biết chắc user không phải admin
        // Thêm kiểm tra để đảm bảo user đã được load xong
        if(user === null || (user && user.role !== 'admin')){
            navigate("/", { replace: true });
        }
    }, [user, navigate]);

    // Nếu user chưa được load hoặc không phải admin, không render children
    if(user === null || user.role !== 'admin') {
        return null;
    }

    return (
        <>
        {children}
        </>
    )
};
export default ProtectedRoute;