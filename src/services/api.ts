import axios from 'axios';
import { getServerUrl } from '../utils/config';

// 创建 axios 实例
const api = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 动态设置 baseURL
api.interceptors.request.use(
  (config) => {
    // 每次请求时从 localStorage 读取最新的服务端地址
    config.baseURL = `${getServerUrl()}/api`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default api;
