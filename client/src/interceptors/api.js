import axios from 'axios';
import {env} from '../../../environment'

const api = axios.create({
    baseURL: env.API_URL || 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // or use your auth context
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ✅ Response Interceptor: Handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error("Unauthorized - token may be expired");
            // Handle token refresh or logout
        }
        return Promise.reject(error);
    }
);

export default api;