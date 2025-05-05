import { configureStore } from "@reduxjs/toolkit";
import { 
    persistReducer, 
    persistStore, 
    FLUSH, 
    REHYDRATE, 
    PAUSE, 
    PERSIST, 
    PURGE, 
    REGISTER 
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./authSlice";
import jobReducer from "./jobSlice";
import companyReducer from "./companySlice";
import applicationReducer from "./applicationSlice";

// Configure auth persistence - don't store sensitive data
const authPersistConfig = {
    key: "auth",
    storage,
    // Include savedJobs in whitelist to persist them
    whitelist: ["user", "savedJobs"]
};

// Configure job persistence
const jobPersistConfig = {
    key: "job",
    storage,
    whitelist: ["singleJob", "allJobs", "allAdminJobs", "allAppliedJobs"]
};

// Configure company persistence
const companyPersistConfig = {
    key: "company",
    storage,
    whitelist: ["singleCompany", "allCompanies"]
};

// Configure application persistence
const applicationPersistConfig = {
    key: "application",
    storage,
    whitelist: ["applicants"]
};

// Create the store with persisted reducers
const store = configureStore({
    reducer: {
        auth: persistReducer(authPersistConfig, authReducer),
        job: persistReducer(jobPersistConfig, jobReducer),
        company: persistReducer(companyPersistConfig, companyReducer),
        application: persistReducer(applicationPersistConfig, applicationReducer)
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
});

export const persistor = persistStore(store);
export default store;