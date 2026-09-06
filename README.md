# LocalPro — Full-Stack Service Marketplace

**LocalPro** is a production-quality, multi-role service marketplace where customers can discover vetted local professionals, compare services, check live calendar availability, book appointments, make secure payments, chat in real-time, leave verified reviews, and receive AI-ranked recommendations.

---

## 🌟 Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS & Lucide Icons
- **State & Data Fetching**: TanStack Query (React Query) & Axios
- **Routing**: React Router 7 with Role-Based Route Guards
- **Real-Time**: Socket.IO Client

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT & HTTP-Only Cookies + bcrypt password hashing
- **Security**: Helmet, CORS, Rate Limiting, Zod Request Validation
- **Real-Time Engine**: Socket.IO Server

### External Integrations
- **Payments**: Stripe (Test Mode SDK & Webhooks)
- **Media Uploads**: Cloudinary (Avatars & Work Portfolios)

---

## 👥 User Roles & Access Control

| Role | Core Capabilities |
| :--- | :--- |
| **Customer** | Browse verified professionals, filter by category/rate/rating, view portfolios, check availability slots, book appointments, pay via Stripe, chat in real time, review completed bookings. |
| **Professional** | Manage professional trade profile, set working hours and availability, create service packages, accept/reject booking requests, view analytics & earnings, message customers. |
| **Admin** | Approve/reject professional applicants, manage category taxonomies, monitor platform-wide bookings, audit payments, mediate complaints, platform metrics. |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18+ (tested on v24+)
- **npm**: v9+ (tested on v11+)

### 1. Clone the repository
```bash
git clone https://github.com/akasha181/LocalPro-__Service-Marketplace.git
cd LocalPro-__Service-Marketplace
```

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
npm run dev
```
*The backend API will boot at `http://localhost:5000` with automated database fallback & demo seeder.*

### 3. Frontend Setup
```bash
cd ../client
npm install
npm run dev
```
*The React client will be available at `http://localhost:5173`.*

---

## 🔑 Demo Login Credentials

You can test each role using the pre-seeded credentials:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@localpro.com` | `password123` |
| **Professional** | `pro@localpro.com` | `password123` |
| **Customer** | `customer@localpro.com` | `password123` |

---

## 📐 Architecture & Roadmap

- [x] **Phase 1**: Monorepo Scaffolding, TypeScript configuration, MongoDB Connection, User model, JWT Authentication & Role Guards.
- [x] **Phase 2**: Category taxonomy, Professional profiles, Service catalogs, and Marketplace search/discovery with multi-criteria filters.
- [x] **Phase 3**: Working hours availability engine, double-booking prevention, and booking workflow.
- [x] **Phase 4**: Customer, Professional, and Admin role-specific dashboards.
- [x] **Phase 5**: Verified reviews, favorites, and notification center.
- [x] **Phase 6**: Socket.IO real-time 1-on-1 chat, presence, and typing indicators.
- [x] **Phase 7**: Stripe payments sandbox & Cloudinary uploads.
- [x] **Phase 8**: Weighted multi-factor AI recommendation engine and analytics.
- [x] **Phase 9**: Automated Jest & Supertest suites and security hardening.
- [ ] **Phase 10**: Dockerization & CI/CD deployment pipelines.

---

## 📄 License
MIT License. Built for production portfolio demonstration.
