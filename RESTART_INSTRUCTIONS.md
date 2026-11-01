# 🔄 Restart Instructions

The MongoDB connection issue has been fixed! Now restart your backend:

## Step 1: Stop the Backend

In your backend terminal, press **Ctrl+C** to stop the server.

## Step 2: Start the Backend Again

```powershell
cd backend
npm run dev
```

## Expected Output

You should now see:
```
🚀 Server is running on port 5000
✅ MongoDB connected successfully
```

✅ **No more MongoDB errors!**

## Step 3: Test Creating a Project

1. Make sure frontend is still running (if not: `cd frontend && npm run dev`)
2. Go to: http://localhost:5173/admin/login
3. Login with:
   - Email: `sanketbhujbal205@gmail.com`
   - Password: `Sanket@123`
4. Click "Add New Project"
5. Fill out the form and submit

## If MongoDB Still Won't Connect

### Check if MongoDB is installed and running:

```powershell
# Check MongoDB service status
Get-Service MongoDB

# If it's not running or doesn't exist, you have two options:
```

### Option A: Install MongoDB Locally

1. Download from: https://www.mongodb.com/try/download/community
2. Run installer (choose "Complete" setup)
3. MongoDB will start automatically as a Windows service

### Option B: Use MongoDB Atlas (Cloud - FREE)

This is easier and doesn't require local installation:

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Create a free account
3. Create a free cluster (M0 tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Update `backend/.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/portfolio?retryWrites=true&w=majority
   ```
   (Replace username, password, and cluster with your actual values)
7. Restart backend: `npm run dev`

## What Was Fixed?

The error was caused by using deprecated options (`useNewUrlParser`, `useUnifiedTopology`) with Mongoose 9.x. These options are no longer needed and were causing the connection to fail.

The connection code was changed from:
```javascript
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,      // ❌ Not supported in Mongoose 9.x
  useUnifiedTopology: true,   // ❌ Not supported in Mongoose 9.x
})
```

To:
```javascript
mongoose.connect(process.env.MONGODB_URI)  // ✅ Correct for Mongoose 9.x
```

Now try creating your first project! 🚀
