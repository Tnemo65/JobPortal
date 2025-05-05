import React, { useState, useEffect } from 'react'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { Search, X, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Separator } from './ui/separator'
import { useDispatch } from 'react-redux'
import { setSearchedQuery } from '@/redux/jobSlice'
import useGetAllJobs from '@/hooks/useGetAllJobs'

// Dữ liệu cho các danh mục lọc - đồng bộ với trường dữ liệu trong database theo sampledb.js
const filterCategories = [
    {
        filterType: "Loại công việc",
        id: "jobType",
        array: ["Toàn thời gian", "Bán thời gian", "Từ xa", "Hợp đồng"]
    },
    {
        filterType: "Kinh nghiệm",
        id: "experienceLevel",
        array: ["Mới bắt đầu", "Trung cấp", "Cao cấp"]
    },
    {
        filterType: "Địa điểm",
        id: "location",
        array: [
            "Hà Nội", "TP Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ",
            "Nha Trang", "Huế", "Quy Nhơn", "Vũng Tàu", "Đà Lạt"
        ]
    },
    {
        filterType: "Mức lương",
        id: "salaryRange",
        array: [
            { display: "Dưới 10 triệu", value: "0-10000000" },
            { display: "10-20 triệu", value: "10000000-20000000" },
            { display: "20-30 triệu", value: "20000000-30000000" },
            { display: "30-40 triệu", value: "30000000-40000000" },
            { display: "40-50 triệu", value: "40000000-50000000" },
            { display: "Trên 50 triệu", value: "50000000-999999999" }
        ]
    },
    {
        filterType: "Kỹ năng",
        id: "skills",
        array: [
            "Lập trình Java", "Lập trình Python", "Lập trình PHP", "ReactJS", "NodeJS",
            "Kế toán", "Marketing", "Bán hàng", "Thiết kế đồ họa", "Quản trị nhân sự",
            "Phát triển ứng dụng di động", "Quản lý dự án", "Phân tích dữ liệu", "SEO"
        ]
    }
];

const FilterCard = () => {
    const [filters, setFilters] = useState({});
    const [expandedCategories, setExpandedCategories] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilterCount, setActiveFilterCount] = useState(0);
    const dispatch = useDispatch();
    const { getAllJobs, loading } = useGetAllJobs();

    // Tính toán số lượng filter đang áp dụng
    useEffect(() => {
        let count = 0;
        Object.values(filters).forEach(filterValues => {
            count += filterValues.length;
        });
        setActiveFilterCount(count);
    }, [filters]);

    // Xử lý khi thay đổi giá trị trong bộ lọc
    const handleFilterChange = (category, value) => {
        // Xác định giá trị thực để lưu trữ (đối với mức lương)
        let valueToStore = value;
        // Nếu là danh mục mức lương, lấy giá trị value thay vì display text
        if (category === 'salaryRange') {
            const salaryOption = filterCategories.find(cat => cat.id === 'salaryRange').array
                .find(item => item.display === value || item.value === value);
            valueToStore = salaryOption ? salaryOption.value : value;
        }

        setFilters(prevFilters => {
            // Tạo bản sao để tránh thay đổi trực tiếp state
            const newFilters = { ...prevFilters };
            
            // Khởi tạo mảng danh mục nếu chưa tồn tại
            if (!newFilters[category]) {
                newFilters[category] = [];
            }
            
            // Thêm hoặc xóa giá trị
            if (newFilters[category].includes(valueToStore)) {
                newFilters[category] = newFilters[category].filter(item => item !== valueToStore);
                // Xóa danh mục nếu không còn giá trị nào
                if (newFilters[category].length === 0) {
                    delete newFilters[category];
                }
            } else {
                newFilters[category] = [...newFilters[category], valueToStore];
            }
            
            return newFilters;
        });
    };

    // Kiểm tra xem một giá trị có được chọn hay không
    const isValueChecked = (category, value) => {
        // Đối với mức lương, cần kiểm tra theo value thay vì display text
        if (category === 'salaryRange') {
            const salaryOption = filterCategories.find(cat => cat.id === 'salaryRange').array
                .find(item => item.display === value || item.value === value);
            value = salaryOption ? salaryOption.value : value;
        }
        
        return filters[category] && filters[category].includes(value);
    };

    // Xóa một filter cụ thể
    const removeFilter = (category, value) => {
        handleFilterChange(category, value);
    };

    // Xóa tất cả filter
    const clearAllFilters = () => {
        setFilters({});
        setSearchTerm('');
        dispatch(setSearchedQuery(''));
    };

    // Áp dụng filter
    const applyFilters = () => {
        // Cập nhật từ khóa tìm kiếm vào Redux
        dispatch(setSearchedQuery(searchTerm));
        
        // Áp dụng các bộ lọc
        getAllJobs({
            keyword: searchTerm,
            ...filters
        });
    };

    // Mở rộng/thu gọn nhóm filter
    const toggleCategory = (categoryId) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    // Hiển thị các filter đang được áp dụng
    const renderActiveFilters = () => {
        const activeFilters = [];
        
        Object.entries(filters).forEach(([category, values]) => {
            values.forEach(value => {
                let displayValue = value;
                
                // Đối với mức lương, hiển thị text thân thiện
                if (category === 'salaryRange') {
                    const salaryOption = filterCategories.find(cat => cat.id === 'salaryRange').array
                        .find(item => item.value === value);
                    displayValue = salaryOption ? salaryOption.display : value;
                }
                
                // Tìm tên hiển thị cho category
                const categoryConfig = filterCategories.find(cat => cat.id === category);
                const categoryName = categoryConfig ? categoryConfig.filterType : category;
                
                activeFilters.push(
                    <Badge 
                        key={`${category}-${value}`} 
                        className="bg-accent/20 text-accent hover:bg-accent/30 py-2 px-3 gap-1"
                    >
                        {`${categoryName}: ${displayValue}`}
                        <button 
                            onClick={() => removeFilter(category, value)} 
                            className="ml-1 hover:bg-accent/20 rounded-full"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                );
            });
        });
        
        return activeFilters;
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            {/* Tìm kiếm */}
            <div className="mb-4">
                <Label htmlFor="search" className="font-medium mb-2 block">
                    Tìm kiếm
                </Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        id="search"
                        placeholder="Tìm kiếm việc làm..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Separator className="my-4" />

            {/* Filter đang áp dụng */}
            {activeFilterCount > 0 && (
                <>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">Filter đang áp dụng</h3>
                        <Button 
                            variant="link" 
                            size="sm" 
                            onClick={clearAllFilters}
                            className="text-accent hover:text-accent/80 p-0 h-auto"
                        >
                            Xóa tất cả
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {renderActiveFilters()}
                    </div>
                    <Separator className="my-4" />
                </>
            )}

            {/* Danh sách các filter */}
            {filterCategories.map((category, index) => (
                <div key={category.id} className="mb-4">
                    <div
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() => toggleCategory(category.id)}
                    >
                        <h3 className="font-medium">{category.filterType}</h3>
                        {expandedCategories[category.id] ? (
                            <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                    </div>
                    
                    {expandedCategories[category.id] && (
                        <div className="mt-2 space-y-2 pl-1">
                            {category.array.map((item, index) => {
                                const itemValue = category.id === 'salaryRange' ? item.display : item;
                                const itemId = `${category.id}-${index}`;
                                
                                return (
                                    <div key={itemId} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={itemId}
                                            checked={isValueChecked(category.id, itemValue)}
                                            onCheckedChange={() => handleFilterChange(category.id, itemValue)}
                                        />
                                        <Label 
                                            htmlFor={itemId} 
                                            className="text-sm cursor-pointer"
                                        >
                                            {itemValue}
                                        </Label>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    
                    {index < filterCategories.length - 1 && <Separator className="my-3" />}
                </div>
            ))}

            {/* Nút áp dụng */}
            <Button 
                className="w-full bg-accent hover:bg-accent/90 mt-4"
                onClick={applyFilters}
                disabled={loading}
            >
                {loading ? (
                    <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Đang áp dụng...
                    </>
                ) : (
                    "Áp dụng Filter"
                )}
            </Button>
        </div>
    );
};

export default FilterCard;