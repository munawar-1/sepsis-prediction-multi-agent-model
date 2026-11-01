/**
 * Authentication & Clinical API Service
 * Connects frontend to Spring Boot backend at http://localhost:8080
 */

const API_BASE_URL = 'http://localhost:8080/api/v1';

export const authService = {
  /**
   * Log in an existing user (Doctor or Nurse)
   * @param {string} username
   * @param {string} password
   */
  async login(username, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed. Please check your credentials.');
    }

    return data;
  },

  /**
   * Register a new clinician (Doctor or Nurse)
   * @param {Object} userData
   */
  async signup(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.validationErrors) {
        const errorMsg = Object.values(data.validationErrors).join('; ');
        throw new Error(errorMsg);
      }
      throw new Error(data.message || 'Registration failed.');
    }

    return data;
  },

  /**
   * Fetch current authenticated user profile
   * @param {string} token
   */
  async getCurrentUser(token) {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to retrieve user profile.');
    }

    return await response.json();
  },

  /**
   * Get available roles and descriptions from Spring Boot
   */
  async getRoles() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/roles`);
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Fallback
    }
    return {
      roles: ['DOCTOR', 'NURSE'],
      descriptions: {
        DOCTOR: 'Attending Physician: Full clinical diagnostic authority, override rights, and sepsis bundle sign-off.',
        NURSE: 'Bedside ICU Registered Nurse: Telemetry monitoring, vital sign recording, and STAT escalation.'
      }
    };
  },

  /**
   * Check backend AI integration health
   * @param {string} token
   */
  async checkAiHealth(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/clinical/ai-health`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      return await response.json();
    } catch (e) {
      return { status: 'OFFLINE', reachable: false, error: e.message };
    }
  }
};

