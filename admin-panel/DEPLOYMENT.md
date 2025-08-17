# GurToy Admin Panel - Deployment Guide

## Pre-deployment Checklist

### 1. Supabase Setup
- [ ] Supabase project created and configured
- [ ] Database schema applied from `../supabase/schema.sql`
- [ ] Row Level Security (RLS) policies enabled
- [ ] Storage buckets created (`aadhaar`, `selfie`)
- [ ] Admin user created with email: `thegurtoy@gmail.com`

### 2. Environment Variables
- [ ] `.env.local` configured with correct Supabase credentials
- [ ] Environment variables verified in production environment

### 3. Code Review
- [ ] All TypeScript errors resolved
- [ ] All components properly typed
- [ ] Authentication flow tested
- [ ] Route protection verified

## Deployment Steps
### Option 1: Vercel Deployment (Recommended)

1. **Connect Repository**
   ```bash
   # Push code to GitHub
   git init
   git add .
   git commit -m "Initial admin panel setup"
   git branch -M main
   git remote add origin https://github.com/yourusername/gurtoy-admin-panel.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Deploy

3. **Custom Domain (Optional)**
   - Add custom domain in Vercel dashboard
   - Configure DNS settings
   - Enable SSL (automatic with Vercel)

### Option 2: Manual Deployment

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Start Production Server**
   ```bash
   npm start
   ```

3. **Use Process Manager (PM2)**
   ```bash
   npm install -g pm2
   pm2 start npm --name "gurtoy-admin" -- start
   pm2 save
   pm2 startup
   ```

## Post-deployment Verification

### 1. Authentication Test
- [ ] Admin login works with correct credentials
- [ ] Unauthorized access is blocked
- [ ] Route protection is active

### 2. Functionality Test
- [ ] Dashboard loads with correct stats
- [ ] User & KYC management works
- [ ] Add referral sale functionality works
- [ ] Withdrawal processing works
- [ ] Notice management works

### 3. Security Verification
- [ ] All routes require authentication
- [ ] Sensitive data is properly masked
- [ ] Database queries use RLS
- [ ] No sensitive information in client-side code

## Production Configuration

### 1. Environment Variables
```bash
# Production .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Next.js Configuration
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['your-project.supabase.co'],
  },
  // Enable compression
  compress: true,
  // Optimize for production
  swcMinify: true,
}

module.exports = nextConfig
```

### 3. Performance Optimization
- [ ] Images optimized with Next.js Image component
- [ ] Static assets cached properly
- [ ] Database queries optimized
- [ ] Unnecessary re-renders minimized

## Monitoring & Maintenance

### 1. Error Monitoring
- Set up error tracking (Sentry, LogRocket, etc.)
- Monitor application performance
- Track user interactions

### 2. Database Monitoring
- Monitor Supabase usage and limits
- Set up alerts for high usage
- Regular database maintenance

### 3. Security Updates
- Regular dependency updates
- Security patches
- Access log monitoring

## Backup Strategy

### 1. Database Backup
- Supabase automatic backups (check retention policy)
- Manual exports for critical data
- Test restore procedures

### 2. Code Backup
- Git repository with proper branching
- Tagged releases for rollback
- Documentation updates

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check Supabase URL and keys
   - Verify admin user exists
   - Check RLS policies

2. **Build Errors**
   - Resolve TypeScript errors
   - Check import paths
   - Verify dependencies

3. **Runtime Errors**
   - Check browser console
   - Verify API endpoints
   - Check network requests

### Support Contacts
- Technical Lead: [contact-info]
- DevOps Team: [contact-info]
- Supabase Support: [support-link]

## Rollback Plan

1. **Immediate Rollback**
   ```bash
   # Vercel
   vercel --prod --rollback
   
   # Manual
   git checkout previous-stable-tag
   npm run build
   pm2 restart gurtoy-admin
   ```

2. **Database Rollback**
   - Restore from Supabase backup
   - Apply necessary migrations
   - Verify data integrity

## Success Criteria

- [ ] Admin panel accessible at production URL
- [ ] All features working correctly
- [ ] Performance meets requirements (< 3s load time)
- [ ] Security measures active
- [ ] Monitoring in place
- [ ] Documentation complete
- [ ] Team trained on usage

## Go-Live Checklist

- [ ] All tests passed
- [ ] Security review completed
- [ ] Performance benchmarks met
- [ ] Backup procedures tested
- [ ] Monitoring configured
- [ ] Team notified
- [ ] Documentation updated
- [ ] Admin credentials secured
