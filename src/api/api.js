// src/api/api.js
import axios from "axios";

// Base API instance
const API = axios.create({
    // baseURL: "https://webmanagement-backend-production.up.railway.app/api",  // Backend base URL
    baseURL: "http://localhost:8080/api",
});

// Optional: Add an interceptor for Authorization header if user logged in
API.interceptors.request.use((req) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.token) {
        req.headers.Authorization = `Bearer ${user.token}`;
    }
    return req;
});

export default API;
