import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import jobReducer from "./jobSlice";
import companyReducer from "./companySlice";
import applicationReducer from "./applicationSlice";

// Create the store without any persistence - rely solely on HTTP-only cookies
const store = configureStore({
    reducer: {
        auth: authReducer,
        job: jobReducer,
        company: companyReducer,
        application: applicationReducer
    }
});

export { store };