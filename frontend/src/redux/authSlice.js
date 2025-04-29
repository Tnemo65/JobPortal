import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
    name:"auth",
    initialState:{
        loading:false,
        user:null,
        savedJobs:[]
    },
    reducers:{
        // actions
        setLoading:(state, action) => {
            state.loading = action.payload;
        },
        setUser:(state, action) => {
            state.user = action.payload; // Set user to null on logout
        },
        setSavedJobs:(state, action) => {
            state.savedJobs = action.payload;
        },
        addSavedJob:(state, action) => {
            state.savedJobs.push(action.payload);
        },
        removeSavedJob:(state, action) => {
            state.savedJobs = state.savedJobs.filter(job => job._id !== action.payload);
        }
    }
});
export const {setLoading, setUser, setSavedJobs, addSavedJob, removeSavedJob} = authSlice.actions;
export default authSlice.reducer;