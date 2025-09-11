import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { logger } from '@/lib/logger';

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
    resolve: (value?: unknown) => void;
    reject: (error?: unknown) => void;
  }> = [];

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

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
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();
        
        return config;
      },
      (error) => {
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
            
            if (refreshToken) {
              const response = await this.refreshToken({ refreshToken });
              
              if (response.data && !response.error) {
                const { accessToken } = response.data;
                
                this.setAccessToken(accessToken);
                
                // Process failed queue
                this.processQueue(null, accessToken);
                
                // Retry original request with new token
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                }
                return this.axiosInstance(originalRequest);
              } else {
                throw new Error('Token refresh failed');
              }
            } else {
              throw new Error('No refresh token');
            }
          } catch (refreshError) {
            logger.error('🔄 Token refresh failed:', refreshError);
            this.processQueue(refreshError, null);
            this.clearTokens();
            // Show user-friendly message
            if (typeof window !== 'undefined') {
              // Dispatch custom event for token expiry
              window.dispatchEvent(new CustomEvent('tokenExpired', {
                detail: {
                  message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
                  statusCode: 401
                }
              }));
              // Redirect to login after a short delay
              setTimeout(() => {
                window.location.href = '/login';
              }, 1000);
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
  private processQueue(error: unknown, token: string | null): void {
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
      const responseData = error.response.data as { message?: string; code?: string; details?: unknown; errors?: unknown };
      
      // Handle specific status codes
      switch (error.response.status) {
        case 401:
          // Dispatch custom event for token expiry
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('tokenExpired', {
              detail: {
                message: responseData?.message || 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
                statusCode: 401
              }
            }));
          }
          break;
        case 403:
          // Forbidden - insufficient permissions
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('accessDenied', {
              detail: {
                message: responseData?.message || 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้',
                statusCode: 403
              }
            }));
          }
          break;
        case 404:
          // Not found
          logger.warn('Resource not found', { url: error.config?.url, status: 404 });
          break;
        case 429:
          // Rate limited
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('rateLimited', {
              detail: {
                message: 'คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่',
                statusCode: 429
              }
            }));
          }
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          // Server errors
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('serverError', {
              detail: {
                message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง',
                statusCode: error.response.status
              }
            }));
          }
          break;
      }
      
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
    logger.debug('🔍 getAccessToken - rememberMe preference:', isRemembered);
    let token = null;
    
    if (isRemembered) {
      // If user chose to be remembered, check localStorage first, then cookie
      try {
        token = localStorage.getItem(TOKEN_KEY);
        logger.debug('🔒 Checking localStorage for token:', !!token);
        if (!token) {
          token = Cookies.get(TOKEN_KEY);
          logger.debug('🍪 Checking cookie for token:', !!token);
        }
        logger.debug('🔒 Token retrieved from persistent storage (remembered):', !!token);
      } catch (error) {
        logger.error('❌ Persistent storage retrieval failed:', error);
      }
    } else {
      // If user didn't choose to be remembered, check sessionStorage first
      try {
        token = sessionStorage.getItem(TOKEN_KEY);
        logger.debug('🔓 Checking sessionStorage for token:', !!token);
        if (!token) {
          // Fallback to cookie or localStorage (migration case)
          token = Cookies.get(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
          logger.debug('🍪 Checking cookie/localStorage fallback for token:', !!token);
        }
        logger.debug('🔓 Token retrieved from session storage (not remembered):', !!token);
      } catch (error) {
        logger.error('❌ Session storage retrieval failed:', error);
      }
    }
    
    // Debug: Log all storage types
    logger.debug('🔍 Debug - Storage check:');
    logger.debug('  - localStorage token:', !!localStorage.getItem(TOKEN_KEY));
    logger.debug('  - sessionStorage token:', !!sessionStorage.getItem(TOKEN_KEY));
    logger.debug('  - cookie token:', !!Cookies.get(TOKEN_KEY));
    logger.debug('  - rememberMe:', localStorage.getItem('rememberMe'));
    
    // Validate token format (basic check)
    if (token && !token.startsWith('eyJ')) {
      logger.warn('⚠️ Invalid token format detected, clearing...');
      this.clearTokens();
      return null;
    }
    
    // Check if token is expired (basic JWT check)
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < currentTime) {
          logger.warn('⚠️ Token expired, clearing...');
          this.clearTokens();
          return null;
        }
      } catch (error) {
        logger.warn('⚠️ Token validation failed, clearing...');
        this.clearTokens();
        return null;
      }
    }
    
    return token || null;
  }

  public setAccessToken(token: string): void {
    if (typeof window === 'undefined') return;
    logger.debug('🔑 Setting access token:', token.substring(0, 30) + '...');
    
    // Check remember me preference to determine storage type
    const isRemembered = localStorage.getItem('rememberMe') === 'true';
    logger.debug('🔍 rememberMe preference:', isRemembered);
    
    if (isRemembered) {
      // If user chose to be remembered, store in localStorage and cookie
      logger.debug('🔒 Storing token in persistent storage (remembered)');
      
      // Store in localStorage
      try {
        localStorage.setItem(TOKEN_KEY, token);
        logger.debug('💾 Token stored in localStorage');
        
        // Verify storage
        const verifyToken = localStorage.getItem(TOKEN_KEY);
        logger.debug('✅ localStorage verification:', !!verifyToken);
      } catch (error) {
        logger.error('❌ LocalStorage storage failed:', error);
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
        logger.debug('🍪 Token stored in cookie (backup)');
      } catch (error) {
        logger.error('❌ Cookie storage failed:', error);
      }
    } else {
      // If user didn't choose to be remembered, store in sessionStorage only
      logger.debug('🔓 Storing token in session storage (not remembered)');
      
      try {
        sessionStorage.setItem(TOKEN_KEY, token);
        logger.debug('💾 Token stored in sessionStorage');
        
        // Verify storage
        const verifyToken = sessionStorage.getItem(TOKEN_KEY);
        logger.debug('✅ sessionStorage verification:', !!verifyToken);
      } catch (error) {
        logger.error('❌ SessionStorage storage failed:', error);
        // Fallback to cookie with session expiry
        try {
          Cookies.set(TOKEN_KEY, token, { path: '/' }); // No expires = session cookie
          logger.debug('🍪 Token stored in session cookie (fallback)');
        } catch (cookieError) {
          logger.error('❌ Cookie fallback failed:', cookieError);
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
        logger.error('❌ Persistent refresh token retrieval failed:', error);
      }
    } else {
      // If user didn't choose to be remembered, check sessionStorage first
      try {
        token = sessionStorage.getItem(REFRESH_TOKEN_KEY);
        if (!token) {
          token = Cookies.get(REFRESH_TOKEN_KEY);
        }
      } catch (error) {
        logger.error('❌ Session refresh token retrieval failed:', error);
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
        logger.debug('💾 Refresh token stored in localStorage');
      } catch (error) {
        logger.error('❌ LocalStorage refresh token storage failed:', error);
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
        logger.debug('🍪 Refresh token stored in cookie (backup)');
      } catch (error) {
        logger.error('❌ Cookie refresh token storage failed:', error);
      }
    } else {
      // If user didn't choose to be remembered, store in sessionStorage only
      try {
        sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
        logger.debug('💾 Refresh token stored in sessionStorage');
      } catch (error) {
        logger.error('❌ SessionStorage refresh token storage failed:', error);
        // Fallback to cookie with session expiry
        try {
          Cookies.set(REFRESH_TOKEN_KEY, token, { path: '/' }); // No expires = session cookie
          logger.debug('🍪 Refresh token stored in session cookie (fallback)');
        } catch (cookieError) {
          logger.error('❌ Cookie refresh token fallback failed:', cookieError);
        }
      }
    }
  }

  public clearTokens(): void {
    if (typeof window === 'undefined') return;
    
    logger.debug('🧹 Clearing all tokens and session data...');
    
    // Clear cookies with all possible configurations
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
    Cookies.remove(TOKEN_KEY, { path: '/' });
    Cookies.remove(REFRESH_TOKEN_KEY, { path: '/' });
    Cookies.remove(TOKEN_KEY, { path: '/', domain: window.location.hostname });
    Cookies.remove(REFRESH_TOKEN_KEY, { path: '/', domain: window.location.hostname });
    
    // Clear localStorage fallback
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('user');
      logger.debug('💾 Tokens cleared from localStorage');
    } catch (error) {
      logger.error('❌ LocalStorage cleanup failed:', error);
    }
    
    // Clear sessionStorage as well
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      sessionStorage.removeItem('user');
      logger.debug('💾 Tokens cleared from sessionStorage');
    } catch (error) {
      logger.error('❌ SessionStorage cleanup failed:', error);
    }
    
    // Clear any other auth-related data
    try {
      // Clear all possible auth-related keys
      const authKeys = ['user', 'auth', 'session', 'login', 'profile'];
      authKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      logger.debug('🧹 User data cleared from storage');
    } catch (error) {
      logger.error('❌ User data cleanup failed:', error);
    }
    
    // Force reload to clear any cached state
    if (typeof window !== 'undefined') {
      logger.debug('🔄 Forcing page reload to clear cached state...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
    
    logger.debug('✅ All tokens and session data cleared');
  }

  public setAuthTokens(accessToken: string, refreshToken: string): void {
    logger.debug('🔑 Setting auth tokens...');
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
    logger.debug('🔑 Auth tokens set complete');
  }

  /**
   * Generic request method
   */
  private async request<T>(config: AxiosRequestConfig): Promise<APIResponse<T>> {
    try {
      logger.debug('🌐 Making API request:', {
        method: config.method,
        url: config.url,
        baseURL: this.axiosInstance.defaults.baseURL,
        fullURL: `${this.axiosInstance.defaults.baseURL}${config.url}`
      });
      
      const response: AxiosResponse<APIResponse<T>> = await this.axiosInstance(config);
      logger.debug('✅ API response received:', response.status, response.data);
      
      // Transform backend response to frontend format
      const transformedResponse: APIResponse<T> = {
        data: response.data.data,
        meta: response.data.meta,
        error: response.data.error,
        statusCode: response.data.statusCode
      };
      
      return transformedResponse;
    } catch (error: any) {
      // Don't log 404 errors for notifications as they are expected for users not yet registered in EMR
      if (error?.response?.status === 404 && config.url?.includes('/notifications')) {
        logger.debug('🔍 Expected 404 for notifications (user not registered in EMR):', config.url);
      } else {
        logger.error('💥 API request failed:', error);
      }
      throw error; // Will be handled by interceptor
    }
  }

  /**
   * Generic POST method
   */
  public async post<T>(url: string, data?: unknown): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data
    });
  }

  /**
   * Generic GET method
   */
  public async get<T>(url: string, params?: unknown): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url,
      params
    });
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
    logger.debug('🆕 Attempting registration with:', { ...data, password: '[HIDDEN]' });
    
    const response = await this.request<AuthResponse>({
      method: 'POST',
      url: '/auth/register',
      data
    });
    
    logger.debug('📥 Registration response:', response);
    
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
    return this.request<{ message: string }>({
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
    logger.debug('📱 getProfile called');
    try {
      const response = await this.request<User>({
        method: 'GET',
        url: '/auth/profile'
      });
      logger.debug('✅ getProfile success:', response);
      return response;
    } catch (error) {
      logger.error('❌ getProfile error:', error);
      throw error;
    }
  }

  /**
   * Get doctor profile
   */
  async getDoctorProfile(): Promise<APIResponse<User>> {
    logger.debug('👨‍⚕️ getDoctorProfile called');
    try {
      const response = await this.request<User>({
        method: 'GET',
        url: '/auth/profile/doctor'
      });
      logger.debug('✅ getDoctorProfile success:', response);
      return response;
    } catch (error) {
      logger.error('❌ getDoctorProfile error:', error);
      throw error;
    }
  }

  /**
   * Get nurse profile
   */
  async getNurseProfile(): Promise<APIResponse<User>> {
    logger.debug('👩‍⚕️ getNurseProfile called');
    try {
      const response = await this.request<User>({
        method: 'GET',
        url: '/auth/profile/nurse'
      });
      logger.debug('✅ getNurseProfile success:', response);
      return response;
    } catch (error) {
      logger.error('❌ getNurseProfile error:', error);
      throw error;
    }
  }

  /**
   * Validate password strength
   */
  async validatePasswordStrength(password: string): Promise<APIResponse<{ isValid: boolean; score: number; feedback: string[] }>> {
    logger.debug('🔒 validatePasswordStrength called');
    try {
      const response = await this.request<{ isValid: boolean; score: number; feedback: string[] }>({
        method: 'POST',
        url: '/auth/validate-password',
        data: { password }
      });
      logger.debug('✅ validatePasswordStrength success:', response);
      return response;
    } catch (error) {
      logger.error('❌ validatePasswordStrength error:', error);
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
   * Complete profile setup
   */
  async completeProfileSetup(): Promise<APIResponse<User>> {
    return this.request<User>({
      method: 'POST',
      url: '/auth/complete-profile-setup',
      data: {}
    });
  }

  /**
   * Get complete profile
   */
  async getCompleteProfile(): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'GET',
      url: '/auth/profile/complete'
    });
  }

  /**
   * Update complete profile
   */
  async updateCompleteProfile(data: any): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'PUT',
      url: '/auth/profile/complete',
      data
    });
  }

  /**
   * Delete profile field
   */
  async deleteProfileField(fieldName: string): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'DELETE',
      url: `/auth/profile/field/${fieldName}`
    });
  }

  /**
   * Upload profile image
   */
  async uploadProfileImage(imageUrl: string): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'POST',
      url: '/auth/profile/image',
      data: { imageUrl }
    });
  }

  /**
   * Get profile completion status
   */
  async getProfileCompletion(): Promise<APIResponse<any>> {
    return this.request<any>({
      method: 'GET',
      url: '/auth/profile/completion'
    });
  }

  /**
   * Update doctor profile
   */
  async updateDoctorProfile(data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    hospital?: string;
    department?: string;
    specialty?: string;
    medical_license?: string;
    experience_years?: string;
    education?: string;
    bio?: string;
    position?: string;
    professional_license?: string;
  }): Promise<APIResponse<User>> {
    return this.request<User>({
      method: 'PUT',
      url: '/profile/doctor',
      data
    });
  }

  /**
   * Update nurse profile
   */
  async updateNurseProfile(data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    hospital?: string;
    department?: string;
    ward?: string;
    nursing_license?: string;
    experience_years?: string;
    education?: string;
    certifications?: string;
    shift?: string;
    bio?: string;
    position?: string;
    professional_license?: string;
  }): Promise<APIResponse<User>> {
    return this.request<User>({
      method: 'PUT',
      url: '/profile/nurse',
      data
    });
  }

  /**
   * Change user password
   */
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'PUT',
      url: '/auth/change-password',
      data
    });
  }

  /**
   * Get user security settings
   */
  async getSecuritySettings(): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'GET',
      url: '/security/settings'
    });
  }

  /**
   * Update user security settings
   */
  async updateSecuritySettings(data: {
    twoFactorEnabled?: boolean;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    loginAlerts?: boolean;
    sessionTimeout?: number;
    requirePasswordChange?: boolean;
    passwordChangeInterval?: number;
    deviceTrust?: boolean;
    locationTracking?: boolean;
  }): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'PUT',
      url: '/security/settings',
      data
    });
  }

  /**
   * Get user login sessions
   */
  async getUserSessions(): Promise<APIResponse<unknown[]>> {
    return this.request<unknown[]>({
      method: 'GET',
      url: '/security/sessions'
    });
  }

  /**
   * Terminate user session
   */
  async terminateSession(sessionId: string): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'DELETE',
      url: `/security/sessions/${sessionId}`
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
  // EXTERNAL REQUESTERS API
  // =============================================================================

  /**
   * External requester login
   */
  async externalLogin(data: LoginRequest): Promise<APIResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>({
      method: 'POST',
      url: '/external-requesters/login',
      data
    });
    
    if (response.data && !response.error) {
      this.setAuthTokens(response.data.accessToken, response.data.refreshToken);
    }
    
    return response;
  }

  /**
   * External requester register
   */
  async externalRegister(data: RegisterRequest): Promise<APIResponse<AuthResponse>> {
    return this.request<AuthResponse>({
      method: 'POST',
      url: '/external-requesters/register',
      data
    });
  }

  /**
   * Login external requester (alias for compatibility)
   */
  async loginExternalRequester(data: LoginRequest): Promise<APIResponse<AuthResponse>> {
    return this.externalLogin(data);
  }

  /**
   * Register external requester (alias for compatibility)
   */
  async registerExternalRequester(data: unknown): Promise<APIResponse<AuthResponse>> {
    return this.request<AuthResponse>({
      method: 'POST',
      url: '/external-requesters/register',
      data
    });
  }

  /**
   * External requester logout
   */
  async externalLogout(): Promise<APIResponse<null>> {
    const refreshToken = this.getRefreshToken();
    
    try {
      const response = await this.request<null>({
        method: 'POST',
        url: '/external-requesters/logout',
        data: { refreshToken }
      });
      
      this.clearTokens();
      return response;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Get external requester dashboard
   */
  async getExternalRequestersDashboardOverview(): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'GET',
      url: '/external-requesters/dashboard'
    });
  }

  /**
   * Get all data requests for external requester
   */
  async getAllDataRequests(): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'GET',
      url: '/external-requesters/requests'
    });
  }

  /**
   * Create new data request
   */
  async createDataRequest(data: unknown): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'POST',
      url: '/external-requesters/requests',
      data
    });
  }

  /**
   * Get data request by ID
   */
  async getDataRequestById(requestId: string): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'GET',
      url: `/external-requesters/requests/${requestId}`
    });
  }

  /**
   * Generate data request report
   */
  async generateDataRequestReport(requestId: string): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'POST',
      url: `/external-requesters/requests/${requestId}/report`
    });
  }

  /**
   * Get external requester profile
   */
  async getExternalRequesterProfile(): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'GET',
      url: '/external-requesters/profile'
    });
  }

  /**
   * Update external requester profile
   */
  async updateExternalRequesterProfile(data: unknown): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'PUT',
      url: '/external-requesters/profile',
      data
    });
  }

  /**
   * Get external requester notifications
   */
  async getExternalRequesterNotifications(params?: { page?: number; limit?: number }): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'GET',
      url: '/external-requesters/notifications',
      params
    });
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'PUT',
      url: `/external-requesters/notifications/${notificationId}/read`
    });
  }

  /**
   * Search patients for external requesters
   */
  async searchPatients(query: unknown): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'GET',
      url: '/external-requesters/search',
      params: { query }
    });
  }

  /**
   * Search patients for request (alias for compatibility)
   */
  async searchPatientsForRequest(params: unknown): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'GET',
      url: '/external-requesters/search',
      params
    });
  }

  /**
   * Get external requester settings
   */
  async getExternalRequesterSettings(): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'GET',
      url: '/external-requesters/settings'
    });
  }

  /**
   * Update external requester settings
   */
  async updateExternalRequesterSettings(data: unknown): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'PUT',
      url: '/external-requesters/settings',
      data
    });
  }

  /**
   * Get password requirements
   */
  async getPasswordRequirements(): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'GET',
      url: '/auth/password-requirements'
    });
  }

  /**
   * Get patient consent requests
   */
  async getPatientConsentRequests(userId: string): Promise<APIResponse<unknown[]>> {
    return this.request<unknown[]>({
      method: 'GET',
      url: `/patients/${userId}/consent-requests`
    });
  }

  /**
   * Respond to consent request
   */
  async respondToConsentRequest(userId: string, requestId: string, data: { decision: string; reason?: string }): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'POST',
      url: `/patients/${userId}/consent-requests/${requestId}/respond`,
      data
    });
  }

  /**
   * Get patient lab results
   */
  async getPatientLabResults(userId: string): Promise<APIResponse<unknown[]>> {
    return this.request<unknown[]>({
      method: 'GET',
      url: `/patients/${userId}/lab-results`
    });
  }

  /**
   * Terminate all sessions
   */
  async terminateAllSessions(): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'POST',
      url: '/auth/terminate-all-sessions'
    });
  }

  // =============================================================================
  // MEDICAL RECORDS API
  // =============================================================================

  /**
   * Get patients list
   */
  async getPatients(params?: { page?: number; limit?: number; search?: string; hn?: string; queue?: string }): Promise<APIResponse<MedicalPatient[]>> {
    return this.request<MedicalPatient[]>({
      method: 'GET',
      url: '/medical/patients',
      params
    });
  }

  /**
   * Search users by national ID
   */
  async searchUsersByNationalId(nationalId: string): Promise<APIResponse<any[]>> {
    return this.request<any[]>({
      method: 'GET',
      url: '/medical/users/search',
      params: { national_id: nationalId }
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
  // PATIENT PORTAL API
  // =============================================================================

  /**
   * Get patient AI insights
   */
  async getPatientAIInsights(patientId: string): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'GET',
      url: `/patients/${patientId}/ai-insights`
    });
  }

  /**
   * Get patient notifications
   */
  async getPatientNotifications(patientId: string): Promise<APIResponse<unknown[]>> {
    return this.request<unknown[]>({
      method: 'GET',
      url: `/medical/patients/${patientId}/notifications`
    });
  }

  /**
   * Get patient medications
   */
  async getPatientMedications(patientId: string): Promise<APIResponse<unknown[]>> {
    return this.request<unknown[]>({
      method: 'GET',
      url: `/patients/${patientId}/medications`
    });
  }

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
   * Get available time slots
   */
  async getAvailableTimeSlots(doctorId: string, date: string, typeId: string): Promise<APIResponse<unknown[]>> {
    return this.request<unknown[]>({
      method: 'GET',
      url: `/appointments/available-slots/${doctorId}/${date}/${typeId}`
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
  async createLabResult(labOrderId: string, data: Record<string, unknown>): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'POST',
      url: '/medical/lab-results',
      data: { labOrderId, ...data }
    });
  }

  /**
   * Get lab results
   */
  async getLabResults(labOrderId: string): Promise<APIResponse<unknown[]>> {
    return this.request<unknown[]>({
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
  async updatePrescriptionItem(id: string, data: unknown): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
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
   * Get prescriptions by patient
   */
  async getPrescriptionsByPatient(patientId: string): Promise<APIResponse<MedicalPrescription[]>> {
    return this.request<MedicalPrescription[]>({
      method: 'GET',
      url: `/medical/patients/${patientId}/prescriptions`
    });
  }

  // =============================================================================
  // DOCUMENT MANAGEMENT API
  // =============================================================================

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
  // AI & RISK ASSESSMENT API
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
  async getRiskDashboard(): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
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
  async updateConsentStatus(contractId: string, status: string, reason?: string): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'PATCH',
      url: `/consent/contracts/${contractId}/status`,
      data: { status, reason }
    });
  }

  /**
   * Get consent dashboard
   */
  async getConsentDashboard(): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'GET',
      url: '/consent/dashboard'
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
  // ADMIN API
  // =============================================================================

  /**
   * Get admin login
   */
  async adminLogin(data: LoginRequest): Promise<APIResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>({
      method: 'POST',
      url: '/admin/login',
      data
    });
    
    if (response.data && !response.error) {
      this.setAuthTokens(response.data.accessToken, response.data.refreshToken);
    }
    
    return response;
  }

  /**
   * Admin logout
   */
  async adminLogout(): Promise<APIResponse<null>> {
    const refreshToken = this.getRefreshToken();
    
    try {
      const response = await this.request<null>({
        method: 'POST',
        url: '/admin/logout',
        data: { refreshToken }
      });
      
      this.clearTokens();
      return response;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

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
  async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<APIResponse<User>> {
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
  async getSystemHealth(): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'GET',
      url: '/admin/system/health'
    });
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(params?: { page?: number; limit?: number; userId?: string; action?: string }): Promise<APIResponse<unknown[]>> {
    return this.request<unknown[]>({
      method: 'GET',
      url: '/admin/audit-logs',
      params
    });
  }

  /**
   * Get database status
   */
  async getDatabaseStatus(): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'GET',
      url: '/admin/database/status'
    });
  }

  /**
   * Create database backup
   */
  async createDatabaseBackup(data: { type: string; description?: string }): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'POST',
      url: '/admin/database/backup',
      data
    });
  }

  /**
   * Optimize database
   */
  async optimizeDatabase(data: { tables?: string[] }): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'POST',
      url: '/admin/database/optimize',
      data
    });
  }

  /**
   * Get external requesters (admin)
   */
  async getExternalRequesters(): Promise<APIResponse<unknown[]>> {
    return this.request<unknown[]>({
      method: 'GET',
      url: '/admin/external-requesters'
    });
  }

  /**
   * Update external requester status
   */
  async updateExternalRequesterStatus(requesterId: string, data: { status: string }): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'PUT',
      url: `/admin/external-requesters/${requesterId}/status`,
      data
    });
  }

  /**
   * Get consent requests
   */
  async getConsentRequests(): Promise<APIResponse<unknown[]>> {
    return this.request<unknown[]>({
      method: 'GET',
      url: '/consent/requests'
    });
  }

  /**
   * Complete prescription
   */
  async completePrescription(prescriptionId: string, data: { dispensedBy: string; notes?: string }): Promise<APIResponse<unknown>> {
    return this.request<unknown>({
      method: 'POST',
      url: `/prescriptions/${prescriptionId}/complete`,
      data
    });
  }
}

// Export singleton instance
export const apiClient = new APIClient();
export default apiClient;