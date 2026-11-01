# 🔧 Troubleshooting Guide

## "Error creating project" Issue

This error can have several causes. Follow these steps to diagnose and fix:

### Step 1: Check if Backend is Running

Open a terminal and run:
```powershell
# Check if the backend is running
curl http://localhost:5000/api/health
```

**Expected output:**
```json
{"status":"OK","message":"Server is running"}
```

**If you get an error:**
- The backend is not running
- Start it with: `cd backend && npm run dev`

### Step 2: Check MongoDB Connection

Look at your backend terminal. You should see:
```
✅ MongoDB connected successfully
```

**If you see connection errors:**

**Option A - Local MongoDB:**
```powershell
# Check if MongoDB service is running
Get-Service MongoDB

# Start it if stopped
Start-Service MongoDB
```

**Option B - Use MongoDB Atlas (Cloud):**
1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string
4. Update `backend/.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/portfolio
   ```

### Step 3: Test Authentication

Open browser console (F12) on the admin dashboard and run:
```javascript
console.log(localStorage.getItem('admin_token'));
```

**If null or undefined:**
- You're not logged in
- Go to `/admin/login` and login again

### Step 4: Check CORS/Proxy

Make sure:
1. Backend is running on port **5000**
2. Frontend is running on port **5173**
3. Check `frontend/vite.config.js` has proxy setup:
   ```javascript
   server: {
     proxy: {
       '/api': {
         target: 'http://localhost:5000',
         changeOrigin: true,
       }
     }
   }
   ```

### Step 5: Check Browser Console

Open browser DevTools (F12) → Console tab

Look for errors like:
- `401 Unauthorized` → Authentication issue, login again
- `500 Internal Server Error` → Backend error, check backend terminal
- `Network Error` → Backend not running or wrong port
- `CORS Error` → Proxy configuration issue

### Step 6: Check Browser Network Tab

1. Open DevTools (F12) → Network tab
2. Try creating a project
3. Look for the `/api/projects` request
4. Click on it to see:
   - **Status**: Should be 201 for success
   - **Request Headers**: Should have `Authorization: Bearer <token>`
   - **Request Payload**: Your project data
   - **Response**: Error message if failed

### Step 7: Run API Test Script

Test the backend directly:
```powershell
cd backend
node test-api.js
```

This will test all endpoints and show exactly where the issue is.

### Step 8: Check Backend Terminal Logs

When you try to create a project, you should see in backend terminal:
```
Received project creation request: { title: '...', description: '...', ... }
Attempting to save project: [Object]
Project saved successfully: 507f1f77bcf86cd799439011
```

**If you see errors here**, they will tell you exactly what's wrong.

## Common Specific Errors

### Error: "Title and description are required"

**Cause**: Form validation issue

**Fix**: Make sure both Title and Description fields are filled out

### Error: "Token is not valid" or "401 Unauthorized"

**Cause**: JWT token expired or invalid

**Fix**:
1. Logout from admin panel
2. Login again
3. Try creating project

### Error: "Cannot read property '_id' of undefined"

**Cause**: Backend didn't return the created project

**Fix**:
1. Check backend terminal for errors
2. Make sure MongoDB is connected
3. Check MongoDB connection string in `.env`

### Error: "Network Error" or "Failed to fetch"

**Cause**: Backend is not running or CORS issue

**Fix**:
1. Make sure backend is running: `cd backend && npm run dev`
2. Make sure it's on port 5000
3. Restart both frontend and backend

### Error: "MongooseServerSelectionError"

**Cause**: Cannot connect to MongoDB

**Fix**:
1. **Local MongoDB**: Start the MongoDB service
   ```powershell
   Start-Service MongoDB
   ```
2. **MongoDB Atlas**: Check your connection string in `.env`
3. Make sure your IP is whitelisted in Atlas

## Still Having Issues?

### Complete Reset

1. **Stop both servers** (Ctrl+C in both terminals)

2. **Clear browser cache and localStorage**:
   ```javascript
   // In browser console (F12)
   localStorage.clear();
   ```

3. **Check environment variables**:
   ```powershell
   cd backend
   cat .env
   ```
   Should have:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/portfolio
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   ADMIN_EMAIL=sanketbhujbal205@gmail.com
   ADMIN_PASSWORD=Sanket@123
   ```

4. **Start MongoDB** (if local):
   ```powershell
   Start-Service MongoDB
   ```

5. **Start backend**:
   ```powershell
   cd backend
   npm run dev
   ```
   Wait for: `✅ MongoDB connected successfully`

6. **Start frontend** (new terminal):
   ```powershell
   cd frontend
   npm run dev
   ```

7. **Login** at `http://localhost:5173/admin/login`

8. **Try creating a project**

### Get Detailed Error Information

Add this to your frontend console to see full error:
```javascript
// Open browser console (F12) and run:
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
});
```

Then try creating a project again and check the console.

## Need More Help?

1. Check backend terminal logs
2. Check browser console (F12 → Console tab)
3. Check network tab (F12 → Network tab)
4. Run the test script: `node backend/test-api.js`
5. Make sure MongoDB is running and connected

Share the error messages from:
- Backend terminal
- Browser console
- Network tab response
