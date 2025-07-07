const API_BASE = "http://localhost:8080";

class ApiService {
  static async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    console.log('🌐 API call to:', url);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    console.log('🌐 API response status:', response.status);
    
    if (!response.ok) {
      console.error('🌐 API error:', response.status, response.statusText);
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('🌐 API response data:', data);
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