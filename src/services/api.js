const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

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