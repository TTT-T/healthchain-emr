import { useAuth as useAuthContext } from '@/contexts/AuthContext';

// Re-export useAuth for convenience
export { useAuth } from '@/contexts/AuthContext';

/**
 * Custom hook for authentication
 */
export const useAuthHook = () => {
  return useAuthContext();
};

/**
 * Hook to check if user has specific role
 */
export const useRole = (allowedRoles: string | string[]) => {
  const { user, isAuthenticated } = useAuthContext();
  
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const hasRole = user ? roles.includes(user.role) : false;
  
  return {
    hasRole: isAuthenticated && hasRole,
    userRole: user?.role,
    isAuthenticated,
  };
};

/**
 * Hook for medical staff only
 */
export const useMedicalStaff = () => {
  return useRole(['admin', 'doctor', 'nurse', 'pharmacist', 'lab_tech', 'staff']);
};

/**
 * Hook for admin only
 */
export const useAdmin = () => {
  return useRole('admin');
};

/**
 * Hook for patient only
 */
export const usePatient = () => {
  return useRole('patient');
};

/**
 * Hook for external users
 */
export const useExternalUser = () => {
  return useRole(['external_user', 'external_admin']);
};
