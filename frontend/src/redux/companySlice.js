import { createSlice } from "@reduxjs/toolkit";

const companySlice = createSlice({
    name:"company",
    initialState:{
        singleCompany:null,
        companies:[],
        searchCompanyByText:"",
    },
    reducers:{
        // actions
        setSingleCompany:(state,action) => {
            state.singleCompany = action.payload;
        },
        setCompanies:(state,action) => {
            state.companies = action.payload;
        },
        setSearchCompanyByText:(state,action) => {
            state.searchCompanyByText = action.payload;
        },
        addCompany:(state,action) => {
            // Thêm công ty mới vào đầu mảng
            state.companies = [action.payload, ...state.companies];
        },
        // Thêm action updateCompany
        updateCompany:(state,action) => {
            // Cập nhật công ty trong mảng companies
            state.companies = state.companies.map(company => 
                company._id === action.payload._id ? action.payload : company
            );
            // Cập nhật singleCompany nếu đang xem công ty này
            if (state.singleCompany && state.singleCompany._id === action.payload._id) {
                state.singleCompany = action.payload;
            }
        }
    }
});

// Thêm updateCompany vào danh sách export
export const {setSingleCompany, setCompanies, setSearchCompanyByText, addCompany, updateCompany} = companySlice.actions;
export default companySlice.reducer;