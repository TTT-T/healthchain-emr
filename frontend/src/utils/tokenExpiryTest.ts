/**
 * Utility functions for ing token expiry functionality
 */

/**
 * Simulate token expiry by dispatching the tokenExpired event
 */
export function simulateTokenExpiry(message?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tokenExpired', {
      detail: {
        message: message || 'ทดสอบ: เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
        statusCode: 401
      }
    }));
  }
}

/**
 * Clear all authentication data (for ing)
 */
export function clearAllAuthData() {
  // Clear localStorage
  localStorage.clear();
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Clear cookies
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
}

/**
 * Add a  button to the page (for development only)
 */
export function addTokenExpiryButton() {
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') {
    return;
  }

  // Check if button already exists
  if (document.getElementById('token-expiry--btn')) {
    return;
  }

  const button = document.createElement('button');
  button.id = 'token-expiry--btn';
  button.textContent = '🧪  Token Expiry';
  button.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 9999;
    background: #ef4444;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  `;
  
  button.addEventListener('click', () => {
    simulateTokenExpiry('ทดสอบ: เซสชันหมดอายุ (Development Mode)');
  });
  
  document.body.appendChild(button);
}
