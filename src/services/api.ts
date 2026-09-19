import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach accessToken
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 unauthorized & auto refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh-token', { refreshToken });
          if (data.data?.accessToken) {
            localStorage.setItem('accessToken', data.data.accessToken);
            localStorage.setItem('refreshToken', data.data.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
            return api(originalRequest);
          }
        } catch (_refreshError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ============================================
// API SERVICE MODULES
// ============================================

export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
  impersonate: (data: { role: string }) => api.post('/auth/impersonate', data),
};

export const dashboardApi = {
  getSuperAdmin: () => api.get('/dashboard/super-admin'),
  getAdmin: () => api.get('/dashboard/admin'),
  getStudent: () => api.get('/dashboard/student'),
  getLiveStats: () => api.get('/dashboard/live-stats'),
};

export const questionApi = {
  getQuestions: (params?: any) => api.get('/questions', { params }),
  getQuestionById: (id: string) => api.get(`/questions/${id}`),
  createQuestion: (data: any) => api.post('/questions', data),
  updateQuestion: (id: string, data: any) => api.put(`/questions/${id}`, data),
  deleteQuestion: (id: string) => api.delete(`/questions/${id}`),
  duplicateQuestion: (id: string) => api.post(`/questions/${id}/duplicate`),
  generateAIQuestions: (data: any) => api.post('/questions/generate', data),
};

export const testApi = {
  getTests: (params?: any) => api.get('/tests', { params }),
  getTestById: (id: string) => api.get(`/tests/${id}`),
  createTest: (data: any) => api.post('/tests', data),
  updateTest: (id: string, data: any) => api.put(`/tests/${id}`, data),
  publishTest: (id: string) => api.post(`/tests/${id}/publish`),
  assignTest: (id: string, data: any) => api.post(`/tests/${id}/assign`, data),
  getAssignments: (params?: any) => api.get('/tests/assignments/all', { params }),
  
  // Student assessment flow
  getStudentAssignments: () => api.get('/tests/my/assignments'),
  startTest: (testId: string) => api.post(`/tests/${testId}/start`),
  saveAnswer: (testId: string, data: any) => api.post(`/tests/${testId}/answer`, data),
  submitTest: (testId: string) => api.post(`/tests/${testId}/submit`),
  getResult: (testId: string) => api.get(`/tests/${testId}/result`),
  evaluateAnswer: (submissionId: string, data: any) => api.post(`/tests/evaluate/${submissionId}`, data),
};

export const materialApi = {
  getMaterials: (params?: any) => api.get('/materials', { params }),
  getMaterialById: (id: string) => api.get(`/materials/${id}`),
  generateMaterial: (data: any) => api.post('/materials/generate', data),
  createMaterial: (data: any) => api.post('/materials', data),
  updateMaterial: (id: string, data: any) => api.put(`/materials/${id}`, data),
  deleteMaterial: (id: string) => api.delete(`/materials/${id}`),
  mapMaterial: (id: string, data: any) => api.post(`/materials/${id}/map`, data),
  
  // Student learning flow
  getStudentMaterials: () => api.get('/materials/my/learning'),
  getStudentMaterialById: (id: string) => api.get(`/materials/my/learning/${id}`),
  recordActivity: (id: string, data: any) => api.post(`/materials/${id}/activity`, data),
};

export const academicApi = {
  getDepartments: () => api.get('/academic/departments'),
  createDepartment: (data: any) => api.post('/academic/departments', data),
  getBatches: () => api.get('/academic/batches'),
  createBatch: (data: any) => api.post('/academic/batches', data),
  getSubjects: () => api.get('/academic/subjects'),
  createSubject: (data: any) => api.post('/academic/subjects', data),
  getSkills: (subjectId?: string) => api.get('/academic/skills', { params: { subjectId } }),
  createSkill: (data: any) => api.post('/academic/skills', data),
  getTopics: (skillId?: string) => api.get('/academic/topics', { params: { skillId } }),
  createTopic: (data: any) => api.post('/academic/topics', data),
};

export const userApi = {
  getUsers: (params?: any) => api.get('/users', { params }),
  getUserById: (id: string) => api.get(`/users/${id}`),
  createUser: (data: any) => api.post('/users', data),
  updateUser: (id: string, data: any) => api.put(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
};

export const reportApi = {
  getStudentReport: (params?: any) => api.get('/reports/student', { params }),
  getTestReport: (testId?: string) => api.get('/reports/test', { params: { testId } }),
  exportReport: (type: 'student' | 'test', format: 'csv' | 'excel' | 'pdf', params?: any) => {
    return api.get(`/reports/export/${type}/${format}`, {
      params,
      responseType: 'blob',
    });
  },
};

export const systemApi = {
  getAuditLogs: (params?: any) => api.get('/audit-logs', { params }),
  getNotifications: () => api.get('/notifications'),
  markNotificationsRead: (id: string) => api.put(`/notifications/${id}/read`),
};
