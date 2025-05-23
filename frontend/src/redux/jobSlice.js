import { createSlice } from "@reduxjs/toolkit";

const jobSlice = createSlice({
    name:"job",
    initialState:{
        allJobs:[],
        allAdminJobs:[],
        singleJob:null, 
        searchJobByText:"",
        allAppliedJobs:[],
        searchedQuery:"",
    },
    reducers:{
        // actions
        setAllJobs:(state,action) => {
            state.allJobs = action.payload;
        },
        setSingleJob:(state,action) => {
            state.singleJob = action.payload;
        },
        setAllAdminJobs:(state,action) => {
            state.allAdminJobs = action.payload;
        },
        setSearchJobByText:(state,action) => {
            state.searchJobByText = action.payload;
        },
        setAllAppliedJobs:(state,action) => {
            state.allAppliedJobs = action.payload;
        },
        setSearchedQuery:(state,action) => {
            state.searchedQuery = action.payload;
        },
        addAdminJob:(state,action) => {
            // Thêm công việc mới vào đầu mảng allAdminJobs
            state.allAdminJobs = [action.payload, ...state.allAdminJobs];
            // Cập nhật luôn cả allJobs để đồng bộ dữ liệu
            state.allJobs = [action.payload, ...state.allJobs];
        },
        addAppliedJob: (state, action) => {
            // Check if the job is already in the applied jobs list
            const exists = state.allAppliedJobs.some(job => job._id === action.payload._id);
            if (!exists) {
                state.allAppliedJobs = [action.payload, ...state.allAppliedJobs];
            }
        }
    }
});
export const {
    setAllJobs, 
    setSingleJob, 
    setAllAdminJobs,
    setSearchJobByText, 
    setAllAppliedJobs,
    setSearchedQuery,
    addAdminJob,
    addAppliedJob
} = jobSlice.actions;
export default jobSlice.reducer;