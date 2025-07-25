import axios from 'axios';
import { User, ChatSession, ChatMessage, MedicalReport, LoginForm, RegisterForm, AuthResponse, UserSettings } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证相关 API
export const authAPI = {
  login: (data: LoginForm): Promise<AuthResponse> =>
    api.post('/auth/login', data).then(res => res.data),

  register: (data: RegisterForm): Promise<User> =>
    api.post('/auth/register', data).then(res => res.data),
};

// 用户相关 API
export const userAPI = {
  getProfile: (): Promise<User> =>
    api.get('/users/me').then(res => res.data),

  uploadAvatar: (file: File): Promise<{ message: string; avatar_path: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },

  getSettings: (): Promise<UserSettings> =>
    api.get('/users/settings').then(res => res.data),

  updateSettings: (settings: UserSettings): Promise<any> =>
    api.put('/users/settings', settings).then(res => res.data),

  getAvailableModels: (): Promise<any> =>
    api.get('/users/available-models').then(res => res.data),
};

// 聊天相关 API
export const chatAPI = {
  createSession: (title: string): Promise<ChatSession> =>
    api.post('/chat/sessions', { title }).then(res => res.data),

  getSessions: (): Promise<ChatSession[]> =>
    api.get('/chat/sessions').then(res => res.data),

  getSession: (sessionId: number): Promise<ChatSession> =>
    api.get(`/chat/sessions/${sessionId}`).then(res => res.data),

  deleteSession: (sessionId: number): Promise<void> =>
    api.delete(`/chat/sessions/${sessionId}`).then(res => res.data),

  sendMessage: (content: string, sessionId?: number): Promise<ChatMessage> =>
    api.post('/chat/messages', { content, session_id: sessionId }).then(res => res.data),

  getMessages: (sessionId: number): Promise<ChatMessage[]> =>
    api.get(`/chat/sessions/${sessionId}/messages`).then(res => res.data),
};

// 报告相关 API
export const reportAPI = {
  uploadReport: (file: File): Promise<MedicalReport> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/reports/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },

  getReports: (): Promise<MedicalReport[]> =>
    api.get('/reports').then(res => res.data),

  getReport: (reportId: number): Promise<MedicalReport> =>
    api.get(`/reports/${reportId}`).then(res => res.data),
};
