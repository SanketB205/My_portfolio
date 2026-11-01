# MERN Portfolio Project

A full-stack portfolio website built with MongoDB, Express.js, React, and Node.js.

## 🚀 Features

- **Public Portfolio**: Showcase projects, skills, experience, and contact form
- **Admin Dashboard**: Protected admin panel to manage content (CRUD operations)
- **JWT Authentication**: Secure login system with token-based authentication
- **Responsive Design**: Beautiful UI with Tailwind CSS
- **RESTful API**: Complete backend API for all portfolio data

## 📁 Project Structure

```
My_portfolio/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── context/       # Auth context
│   │   ├── utils/         # Axios instance
│   │   └── App.jsx
│   └── package.json
│
└── backend/           # Node.js + Express backend
    ├── models/        # MongoDB models
    ├── routes/        # API routes
    ├── middleware/    # Auth middleware
    ├── server.js      # Main server file
    └── package.json
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)

### 1. Backend Setup

```bash
cd backend

# Install dependencies (already done)
npm install

# Configure environment variables
# Edit .env file with your MongoDB URI and JWT secret

# Start the server
npm run dev
```

The backend server will run on `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies (already done)
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### 3. MongoDB Setup

**Option A: Local MongoDB**
- Install MongoDB locally
- Default connection: `mongodb://localhost:27017/portfolio`

**Option B: MongoDB Atlas (Cloud)**
1. Create account at [mongodb.com](https://www.mongodb.com/)
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in `backend/.env`

## 🔐 Admin Access

Admin credentials are configured via environment variables — never hardcoded.
Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `backend/.env` file (see `.env.example` for the template).

To access the admin panel, use the credentials you configured in your `.env`.

## 📡 API Endpoints

### Public Routes
- `GET /api/projects` - Get all projects
- `GET /api/skills` - Get all skills
- `GET /api/experience` - Get all experiences
- `POST /api/contact` - Submit contact form

### Authentication
- `POST /api/auth/login` - Admin login

### Protected Routes (require JWT token)
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- Similar CRUD routes for skills and experience

## 🎨 Tech Stack

### Frontend
- React 19
- React Router DOM 7
- Axios
- Tailwind CSS 4
- Framer Motion
- Lucide React (icons)
- Vite 8

### Backend
- Node.js
- Express.js 5
- MongoDB + Mongoose 9
- JWT (jsonwebtoken)
- bcryptjs
- CORS

## 🔧 Development Scripts

### Backend
```bash
npm start      # Start production server
npm run dev    # Start with nodemon (auto-reload)
```

### Frontend
```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run preview # Preview production build
```

## 📝 Environment Variables

Create a `.env` file in the backend folder:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/portfolio
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

ADMIN_EMAIL=your_email@example.com
ADMIN_PASSWORD=your_secure_password
```

> Copy `backend/.env.example` to `backend/.env` and fill in your own values.

## 🚀 Deployment

### Frontend
- Build: `npm run build` (creates `dist/` folder)
- Deploy to: Vercel, Netlify, or any static hosting

### Backend
- Deploy to: Heroku, Railway, Render, or any Node.js hosting
- Don't forget to set environment variables on your hosting platform

## 📄 License

ISC

## 👤 Author

Your Name - Portfolio Website
