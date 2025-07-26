/**
 * IMPROVEMENT NOTE: API configuration has been centralized and improved.
 * 
 * COMPLETED:
 * - Centralized API base URL configuration
 * - Support for multiple environment variables  
 * - Backward compatibility with BACKEND_URL export
 * - Removed hardcoded production URLs
 * 
 * TODO for further improvement:
 * - Create proper config object with all endpoints
 * - Add request/response interceptors for error handling
 * - Implement proper retry logic and timeout handling
 */

// Centralized API configuration
const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

// Export for use by other components that still reference BACKEND_URL
export const BACKEND_URL = API_BASE;

class ApiService {
  static async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  }

  static get(endpoint) {
    return this.request(endpoint);
  }

  static post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

export default ApiService; 