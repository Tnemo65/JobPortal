import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    loading: false,
    user: null,
    savedJobs: [], // Add a separate array for saved jobs
    error: null
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setUser: (state, action) => {
            state.user = action.payload;
        },
        setSavedJobs: (state, action) => {
            state.savedJobs = action.payload;
        },
        addSavedJob: (state, action) => {
            // Check if job already exists in savedJobs
            const exists = state.savedJobs.some(job => job._id === action.payload._id);
            if (!exists) {
                state.savedJobs.push(action.payload);
            }
        },
        removeSavedJob: (state, action) => {
            // action.payload should be jobId
            state.savedJobs = state.savedJobs.filter(job => job._id !== action.payload);
        },
        clearSavedJobs: (state) => {
            state.savedJobs = [];
        }
    }
});

export const { 
    setLoading, 
    setUser, 
    setSavedJobs, 
    addSavedJob, 
    removeSavedJob, 
    clearSavedJobs 
} = authSlice.actions;
export default authSlice.reducer;