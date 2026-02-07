import axios from "axios";

export const carpoolApi = axios.create({
  baseURL: import.meta.env.VITE_CARPOOL_API_URL || "http://localhost:4000",
});

