# 🐛 Quick Debug Checklist for "Error creating project"

Run through this checklist in order:

## ✅ Step-by-Step Checklist

### 1. Is MongoDB Running?

**Windows - Check service:**
```powershell
Get-Service MongoDB
```

**If not running, start it:**
```powershell
Start-Service MongoDB
```

**Alternative: Check if MongoDB is listening:**
```powershell
netstat -an | findstr "27017"
```
You should see: `0.0.0.0:27017` or `127.0.0.1:27017`

---

### 2. Is Backend Server Running?

**Check if port 5000 is in use:**
```powershell
netstat -an | findstr "5000"
```

**If NOT running, start backend:**
```powershell
cd backend
npm run dev
```

**You should see:**
```
🚀 Server is running on port 5000
✅ MongoDB connected successfully
```

---

### 3. Is Frontend Running?

**Check if port 5173 is in use:**
```powershell
netstat -an | findstr "5173"
```

**If NOT running, start frontend:**
```powershell
cd frontend
npm run dev
```

---

### 4. Test Backend Directly

**Test health endpoint:**
```powershell
curl http://localhost:5000/api/health
```

**Expected response:**
```json
{"status":"OK","message":"Server is running"}
```

**Test login:**
```powershell
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{\"username\":\"sanketbhujbal205@gmail.com\",\"password\":\"Sanket@123\"}'
```

**Expected response:** JSON with `token` field

---

### 5. Check Browser (While creating project)

**Open DevTools (F12) and check:**

**Console Tab:**
- Look for errors (red text)
- Look for: `Submitting project data: {...}`
- Note any error messages

**Network Tab:**
- Filter by "XHR" or "Fetch"
- Find the `projects` request
- Check:
  - Status code (should be 201 for success)
  - Request Headers (should have `Authorization: Bearer ...`)
  - Response (check error message)

---

### 6. Check Backend Terminal

**While creating project, backend should log:**
```
Received project creation request: { title: '...', description: '...', ... }
Attempting to save project: ...
Project saved successfully: [some ID]
```

**If you see errors here, that's your issue!**

---

### 7. Are You Logged In?

**Check in browser console (F12):**
```javascript
console.log('Token:', localStorage.getItem('admin_token'));
```

**If null/undefined:**
1. Go to: http://localhost:5173/admin/login
2. Login with:
   - Email: `sanketbhujbal205@gmail.com`
   - Password: `Sanket@123`
3. Try creating project again

---

### 8. Run Automated Tests

```powershell
cd backend
node test-api.js
```

**This will test:**
- ✅ Health check
- ✅ Login
- ✅ Get projects
- ✅ Create project
- ✅ Update project
- ✅ Delete project

**If any test fails, it will show you exactly what's wrong.**

---

## 🔍 Most Common Issues & Fixes

| Issue | Symptoms | Fix |
|-------|----------|-----|
| MongoDB not running | Backend shows connection error | `Start-Service MongoDB` |
| Backend not running | Network error in browser | `cd backend && npm run dev` |
| Not logged in | 401 Unauthorized | Login again at `/admin/login` |
| Token expired | 401 Unauthorized | Logout and login again |
| Wrong port | Connection refused | Check backend is on 5000, frontend on 5173 |
| Validation error | "Title and description required" | Fill out all required fields |

---

## 📊 What to Share if Still Stuck

If you're still having issues, share:

1. **Backend terminal output** when you try to create project
2. **Browser console errors** (F12 → Console tab)
3. **Network tab response** (F12 → Network → Click on projects request → Response tab)
4. **Output of test script**: `node backend/test-api.js`

---

## 🚀 Quick Full Restart

If all else fails, do a complete restart:

```powershell
# 1. Stop everything (Ctrl+C in all terminals)

# 2. Start MongoDB
Start-Service MongoDB

# 3. Start backend (terminal 1)
cd backend
npm run dev

# Wait for: ✅ MongoDB connected successfully

# 4. Start frontend (terminal 2)
cd frontend  
npm run dev

# 5. Clear browser
# Press F12, then in console:
localStorage.clear()

# 6. Login at http://localhost:5173/admin/login

# 7. Try creating project
```

---

## 💡 Pro Tips

- Keep both terminals visible to see errors immediately
- Keep browser DevTools open (F12) while testing
- Check all three places for errors: Backend terminal, Browser console, Network tab
- The error message will tell you exactly what's wrong if you look carefully!
