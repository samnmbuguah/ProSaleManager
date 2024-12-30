import axios from "axios";

export const api = axios.create({
  baseURL: "http://34.131.30.62:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true
}); 