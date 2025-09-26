/**
 * Session Manager
 * จัดการ session และ token storage
 */
import { logger } from '@/lib/logger';

interface SessionData {
  accessToken: string;
  refreshToken: string;
  user: unknown;
  expiresAt: number;
}

class SessionManager {
  private static instance: SessionManager;
  private sessionData: SessionData | null = null;
  private readonly STORAGE_KEY = 'emr_session';
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user';

  private constructor() {
    this.loadSession();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Load session from storage
   */
  private loadSession(): void {
    try {
      if (typeof window === 'undefined') return;

      const sessionStr = localStorage.getItem(this.STORAGE_KEY);
      if (sessionStr) {
        this.sessionData = JSON.parse(sessionStr);
        
        // Check if session is expired
        if (this.sessionData && this.sessionData.expiresAt < Date.now()) {
          this.clearSession();
        }
      }
    } catch (error) {
      logger.error('Error loading session:', error);
      this.clearSession();
    }
  }

  /**
   * Save session to storage
   */
  private saveSession(): void {
    try {
      if (typeof window === 'undefined' || !this.sessionData) return;

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.sessionData));
    } catch (error) {
      logger.error('Error saving session:', error);
    }
  }

  /**
   * Set session data
   */
  public setSession(data: {
    accessToken: string;
    refreshToken: string;
    user: unknown;
    expiresIn?: number;
  }): void {
    const expiresAt = Date.now() + (data.expiresIn || 3600) * 1000;
    
    this.sessionData = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
      expiresAt
    };

    this.saveSession();
  }

  /**
   * Get access token
   */
  public getAccessToken(): string | null {
    return this.sessionData?.accessToken || null;
  }

  /**
   * Get refresh token
   */
  public getRefreshToken(): string | null {
    return this.sessionData?.refreshToken || null;
  }

  /**
   * Get user data
   */
  public getUser(): unknown | null {
    return this.sessionData?.user || null;
  }

  /**
   * Check if session is valid
   */
  public isSessionValid(): boolean {
    if (!this.sessionData) return false;
    
    // Check if token is expired (with 5 minute buffer)
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    return this.sessionData.expiresAt > (Date.now() + bufferTime);
  }

  /**
   * Update access token
   */
  public updateAccessToken(accessToken: string, expiresIn?: number): void {
    if (!this.sessionData) return;

    this.sessionData.accessToken = accessToken;
    if (expiresIn) {
      this.sessionData.expiresAt = Date.now() + expiresIn * 1000;
    }

    this.saveSession();
  }

  /**
   * Clear session
   */
  public clearSession(): void {
    this.sessionData = null;
    
    try {
      if (typeof window === 'undefined') return;

      // Clear all auth-related storage
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      
      // Clear session storage as well
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(this.USER_KEY);

      // Dispatch session cleared event
      window.dispatchEvent(new CustomEvent('sessionCleared'));
    } catch (error) {
      logger.error('Error clearing session:', error);
    }
  }

  /**
   * Get session info
   */
  public getSessionInfo(): {
    isValid: boolean;
    expiresAt: number | null;
    timeRemaining: number | null;
  } {
    if (!this.sessionData) {
      return {
        isValid: false,
        expiresAt: null,
        timeRemaining: null
      };
    }

    const timeRemaining = this.sessionData.expiresAt - Date.now();
    
    return {
      isValid: this.isSessionValid(),
      expiresAt: this.sessionData.expiresAt,
      timeRemaining: timeRemaining > 0 ? timeRemaining : 0
    };
  }

  /**
   * Refresh session if needed
   */
  public async refreshSessionIfNeeded(): Promise<boolean> {
    if (this.isSessionValid()) {
      return true;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearSession();
      return false;
    }

    try {
      // This would typically call your API to refresh the token
      // For now, we'll just clear the session
      logger.warn('Session expired, clearing...');
      this.clearSession();
      return false;
    } catch (error) {
      logger.error('Error refreshing session:', error);
      this.clearSession();
      return false;
    }
  }
}

export default SessionManager;