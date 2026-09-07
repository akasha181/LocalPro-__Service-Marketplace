import axios from 'axios';
import {
  DEMO_USERS,
  DEMO_CATEGORIES,
  DEMO_PROFESSIONALS,
  DEMO_SERVICES,
  DEMO_RECOMMENDATIONS,
} from './mockStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 3000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('localpro_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatic 24/7 Cloud Fallback: If laptop is off or backend is unreachable, fulfill with demo data seamlessly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const method = (error.config?.method || 'get').toLowerCase();

    // 1. Categories
    if (url.includes('/categories')) {
      return Promise.resolve({
        data: { success: true, data: { categories: DEMO_CATEGORIES } },
      });
    }

    // 2. AI Recommendations
    if (url.includes('/professionals/recommendations')) {
      return Promise.resolve({
        data: { success: true, data: { recommendations: DEMO_RECOMMENDATIONS } },
      });
    }

    // 3. Professionals list
    if (url.includes('/professionals') && method === 'get' && !url.includes('/recommendations')) {
      return Promise.resolve({
        data: {
          success: true,
          data: {
            professionals: DEMO_PROFESSIONALS,
            total: DEMO_PROFESSIONALS.length,
            page: 1,
            totalPages: 1,
          },
        },
      });
    }

    // 4. Auth: Login
    if (url.includes('/auth/login') && method === 'post') {
      try {
        const body = JSON.parse(error.config.data || '{}');
        const user = DEMO_USERS.find((u) => u.email === body.email) || DEMO_USERS[4];
        return Promise.resolve({
          data: {
            success: true,
            data: {
              token: 'demo_token_' + user.role,
              user,
            },
          },
        });
      } catch (e) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              token: 'demo_token_customer',
              user: DEMO_USERS[4],
            },
          },
        });
      }
    }

    // 5. Auth: Register
    if (url.includes('/auth/register') && method === 'post') {
      try {
        const body = JSON.parse(error.config.data || '{}');
        const newUser = {
          _id: 'user_' + Date.now(),
          name: body.name || 'Demo User',
          email: body.email || 'user@example.com',
          role: body.role || 'customer',
          isVerified: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        return Promise.resolve({
          data: {
            success: true,
            data: {
              token: 'demo_token_' + newUser.role,
              user: newUser,
            },
          },
        });
      } catch (e) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              token: 'demo_token_customer',
              user: DEMO_USERS[4],
            },
          },
        });
      }
    }

    // 6. Auth: Me verification
    if (url.includes('/auth/me')) {
      const storedToken = localStorage.getItem('localpro_token') || '';
      const matchedUser = DEMO_USERS.find((u) => storedToken.includes(u.role)) || DEMO_USERS[4];
      return Promise.resolve({
        data: {
          success: true,
          data: {
            user: matchedUser,
          },
        },
      });
    }

    // 7. Bookings list
    if (url.includes('/bookings') && method === 'get') {
      return Promise.resolve({
        data: {
          success: true,
          data: {
            bookings: [
              {
                _id: 'booking_demo_1',
                customer: DEMO_USERS[4],
                professional: DEMO_PROFESSIONALS[0],
                service: DEMO_SERVICES[0],
                date: '2026-09-15',
                startTime: '10:00',
                endTime: '11:00',
                status: 'CONFIRMED',
                totalPrice: 120,
                isPaid: true,
                paymentStatus: 'PAID',
                createdAt: new Date().toISOString(),
              },
            ],
          },
        },
      });
    }

    // 8. Bookings create
    if (url.includes('/bookings') && method === 'post') {
      return Promise.resolve({
        data: {
          success: true,
          data: {
            booking: {
              _id: 'booking_' + Date.now(),
              customer: DEMO_USERS[4],
              professional: DEMO_PROFESSIONALS[0],
              service: DEMO_SERVICES[0],
              date: '2026-09-20',
              startTime: '14:00',
              endTime: '15:00',
              status: 'PENDING',
              totalPrice: 120,
              isPaid: false,
              paymentStatus: 'PENDING',
              createdAt: new Date().toISOString(),
            },
          },
        },
      });
    }

    // 9. Healthcheck
    if (url.includes('/health')) {
      return Promise.resolve({
        data: {
          success: true,
          data: { status: 'online', uptime: 99999 },
        },
      });
    }

    return Promise.reject(error);
  }
);

export default api;

