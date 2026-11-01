# 🚀 Quick Start Guide

## Step 1: Install MongoDB

### Option A: Local MongoDB (Recommended for Development)

**Windows:**
1. Download MongoDB Community Server from [mongodb.com/download-center/community](https://www.mongodb.com/try/download/community)
2. Run the installer (choose "Complete" setup)
3. MongoDB service will start automatically

**Or use Chocolatey:**
```powershell
choco install mongodb
```

**Verify installation:**
```powershell
mongod --version
```

### Option B: MongoDB Atlas (Cloud - Free Tier)

1. Go to [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account
3. Create a new cluster (Free M0 tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Update `backend/.env` file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/portfolio?retryWrites=true&w=majority
   ```

## Step 2: Start the Backend

```powershell
cd backend
npm run dev
```

You should see:
```
🚀 Server is running on port 5000
✅ MongoDB connected successfully
```

## Step 3: Start the Frontend

Open a **new terminal** window:

```powershell
cd frontend
npm run dev
```

You should see:
```
VITE v8.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

## Step 4: Access the Application

- **Public Portfolio**: http://localhost:5173/
- **Admin Login**: http://localhost:5173/admin/login
- **Admin Dashboard**: http://localhost:5173/admin (after login)

## Step 5: Login to Admin Panel

1. Go to http://localhost:5173/admin/login
2. Use these credentials:
   - **Email**: sanketbhujbal205@gmail.com
   - **Password**: Sanket@123
3. You'll be redirected to the admin dashboard
4. Start managing your projects!

## 🔧 Troubleshooting

### MongoDB Connection Error

**Error**: `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution**:
- Make sure MongoDB is running:
  ```powershell
  # Windows - check if MongoDB service is running
  Get-Service MongoDB
  
  # If stopped, start it:
  Start-Service MongoDB
  ```

### Port Already in Use

**Error**: `Port 5000 is already in use`

**Solution**:
- Change the port in `backend/.env`:
  ```
  PORT=5001
  ```

### CORS Error in Browser

**Error**: `Access to XMLHttpRequest... has been blocked by CORS policy`

**Solution**:
- Backend is already configured with CORS
- Make sure backend is running on port 5000
- Make sure Vite proxy is configured (already done in vite.config.js)

## 📦 What's Already Set Up?

✅ Backend API with all routes  
✅ MongoDB models (Project, Skill, Experience, Contact)  
✅ JWT Authentication  
✅ Protected routes with middleware  
✅ Frontend with React Router  
✅ Auth Context for state management  
✅ Admin Dashboard UI  
✅ Vite proxy configuration  
✅ Environment variables  

## 🎯 Next Steps

1. Start both servers (backend + frontend)
2. Login to admin panel
3. Add your first project
4. Customize the portfolio content
5. Update the About, Skills, and Experience sections
6. Deploy to production when ready!

## 📞 Need Help?

- Check the main README.md for detailed documentation
- Review the API endpoints in README.md
- Make sure MongoDB is running
- Check console for errors in both terminal windows
