import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import Cookies from 'js-cookie';

// Types
import { 
  APIResponse, 
  APIError,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  User,
  MedicalPatient,
  CreatePatientRequest,
  MedicalVisit,
  CreateVisitRequest,
  MedicalVitalSigns,
  CreateVitalSignsRequest,
  MedicalLabOrder,
  CreateLabOrderRequest,
  MedicalPrescription,
  CreatePrescriptionRequest,
  MedicalRecord,
  RiskAssessmentRequest,
  RiskAssessmentResponse,
  ConsentContract,
  ConsentContractRequest,
  MedicalDocument,
  CreateDocumentRequest,
  Appointment,
  CreateAppointmentRequest
} from '@/types/api';

// Constants
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * API Client Configuration
 * Handles all HTTP requests to Backend API
 */
class APIClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    console.log('🏗️ Creating API Client with baseURL:', API_BASE_URL);
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('🏗️ Axios instance created with baseURL:', this.axiosInstance.defaults.baseURL);
    this.setupInterceptors();
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - Add auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        console.log('🌐 API Request:', config.method?.toUpperCase(), config.url);
        console.log('🔑 Token available:', !!token);
        console.log('🔑 Token value:', token ? token.substring(0, 30) + '...' : 'null');
        console.log('🔧 Config headers before:', config.headers);
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔐 Authorization header set');
        } else {
          console.log('❌ No token available');
        }
        
        console.log('🔧 Config headers after:', config.headers);
        
        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();
        
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // If error is 401 and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return this.axiosInstance(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = this.getRefreshToken();
            console.log('🔄 Attempting token refresh...');
            
            if (refreshToken) {
              const response = await this.refreshToken({ refreshToken });
              
              if (response.data && !response.error) {
                const { accessToken } = response.data;
                console.log('✅ Token refresh successful');
                
                this.setAccessToken(accessToken);
                
                // Process failed queue
                this.processQueue(null, accessToken);
                
                // Retry original request with new token
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                }
                return this.axiosInstance(originalRequest);
              } else {
                console.error('❌ Token refresh failed:', response.message);
                throw new Error('Token refresh failed');
              }
            } else {
              console.error('❌ No refresh token available');
              throw new Error('No refresh token');
            }
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            this.clearTokens();
            // Redirect to login
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Process queued requests after token refresh
   */
  private processQueue(error: any, token: string | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError): APIError {
    if (error.response) {
      // Server responded with error status
      const responseData = error.response.data as any;
      return {
        message: responseData?.message || error.message,
        code: responseData?.code || error.code,
        statusCode: error.response.status,
        details: responseData?.details || responseData?.errors
      };
    } else if (error.request) {
      // Network error
      return {
        message: 'Network error - please check your connection',
        statusCode: 0,
        code: 'NETWORK_ERROR'
      };
    } else {
      // Request setup error
      return {
        message: error.message,
        statusCode: 0,
        code: 'REQUEST_ERROR'
      };
    }
  }

  /**
   * Token management
   */
  public getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    // Check remember me preference to determine storage type
    const isRemembered = localStorage.getItem('rememberMe') === 'true';
    console.log('🔍 getAccessToken - rememberMe preference:', isRemembered);
    let token = null;
    
    if (isRemembered) {
      // If user chose to be remembered, check localStorage first, then cookie
      try {
        token = localStorage.getItem(TOKEN_KEY);
        console.log('🔒 Checking localStorage for token:', !!token);
        if (!token) {
          token = Cookies.get(TOKEN_KEY);
          console.log('🍪 Checking cookie for token:', !!token);
        }
        console.log('🔒 Token retrieved from persistent storage (remembered):', !!token);
      } catch (error) {
        console.error('❌ Persistent storage retrieval failed:', error);
      }
    } else {
      // If user didn't choose to be remembered, check sessionStorage first
      try {
        token = sessionStorage.getItem(TOKEN_KEY);
        console.log('🔓 Checking sessionStorage for token:', !!token);
        if (!token) {
          // Fallback to cookie or localStorage (migration case)
          token = Cookies.get(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
          console.log('🍪 Checking cookie/localStorage fallback for token:', !!token);
        }
        console.log('🔓 Token retrieved from session storage (not remembered):', !!token);
      } catch (error) {
        console.error('❌ Session storage retrieval failed:', error);
      }
    }
    
    // Debug: Log all storage types
    console.log('🔍 Debug - Storage check:');
    console.log('  - localStorage token:', !!localStorage.getItem(TOKEN_KEY));
    console.log('  - sessionStorage token:', !!sessionStorage.getItem(TOKEN_KEY));
    console.log('  - cookie token:', !!Cookies.get(TOKEN_KEY));
    console.log('  - rememberMe:', localStorage.getItem('rememberMe'));
    
    // Validate token format (basic check)
    if (token && !token.startsWith('eyJ')) {
      console.warn('⚠️ Invalid token format detected, clearing...');
      this.clearTokens();
      return null;
    }
    
    return token || null;
  }

  public setAccessToken(token: string): void {
    if (typeof window === 'undefined') return;
    console.log('🔑 Setting access token:', token.substring(0, 30) + '...');
    
    // Check remember me preference to determine storage type
    const isRemembered = localStorage.getItem('rememberMe') === 'true';
    console.log('🔍 rememberMe preference:', isRemembered);
    
    if (isRemembered) {
      // If user chose to be remembered, store in localStorage and cookie
      console.log('🔒 Storing token in persistent storage (remembered)');
      
      // Store in localStorage
      try {
        localStorage.setItem(TOKEN_KEY, token);
        console.log('💾 Token stored in localStorage');
        
        // Verify storage
        const verifyToken = localStorage.getItem(TOKEN_KEY);
        console.log('✅ localStorage verification:', !!verifyToken);
      } catch (error) {
        console.error('❌ LocalStorage storage failed:', error);
      }
      
      // Also store in cookie as backup
      try {
        const cookieOptions = {
          expires: 7, // 7 days for remembered users
          path: '/',
          sameSite: 'lax' as const,
          secure: false
        };
        Cookies.set(TOKEN_KEY, token, cookieOptions);
        console.log('🍪 Token stored in cookie (backup)');
      } catch (error) {
        console.error('❌ Cookie storage failed:', error);
      }
    } else {
      // If user didn't choose to be remembered, store in sessionStorage only
      console.log('🔓 Storing token in session storage (not remembered)');
      
      try {
        sessionStorage.setItem(TOKEN_KEY, token);
        console.log('💾 Token stored in sessionStorage');
        
        // Verify storage
        const verifyToken = sessionStorage.getItem(TOKEN_KEY);
        console.log('✅ sessionStorage verification:', !!verifyToken);
      } catch (error) {
        console.error('❌ SessionStorage storage failed:', error);
        // Fallback to cookie with session expiry
        try {
          Cookies.set(TOKEN_KEY, token, { path: '/' }); // No expires = session cookie
          console.log('🍪 Token stored in session cookie (fallback)');
        } catch (cookieError) {
          console.error('❌ Cookie fallback failed:', cookieError);
        }
      }
    }
  }

  public getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    // Check remember me preference to determine storage type
    const isRemembered = localStorage.getItem('rememberMe') === 'true';
    let token = null;
    
    if (isRemembered) {
      // If user chose to be remembered, check localStorage first, then cookie
      try {
        token = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!token) {
          token = Cookies.get(REFRESH_TOKEN_KEY);
        }
      } catch (error) {
        console.error('❌ Persistent refresh token retrieval failed:', error);
      }
    } else {
      // If user didn't choose to be remembered, check sessionStorage first
      try {
        token = sessionStorage.getItem(REFRESH_TOKEN_KEY);
        if (!token) {
          token = Cookies.get(REFRESH_TOKEN_KEY);
        }
      } catch (error) {
        console.error('❌ Session refresh token retrieval failed:', error);
      }
    }
    
    return token || null;
  }

  public setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    
    // Check remember me preference to determine storage type
    const isRemembered = localStorage.getItem('rememberMe') === 'true';
    
    if (isRemembered) {
      // If user chose to be remembered, store in localStorage and cookie
      try {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
        console.log('💾 Refresh token stored in localStorage');
      } catch (error) {
        console.error('❌ LocalStorage refresh token storage failed:', error);
      }
      
      // Also store in cookie as backup
      try {
        const cookieOptions = {
          expires: 7, // 7 days for remembered users
          path: '/',
          sameSite: 'lax' as const,
          secure: false
        };
        Cookies.set(REFRESH_TOKEN_KEY, token, cookieOptions);
        console.log('🍪 Refresh token stored in cookie (backup)');
      } catch (error) {
        console.error('❌ Cookie refresh token storage failed:', error);
      }
    } else {
      // If user didn't choose to be remembered, store in sessionStorage only
      try {
        sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
        console.log('💾 Refresh token stored in sessionStorage');
      } catch (error) {
        console.error('❌ SessionStorage refresh token storage failed:', error);
        // Fallback to cookie with session expiry
        try {
          Cookies.set(REFRESH_TOKEN_KEY, token, { path: '/' }); // No expires = session cookie
          console.log('🍪 Refresh token stored in session cookie (fallback)');
        } catch (cookieError) {
          console.error('❌ Cookie refresh token fallback failed:', cookieError);
        }
      }
    }
  }

  public clearTokens(): void {
    if (typeof window === 'undefined') return;
    
    console.log('🧹 Clearing all tokens and session data...');
    
    // Clear cookies with all possible configurations
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
    Cookies.remove(TOKEN_KEY, { path: '/' });
    Cookies.remove(REFRESH_TOKEN_KEY, { path: '/' });
    
    // Clear localStorage fallback
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      console.log('💾 Tokens cleared from localStorage');
    } catch (error) {
      console.error('❌ LocalStorage cleanup failed:', error);
    }
    
    // Clear sessionStorage as well
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      console.log('💾 Tokens cleared from sessionStorage');
    } catch (error) {
      console.error('❌ SessionStorage cleanup failed:', error);
    }
    
    // Clear any other auth-related data
    try {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      console.log('🧹 User data cleared from storage');
    } catch (error) {
      console.error('❌ User data cleanup failed:', error);
    }
    
    console.log('✅ All tokens and session data cleared');
  }

  public setAuthTokens(accessToken: string, refreshToken: string): void {
    console.log('🔑 Setting auth tokens...');
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
    console.log('🔑 Auth tokens set complete');
  }

  /**
   * Generic request method
   */
  private async request<T>(config: AxiosRequestConfig): Promise<APIResponse<T>> {
    try {
      console.log('🌐 Making API request:', {
        method: config.method,
        url: config.url,
        baseURL: this.axiosInstance.defaults.baseURL,
        fullURL: `${this.axiosInstance.defaults.baseURL}${config.url}`
      });
      
      const response: AxiosResponse<APIResponse<T>> = await this.axiosInstance(config);
      console.log('✅ API response received:', response.status, response.data);
      
      // Transform backend response to frontend format
      const transformedResponse: APIResponse<T> = {
        data: response.data.data,
        meta: response.data.meta,
        error: response.data.error,
        statusCode: response.data.statusCode
      };
      
      return transformedResponse;
    } catch (error) {
      console.error('💥 API request failed:', error);
      throw error; // Will be handled by interceptor
    }
  }

  // =============================================================================
  // AUTHENTICATION API
  // =============================================================================

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<APIResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>({
      method: 'POST',
      url: '/auth/login',
      data
    });
    
    // Store tokens if login successful
    if (response.data && !response.error) {
      this.setAuthTokens(response.data.accessToken, response.data.refreshToken);
    }
    
    return response;
  }

  /**
   * Register user
   */
  async register(data: RegisterRequest): Promise<APIResponse<AuthResponse>> {
    console.log('🆕 Attempting registration with:', { ...data, password: '[HIDDEN]' });
    
    const response = await this.request<AuthResponse>({
      method: 'POST',
      url: '/auth/register',
      data
    });
    
    console.log('📥 Registration response:', response);
    
    // Store tokens if registration successful
    if (response.data && !response.error) {
      this.setAuthTokens(response.data.accessToken, response.data.refreshToken);
    }
    
    return response;
  }

  /**
   * Refresh access token
   */
  async refreshToken(data: RefreshTokenRequest): Promise<APIResponse<{ accessToken: string; refreshToken: string }>> {
    return this.request({
      method: 'POST',
      url: '/auth/refresh-token',
      data
    });
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<APIResponse<{ message: string }>> {
    return this.request({
      method: 'POST',
      url: '/auth/resend-verification',
      data: { email }
    });
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<APIResponse<{ message: string }>> {
    return this.request({
      method: 'POST',
      url: '/auth/verify-email',
      data: { token }
    });
  }

  /**
   * Logout user
   */
  async logout(): Promise<APIResponse<null>> {
    const refreshToken = this.getRefreshToken();
    
    try {
      const response = await this.request<null>({
        method: 'POST',
        url: '/auth/logout',
        data: { refreshToken }
      });
      
      this.clearTokens();
      return response;
    } catch (error) {
      // Clear tokens even if logout request fails
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<APIResponse<User>> {
    console.log('📱 getProfile called');
    try {
      const response = await this.request<User>({
        method: 'GET',
        url: '/auth/profile'
      });
      console.log('✅ getProfile success:', response);
      return response;
    } catch (error) {
      console.error('❌ getProfile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<APIResponse<User>> {
    return this.request<User>({
      method: 'PUT',
      url: '/auth/profile',
      data
    });
  }

  /**
   * Setup patient profile (complete profile)
   */
  async setupProfile(data: {
    thai_name?: string;
    phone?: string;
    emergency_contact?: string;
    national_id?: string;
    birth_date?: string;
    address?: string;
    medical_history?: string;
    allergies?: string;
    medications?: string;
  }): Promise<APIResponse<User>> {
    return this.request<User>({
      method: 'POST',
      url: '/profile/setup',
      data
    });
  }

  /**
   * Get patient profile (authenticated patient's own data)
   */
  async getPatientProfile(): Promise<APIResponse<MedicalPatient>> {
    return this.request<MedicalPatient>({
      method: 'GET',
      url: '/patients/profile'
    });
  }

  // =============================================================================
  // MEDICAL RECORDS API
  // =============================================================================

  /**
   * Get patients list
   */
  async getPatients(params?: { page?: number; limit?: number; search?: string }): Promise<APIResponse<MedicalPatient[]>> {
    return this.request<MedicalPatient[]>({
      method: 'GET',
      url: '/medical/patients',
      params
    });
  }

  /**
   * Get patient by ID
   */
  async getPatient(id: string): Promise<APIResponse<MedicalPatient>> {
    return this.request<MedicalPatient>({
      method: 'GET',
      url: `/medical/patients/${id}`
    });
  }

  /**
   * Create new patient
   */
  async createPatient(data: CreatePatientRequest): Promise<APIResponse<MedicalPatient>> {
    return this.request<MedicalPatient>({
      method: 'POST',
      url: '/medical/patients',
      data
    });
  }

  /**
   * Update patient
   */
  async updatePatient(id: string, data: Partial<MedicalPatient>): Promise<APIResponse<MedicalPatient>> {
    return this.request<MedicalPatient>({
      method: 'PUT',
      url: `/medical/patients/${id}`,
      data
    });
  }

  /**
   * Get patient medical records
   */
  async getPatientRecords(patientId: string): Promise<APIResponse<MedicalRecord[]>> {
    return this.request<MedicalRecord[]>({
      method: 'GET',
      url: `/medical/patients/${patientId}/records`
    });
  }

  // =============================================================================
  // MEDICAL VISITS API
  // =============================================================================

  /**
   * Create new visit
   */
  async createVisit(data: CreateVisitRequest): Promise<APIResponse<MedicalVisit>> {
    return this.request<MedicalVisit>({
      method: 'POST',
      url: '/medical/visits',
      data
    });
  }

  /**
   * Get visit by ID
   */
  async getVisit(id: string): Promise<APIResponse<MedicalVisit>> {
    return this.request<MedicalVisit>({
      method: 'GET',
      url: `/medical/visits/${id}`
    });
  }

  /**
   * Update visit
   */
  async updateVisit(id: string, data: Partial<MedicalVisit>): Promise<APIResponse<MedicalVisit>> {
    return this.request<MedicalVisit>({
      method: 'PUT',
      url: `/medical/visits/${id}`,
      data
    });
  }

  /**
   * Complete visit
   */
  async completeVisit(id: string): Promise<APIResponse<MedicalVisit>> {
    return this.request<MedicalVisit>({
      method: 'PATCH',
      url: `/medical/visits/${id}/complete`
    });
  }

  /**
   * Get patient visits
   */
  async getPatientVisits(patientId: string): Promise<APIResponse<MedicalVisit[]>> {
    return this.request<MedicalVisit[]>({
      method: 'GET',
      url: `/medical/patients/${patientId}/visits`
    });
  }

  /**
   * Search visits
   */
  async searchVisits(params?: {
    patientId?: string;
    doctorId?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<APIResponse<MedicalVisit[]>> {
    return this.request<MedicalVisit[]>({
      method: 'GET',
      url: '/medical/visits/search',
      params
    });
  }

  // =============================================================================
  // VITAL SIGNS API
  // =============================================================================

  /**
   * Create vital signs
   */
  async createVitalSigns(data: CreateVitalSignsRequest): Promise<APIResponse<MedicalVitalSigns>> {
    return this.request<MedicalVitalSigns>({
      method: 'POST',
      url: '/medical/vital-signs',
      data
    });
  }

  /**
   * Get vital signs by visit
   */
  async getVitalSignsByVisit(visitId: string): Promise<APIResponse<MedicalVitalSigns[]>> {
    return this.request<MedicalVitalSigns[]>({
      method: 'GET',
      url: `/medical/visits/${visitId}/vital-signs`
    });
  }

  /**
   * Update vital signs
   */
  async updateVitalSigns(id: string, data: Partial<MedicalVitalSigns>): Promise<APIResponse<MedicalVitalSigns>> {
    return this.request<MedicalVitalSigns>({
      method: 'PUT',
      url: `/medical/vital-signs/${id}`,
      data
    });
  }

  /**
   * Delete vital signs
   */
  async deleteVitalSigns(id: string): Promise<APIResponse<null>> {
    return this.request<null>({
      method: 'DELETE',
      url: `/medical/vital-signs/${id}`
    });
  }

  // =============================================================================
  // LAB ORDERS API
  // =============================================================================

  /**
   * Create lab order
   */
  async createLabOrder(data: CreateLabOrderRequest): Promise<APIResponse<MedicalLabOrder>> {
    return this.request<MedicalLabOrder>({
      method: 'POST',
      url: '/medical/lab-orders',
      data
    });
  }

  /**
   * Get lab order by ID
   */
  async getLabOrder(id: string): Promise<APIResponse<MedicalLabOrder>> {
    return this.request<MedicalLabOrder>({
      method: 'GET',
      url: `/medical/lab-orders/${id}`
    });
  }

  /**
   * Update lab order
   */
  async updateLabOrder(id: string, data: Partial<MedicalLabOrder>): Promise<APIResponse<MedicalLabOrder>> {
    return this.request<MedicalLabOrder>({
      method: 'PUT',
      url: `/medical/lab-orders/${id}`,
      data
    });
  }

  /**
   * Get lab orders by visit
   */
  async getLabOrdersByVisit(visitId: string): Promise<APIResponse<MedicalLabOrder[]>> {
    return this.request<MedicalLabOrder[]>({
      method: 'GET',
      url: `/medical/visits/${visitId}/lab-orders`
    });
  }

  /**
   * Create lab result
   */
  async createLabResult(labOrderId: string, data: any): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'POST',
      url: '/medical/lab-results',
      data: { labOrderId, ...data }
    });
  }

  /**
   * Get lab results
   */
  async getLabResults(labOrderId: string): Promise<APIResponse<any[]>> {
    return this.request<any[]>({
      method: 'GET',
      url: `/medical/lab-orders/${labOrderId}/results`
    });
  }

  // =============================================================================
  // PRESCRIPTIONS API
  // =============================================================================

  /**
   * Create prescription
   */
  async createPrescription(data: CreatePrescriptionRequest): Promise<APIResponse<MedicalPrescription>> {
    return this.request<MedicalPrescription>({
      method: 'POST',
      url: '/medical/prescriptions',
      data
    });
  }

  /**
   * Get prescription by ID
   */
  async getPrescription(id: string): Promise<APIResponse<MedicalPrescription>> {
    return this.request<MedicalPrescription>({
      method: 'GET',
      url: `/medical/prescriptions/${id}`
    });
  }

  /**
   * Update prescription
   */
  async updatePrescription(id: string, data: Partial<MedicalPrescription>): Promise<APIResponse<MedicalPrescription>> {
    return this.request<MedicalPrescription>({
      method: 'PUT',
      url: `/medical/prescriptions/${id}`,
      data
    });
  }

  /**
   * Update prescription item
   */
  async updatePrescriptionItem(id: string, data: any): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'PUT',
      url: `/medical/prescription-items/${id}`,
      data
    });
  }

  /**
   * Get prescriptions by visit
   */
  async getPrescriptionsByVisit(visitId: string): Promise<APIResponse<MedicalPrescription[]>> {
    return this.request<MedicalPrescription[]>({
      method: 'GET',
      url: `/medical/visits/${visitId}/prescriptions`
    });
  }

  /**
   * Create medical record
   */
  async createMedicalRecord(patientId: string, data: Omit<MedicalRecord, 'id' | 'patientId' | 'created_at' | 'updated_at'>): Promise<APIResponse<MedicalRecord>> {
    return this.request<MedicalRecord>({
      method: 'POST',
      url: `/medical/patients/${patientId}/records`,
      data
    });
  }

  // =============================================================================
  // AI RISK ASSESSMENT API
  // =============================================================================

  /**
   * Diabetes risk assessment
   */
  async assessDiabetesRisk(data: RiskAssessmentRequest): Promise<APIResponse<RiskAssessmentResponse>> {
    return this.request<RiskAssessmentResponse>({
      method: 'POST',
      url: '/ai/risk-assessment/diabetes',
      data
    });
  }

  /**
   * Hypertension risk assessment
   */
  async assessHypertensionRisk(data: RiskAssessmentRequest): Promise<APIResponse<RiskAssessmentResponse>> {
    return this.request<RiskAssessmentResponse>({
      method: 'POST',
      url: '/ai/risk-assessment/hypertension',
      data
    });
  }

  /**
   * Heart disease risk assessment
   */
  async assessHeartDiseaseRisk(data: RiskAssessmentRequest): Promise<APIResponse<RiskAssessmentResponse>> {
    return this.request<RiskAssessmentResponse>({
      method: 'POST',
      url: '/ai/risk-assessment/heart-disease',
      data
    });
  }

  /**
   * Get risk assessment history
   */
  async getRiskHistory(patientId: string): Promise<APIResponse<RiskAssessmentResponse[]>> {
    return this.request<RiskAssessmentResponse[]>({
      method: 'GET',
      url: `/ai/risk-assessment/history/${patientId}`
    });
  }

  /**
   * Get risk dashboard overview
   */
  async getRiskDashboard(): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'GET',
      url: '/ai/dashboard/risk-overview'
    });
  }

  // =============================================================================
  // CONSENT ENGINE API
  // =============================================================================

  /**
   * Create consent contract
   */
  async createConsentContract(data: ConsentContractRequest): Promise<APIResponse<ConsentContract>> {
    return this.request<ConsentContract>({
      method: 'POST',
      url: '/consent/contracts',
      data
    });
  }

  /**
   * Get consent contracts
   */
  async getConsentContracts(params?: { status?: string; patientId?: string }): Promise<APIResponse<ConsentContract[]>> {
    return this.request<ConsentContract[]>({
      method: 'GET',
      url: '/consent/contracts',
      params
    });
  }

  /**
   * Update consent contract status
   */
  async updateConsentStatus(contractId: string, status: string, reason?: string): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'PATCH',
      url: `/consent/contracts/${contractId}/status`,
      data: { status, reason }
    });
  }

  /**
   * Execute smart contract
   */
  async executeSmartContract(contractId: string, action: string): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'POST',
      url: `/consent/contracts/${contractId}/execute`,
      data: { action }
    });
  }

  /**
   * Get contract audit logs
   */
  async getContractAudit(contractId: string): Promise<APIResponse<any[]>> {
    return this.request<any[]>({
      method: 'GET',
      url: `/consent/contracts/${contractId}/audit`
    });
  }

  /**
   * Get consent dashboard
   */
  async getConsentDashboard(): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'GET',
      url: '/consent/dashboard'
    });
  }

  // =============================================================================
  // ADMIN API
  // =============================================================================

  /**
   * Get all users (admin only)
   */
  async getUsers(params?: { page?: number; limit?: number; role?: string }): Promise<APIResponse<User[]>> {
    return this.request<User[]>({
      method: 'GET',
      url: '/admin/users',
      params
    });
  }

  /**
   * Create user (admin only)
   */
  async createUser(data: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<APIResponse<User>> {
    return this.request<User>({
      method: 'POST',
      url: '/admin/users',
      data
    });
  }

  /**
   * Update user (admin only)
   */
  async updateUser(id: string, data: Partial<User>): Promise<APIResponse<User>> {
    return this.request<User>({
      method: 'PUT',
      url: `/admin/users/${id}`,
      data
    });
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(id: string): Promise<APIResponse<null>> {
    return this.request<null>({
      method: 'DELETE',
      url: `/admin/users/${id}`
    });
  }

  /**
   * Get system health
   */
  async getSystemHealth(): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'GET',
      url: '/admin/system/health'
    });
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(params?: { page?: number; limit?: number; userId?: string; action?: string }): Promise<APIResponse<any[]>> {
    return this.request<any[]>({
      method: 'GET',
      url: '/admin/audit-logs',
      params
    });
  }

  // Document Management Methods
  /**
   * Create document
   */
  async createDocument(data: CreateDocumentRequest): Promise<APIResponse<MedicalDocument>> {
    return this.request<MedicalDocument>({
      method: 'POST',
      url: '/documents',
      data
    });
  }

  /**
   * Get document by ID
   */
  async getDocument(id: string): Promise<APIResponse<MedicalDocument>> {
    return this.request<MedicalDocument>({
      method: 'GET',
      url: `/documents/${id}`
    });
  }

  /**
   * Get patient documents
   */
  async getPatientDocuments(patientId: string): Promise<APIResponse<MedicalDocument[]>> {
    return this.request<MedicalDocument[]>({
      method: 'GET',
      url: `/medical/patients/${patientId}/documents`
    });
  }

  /**
   * Update document
   */
  async updateDocument(id: string, data: Partial<MedicalDocument>): Promise<APIResponse<MedicalDocument>> {
    return this.request<MedicalDocument>({
      method: 'PUT',
      url: `/documents/${id}`,
      data
    });
  }

  /**
   * Delete document
   */
  async deleteDocument(id: string): Promise<APIResponse<void>> {
    return this.request<void>({
      method: 'DELETE',
      url: `/documents/${id}`
    });
  }

  /**
   * Download document
   */
  async downloadDocument(id: string): Promise<Blob> {
    const response = await this.axiosInstance.get(`/documents/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Upload document
   */
  async uploadDocument(formData: FormData): Promise<APIResponse<MedicalDocument>> {
    return this.request<MedicalDocument>({
      method: 'POST',
      url: '/documents/upload',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  // =============================================================================
  // PATIENT PORTAL API
  // =============================================================================

  /**
   * Get patient medical records
   */
  async getPatientRecords(patientId: string): Promise<APIResponse<any[]>> {
    return this.request<any[]>({
      method: 'GET',
      url: `/patients/${patientId}/records`
    });
  }

  /**
   * Create patient medical record
   */
  async createPatientRecord(patientId: string, data: any): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'POST',
      url: `/patients/${patientId}/records`,
      data
    });
  }

  /**
   * Update patient medical record
   */
  async updatePatientRecord(patientId: string, recordId: string, data: any): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'PUT',
      url: `/patients/${patientId}/records/${recordId}`,
      data
    });
  }

  /**
   * Delete patient medical record
   */
  async deletePatientRecord(patientId: string, recordId: string): Promise<APIResponse<void>> {
    return this.request<void>({
      method: 'DELETE',
      url: `/patients/${patientId}/records/${recordId}`
    });
  }

  /**
   * Get patient lab results
   */
  async getPatientLabResults(patientId: string): Promise<APIResponse<any[]>> {
    return this.request<any[]>({
      method: 'GET',
      url: `/patients/${patientId}/lab-results`
    });
  }

  /**
   * Get specific lab result
   */
  async getPatientLabResult(patientId: string, resultId: string): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'GET',
      url: `/patients/${patientId}/lab-results/${resultId}`
    });
  }

  /**
   * Create patient lab result
   */
  async createPatientLabResult(patientId: string, data: any): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'POST',
      url: `/patients/${patientId}/lab-results`,
      data
    });
  }

  /**
   * Update patient lab result
   */
  async updatePatientLabResult(patientId: string, resultId: string, data: any): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'PUT',
      url: `/patients/${patientId}/lab-results/${resultId}`,
      data
    });
  }

  /**
   * Get patient medications
   */
  async getPatientMedications(patientId: string): Promise<APIResponse<any[]>> {
    return this.request<any[]>({
      method: 'GET',
      url: `/patients/${patientId}/medications`
    });
  }

  /**
   * Add patient medication
   */
  async addPatientMedication(patientId: string, data: any): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'POST',
      url: `/patients/${patientId}/medications`,
      data
    });
  }

  /**
   * Update patient medication
   */
  async updatePatientMedication(patientId: string, medId: string, data: any): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'PUT',
      url: `/patients/${patientId}/medications/${medId}`,
      data
    });
  }

  /**
   * Get patient documents
   */
  async getPatientDocuments(patientId: string): Promise<APIResponse<any[]>> {
    return this.request<any[]>({
      method: 'GET',
      url: `/patients/${patientId}/documents`
    });
  }

  /**
   * Upload patient document
   */
  async uploadPatientDocument(patientId: string, formData: FormData): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'POST',
      url: `/patients/${patientId}/documents`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  /**
   * Delete patient document
   */
  async deletePatientDocument(patientId: string, docId: string): Promise<APIResponse<void>> {
    return this.request<void>({
      method: 'DELETE',
      url: `/patients/${patientId}/documents/${docId}`
    });
  }

  /**
   * Download patient document
   */
  async downloadPatientDocument(patientId: string, docId: string): Promise<Blob> {
    const response = await this.axiosInstance.get(`/patients/${patientId}/documents/${docId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Get patient notifications
   */
  async getPatientNotifications(patientId: string): Promise<APIResponse<any[]>> {
    return this.request<any[]>({
      method: 'GET',
      url: `/patients/${patientId}/notifications`
    });
  }

  /**
   * Create patient notification
   */
  async createPatientNotification(patientId: string, data: any): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'POST',
      url: `/patients/${patientId}/notifications`,
      data
    });
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(patientId: string, notifId: string): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'PUT',
      url: `/patients/${patientId}/notifications/${notifId}/read`
    });
  }

  /**
   * Delete patient notification
   */
  async deletePatientNotification(patientId: string, notifId: string): Promise<APIResponse<void>> {
    return this.request<void>({
      method: 'DELETE',
      url: `/patients/${patientId}/notifications/${notifId}`
    });
  }

  /**
   * Get patient AI insights
   */
  async getPatientAIInsights(patientId: string): Promise<APIResponse<any[]>> {
    return this.request<any[]>({
      method: 'GET',
      url: `/patients/${patientId}/ai-insights`
    });
  }

  /**
   * Calculate patient AI insights
   */
  async calculatePatientAIInsights(patientId: string, data: any): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'POST',
      url: `/patients/${patientId}/ai-insights/calculate`,
      data
    });
  }

  /**
   * Get patient consent requests
   */
  async getPatientConsentRequests(patientId: string): Promise<APIResponse<any[]>> {
    return this.request<any[]>({
      method: 'GET',
      url: `/patients/${patientId}/consent-requests`
    });
  }

  /**
   * Create consent request
   */
  async createConsentRequest(patientId: string, data: any): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'POST',
      url: `/patients/${patientId}/consent-requests`,
      data
    });
  }

  /**
   * Update consent request
   */
  async updateConsentRequest(patientId: string, requestId: string, data: any): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'PUT',
      url: `/patients/${patientId}/consent-requests/${requestId}`,
      data
    });
  }

  /**
   * Respond to consent request
   */
  async respondToConsentRequest(patientId: string, requestId: string, data: any): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'POST',
      url: `/patients/${patientId}/consent-requests/${requestId}/respond`,
      data
    });
  }

  // =============================================================================
  // APPOINTMENT API
  // =============================================================================

  /**
   * Get patient appointments
   */
  async getPatientAppointments(patientId: string): Promise<APIResponse<Appointment[]>> {
    return this.request<Appointment[]>({
      method: 'GET',
      url: `/patients/${patientId}/appointments`
    });
  }

  /**
   * Get appointment by ID
   */
  async getAppointment(id: string): Promise<APIResponse<Appointment>> {
    return this.request<Appointment>({
      method: 'GET',
      url: `/appointments/${id}`
    });
  }

  /**
   * Create new appointment
   */
  async createAppointment(data: CreateAppointmentRequest): Promise<APIResponse<Appointment>> {
    return this.request<Appointment>({
      method: 'POST',
      url: '/appointments',
      data
    });
  }

  /**
   * Update appointment
   */
  async updateAppointment(id: string, data: Partial<Appointment>): Promise<APIResponse<Appointment>> {
    return this.request<Appointment>({
      method: 'PUT',
      url: `/appointments/${id}`,
      data
    });
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(id: string): Promise<APIResponse<void>> {
    return this.request<void>({
      method: 'DELETE',
      url: `/appointments/${id}`
    });
  }
}

// Export singleton instance
export const apiClient = new APIClient();
export default apiClient;
