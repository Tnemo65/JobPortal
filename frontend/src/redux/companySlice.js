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
        }
    }
});
export const {setSingleCompany, setCompanies, setSearchCompanyByText, addCompany} = companySlice.actions;
export default companySlice.reducer;