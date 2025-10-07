const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

class APIService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth APIs
  auth = {
    login: (username, password, userType) =>
      this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password, userType }),
      }),

    logout: () =>
      this.request('/auth/logout', {
        method: 'POST',
      }),
  };

  // Vendor APIs
  vendors = {
    getAll: () => this.request('/vendors'),

    getById: (id) => this.request(`/vendors/${id}`),

    create: (vendorData) =>
      this.request('/vendors', {
        method: 'POST',
        body: JSON.stringify(vendorData),
      }),

    update: (id, vendorData) =>
      this.request(`/vendors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(vendorData),
      }),

    delete: (id) =>
      this.request(`/vendors/${id}`, {
        method: 'DELETE',
      }),
  };

  // Order APIs
  orders = {
    getAll: () => this.request('/orders'),

    getById: (id) => this.request(`/orders/${id}`),

    updateStatus: (id, status) =>
      this.request(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
  };
}

export const API = new APIService();
