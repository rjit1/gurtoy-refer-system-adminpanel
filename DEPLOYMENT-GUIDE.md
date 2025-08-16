# 🚀 Gurtoy Referral System - Complete Deployment Guide

## 📋 Project Overview

This repository contains two separate Next.js applications:
- **Main Website** (Root): Referral landing page and user dashboard
- **Admin Panel** (admin-panel/): Administrative interface

Both applications share the same Supabase database but will be deployed as separate Vercel projects.

## ✅ Pre-Deployment Checklist

### 1. GitHub Repository ✅
- [x] Repository created: `https://github.com/rjit1/gurtoy-refer-system-adminpanel.git`
- [x] Code pushed to main branch
- [x] All files committed

### 2. Environment Variables ✅
- [x] Supabase URL: `https://mknxaioosbktcyfokvfw.supabase.co`
- [x] Supabase Anon Key: Configured
- [x] Admin credentials: Set up

### 3. Database Setup ✅
- [x] Supabase project active
- [x] Database schema applied
- [x] Admin user created
- [x] Storage buckets configured

## 🌐 Deployment Strategy

### Two Separate Vercel Deployments:

1. **Main Website**: `gurtoy-referral.vercel.app` (or custom domain)
2. **Admin Panel**: `gurtoy-admin.vercel.app` (or custom domain)

## 📝 Step-by-Step Vercel Deployment

### 🎯 **PART 1: Deploy Main Website**

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Sign in with GitHub account

2. **Import Repository**
   - Click "New Project"
   - Select GitHub repository: `rjit1/gurtoy-refer-system-adminpanel`
   - Click "Import"

3. **Configure Main Website**
   ```
   Project Name: gurtoy-referral-website
   Framework Preset: Next.js
   Root Directory: ./  (leave as root)
   Build Command: (leave default - npm run build)
   Output Directory: (leave default - .next)
   Install Command: (leave default - npm install)
   ```

4. **Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://mknxaioosbktcyfokvfw.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbnhhaW9vc2JrdGN5Zm9rdmZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjY4NzIsImV4cCI6MjA3MDY0Mjg3Mn0.2UtfvqfZegZ1_hrkngG0O-OixQ8dti5FTSO00gflEn8
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

### 🎯 **PART 2: Deploy Admin Panel**

1. **Create Second Project**
   - Click "New Project" again
   - Select same GitHub repository: `rjit1/gurtoy-refer-system-adminpanel`
   - Click "Import"

2. **Configure Admin Panel**
   ```
   Project Name: gurtoy-admin-panel
   Framework Preset: Next.js
   Root Directory: ./admin-panel
   Build Command: (leave default - npm run build)
   Output Directory: (leave default - .next)
   Install Command: (leave default - npm install)
   ```

3. **Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://mknxaioosbktcyfokvfw.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbnhhaW9vc2JrdGN5Zm9rdmZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjY4NzIsImV4cCI6MjA3MDY0Mjg3Mn0.2UtfvqfZegZ1_hrkngG0O-OixQ8dti5FTSO00gflEn8
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

## 🔧 Post-Deployment Configuration

### 1. Custom Domains (Optional)
- Main Website: `www.gurtoy.com`
- Admin Panel: `admin.gurtoy.com`

### 2. SSL Certificates
- Automatically handled by Vercel

### 3. Performance Optimization
- Image optimization: Enabled by default
- Edge caching: Configured
- Compression: Enabled

## 🧪 Testing Deployment

### Main Website Testing:
- [ ] Landing page loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Dashboard functionality
- [ ] Mobile responsiveness

### Admin Panel Testing:
- [ ] Admin login: `thegurtoy@gmail.com` / `Toys123@`
- [ ] Dashboard loads with data
- [ ] User management works
- [ ] Sales management works
- [ ] Withdrawal processing works

## 🔒 Security Considerations

1. **Environment Variables**: Never commit .env.local files
2. **Admin Access**: Restrict admin panel domain access if needed
3. **Database Security**: RLS policies are active
4. **HTTPS**: Enforced by Vercel

## 📊 Monitoring & Analytics

1. **Vercel Analytics**: Enable in dashboard
2. **Error Tracking**: Built-in error boundaries
3. **Performance**: Vercel Speed Insights

## 🚨 Troubleshooting

### Common Issues:
1. **Build Failures**: Check environment variables
2. **Database Connection**: Verify Supabase credentials
3. **Image Loading**: Check next.config.js domains
4. **Admin Access**: Verify admin user exists in Supabase

### Support:
- Vercel Support: https://vercel.com/help
- Supabase Support: https://supabase.com/support
- GitHub Issues: Create issue in repository
