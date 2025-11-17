# Deployment Guide

## ✅ Vercel (Frontend) - DEPLOYED
**URL**: https://frontend-ak0ruh64k-siddheshs-projects-ffc7d0eb.vercel.app

## 🔄 Render (Backend + Database) - Next Steps

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/collage-project.git
git push -u origin main
```

### 2. Deploy on Render
1. Go to https://render.com
2. Sign up/Login
3. Click "New +" → "Blueprint"
4. Connect your GitHub repo
5. Select the repo with `render.yaml`
6. Deploy

### 3. Update Frontend Environment
After Render deployment, update Vercel environment:
```bash
npx vercel env add BACKEND_URL
# Enter: https://your-render-backend.onrender.com
npx vercel --prod
```

## Free Resources Used
- **Vercel**: Frontend hosting (unlimited)
- **Render**: Backend + PostgreSQL (1GB) + Redis (25MB)

## Current Status
- ✅ Frontend: Live on Vercel
- ⏳ Backend: Ready for Render deployment
- ⏳ Database: Will be created on Render