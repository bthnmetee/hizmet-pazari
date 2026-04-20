import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api', // 👈 Sonunda /api ve başında http:// olmak ZORUNDA
});

export default axiosInstance;