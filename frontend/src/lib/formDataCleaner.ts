/**
 * Form Data Cleaner
 * จัดการการล้างข้อมูลฟอร์มและ cache
 */

class FormDataCleaner {
  private static readonly FORM_DATA_KEYS = [
    'loginForm',
    'registerForm',
    'patientForm',
    'visitForm',
    'vitalSignsForm',
    'labOrderForm',
    'prescriptionForm',
    'appointmentForm',
    'profileForm',
    'setupProfileForm'
  ];

  private static readonly CACHE_KEYS = [
    'patients_cache',
    'visits_cache',
    'appointments_cache',
    'lab_results_cache',
    'prescriptions_cache',
    'user_profile_cache'
  ];

  /**
   * Clear all form data
   */
  public static clearAllFormData(): void {
    try {
      if (typeof window === 'undefined') return;

      // Clear form data from localStorage
      this.FORM_DATA_KEYS.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      // Clear form data from sessionStorage
      this.CACHE_KEYS.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      console.log('✅ All form data cleared');
    } catch (error) {
      console.error('❌ Error clearing form data:', error);
    }
  }

  /**
   * Clear specific form data
   */
  public static clearFormData(formKey: string): void {
    try {
      if (typeof window === 'undefined') return;

      localStorage.removeItem(formKey);
      sessionStorage.removeItem(formKey);
      
      console.log(`✅ Form data cleared: ${formKey}`);
    } catch (error) {
      console.error(`❌ Error clearing form data for ${formKey}:`, error);
    }
  }

  /**
   * Save form data
   */
  public static saveFormData(formKey: string, data: any): void {
    try {
      if (typeof window === 'undefined') return;

      const formData = {
        data,
        timestamp: Date.now()
      };

      sessionStorage.setItem(formKey, JSON.stringify(formData));
    } catch (error) {
      console.error(`❌ Error saving form data for ${formKey}:`, error);
    }
  }

  /**
   * Load form data
   */
  public static loadFormData(formKey: string): any | null {
    try {
      if (typeof window === 'undefined') return null;

      const formDataStr = sessionStorage.getItem(formKey);
      if (!formDataStr) return null;

      const formData = JSON.parse(formDataStr);
      
      // Check if data is older than 1 hour
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - formData.timestamp > oneHour) {
        this.clearFormData(formKey);
        return null;
      }

      return formData.data;
    } catch (error) {
      console.error(`❌ Error loading form data for ${formKey}:`, error);
      return null;
    }
  }

  /**
   * Clear all cache data
   */
  public static clearAllCache(): void {
    try {
      if (typeof window === 'undefined') return;

      this.CACHE_KEYS.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      console.log('✅ All cache data cleared');
    } catch (error) {
      console.error('❌ Error clearing cache data:', error);
    }
  }

  /**
   * Clear expired cache
   */
  public static clearExpiredCache(): void {
    try {
      if (typeof window === 'undefined') return;

      const allKeys = [...this.FORM_DATA_KEYS, ...this.CACHE_KEYS];
      const oneHour = 60 * 60 * 1000;

      allKeys.forEach(key => {
        const dataStr = sessionStorage.getItem(key) || localStorage.getItem(key);
        if (dataStr) {
          try {
            const data = JSON.parse(dataStr);
            if (data.timestamp && Date.now() - data.timestamp > oneHour) {
              localStorage.removeItem(key);
              sessionStorage.removeItem(key);
              console.log(`🗑️ Expired cache cleared: ${key}`);
            }
          } catch (error) {
            // If parsing fails, remove the item
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error('❌ Error clearing expired cache:', error);
    }
  }

  /**
   * Disable autofill for form inputs
   */
  public static disableAutofill(formKey?: string): void {
    try {
      if (typeof window === 'undefined') return;

      // Add autocomplete="off" to all form inputs
      const inputs = document.querySelectorAll('input, textarea, select');
      inputs.forEach((input: any) => {
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocorrect', 'off');
        input.setAttribute('autocapitalize', 'off');
        input.setAttribute('spellcheck', 'false');
      });

      // Add autocomplete="off" to all forms
      const forms = document.querySelectorAll('form');
      forms.forEach((form: any) => {
        form.setAttribute('autocomplete', 'off');
      });

      console.log(`✅ Autofill disabled for ${formKey || 'all form elements'}`);
    } catch (error) {
      console.error('❌ Error disabling autofill:', error);
    }
  }

  /**
   * Reset form inputs
   */
  public static resetFormInputs(formKey?: string): void {
    try {
      if (typeof window === 'undefined') return;

      // Clear all form inputs
      const inputs = document.querySelectorAll('input, textarea, select');
      inputs.forEach((input: any) => {
        if (input.type === 'checkbox' || input.type === 'radio') {
          input.checked = false;
        } else {
          input.value = '';
        }
      });

      console.log(`✅ Form inputs reset for ${formKey || 'all forms'}`);
    } catch (error) {
      console.error('❌ Error resetting form inputs:', error);
    }
  }

  /**
   * Get storage usage info
   */
  public static getStorageInfo(): {
    localStorage: { used: number; available: number };
    sessionStorage: { used: number; available: number };
  } {
    try {
      if (typeof window === 'undefined') {
        return {
          localStorage: { used: 0, available: 0 },
          sessionStorage: { used: 0, available: 0 }
        };
      }

      const localStorageUsed = JSON.stringify(localStorage).length;
      const sessionStorageUsed = JSON.stringify(sessionStorage).length;

      // Estimate available space (most browsers have ~5-10MB limit)
      const estimatedLimit = 5 * 1024 * 1024; // 5MB

      return {
        localStorage: {
          used: localStorageUsed,
          available: estimatedLimit - localStorageUsed
        },
        sessionStorage: {
          used: sessionStorageUsed,
          available: estimatedLimit - sessionStorageUsed
        }
      };
    } catch (error) {
      console.error('❌ Error getting storage info:', error);
      return {
        localStorage: { used: 0, available: 0 },
        sessionStorage: { used: 0, available: 0 }
      };
    }
  }
}

export default FormDataCleaner;