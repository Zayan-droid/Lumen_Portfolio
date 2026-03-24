# Lumin Website Deployment Guide

## Domain: lumin.com.pk

This guide will help you deploy the Lumin website to your domain.

---

## Deployment Options

### Option 1: Deploy to Vercel (Recommended - Free & Easy)

Vercel is perfect for Node.js applications and offers free hosting with automatic HTTPS.

#### Steps:

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from your project directory**
   ```bash
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? Yes
   - Which scope? (Select your account)
   - Link to existing project? No
   - Project name: lumin
   - Directory: ./
   - Override settings? No

5. **Add your custom domain:**
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings → Domains
   - Add `lumin.com.pk` and `www.lumin.com.pk`
   - Update your domain's DNS records as instructed by Vercel

6. **Deploy to production:**
   ```bash
   vercel --prod
   ```

---

### Option 2: Deploy to Netlify (Alternative - Also Free)

#### Steps:

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize and deploy**
   ```bash
   netlify init
   netlify deploy --prod
   ```

4. **Add custom domain in Netlify dashboard**

---

### Option 3: Deploy to Traditional Hosting (cPanel/Shared Hosting)

If you have traditional hosting with cPanel:

#### Steps:

1. **Prepare files for upload:**
   - All HTML, CSS, JS files
   - Images and assets
   - Node.js backend (server.js)

2. **Upload via FTP/File Manager:**
   - Upload all files to `public_html` or `www` directory
   - Ensure `index.html` is in the root

3. **Setup Node.js application (if supported):**
   - Most cPanel hosts support Node.js apps
   - Go to "Setup Node.js App" in cPanel
   - Set entry point to `server.js`
   - Set port to 3000
   - Install dependencies: `npm install`

4. **Configure domain:**
   - Point your domain to the hosting server
   - Update DNS A records to your hosting IP

5. **Setup SSL Certificate:**
   - Use Let's Encrypt (free) via cPanel
   - Or use Cloudflare for free SSL

---

### Option 4: Deploy to Railway (Good for Node.js)

#### Steps:

1. **Create account at railway.app**

2. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

3. **Login and deploy**
   ```bash
   railway login
   railway init
   railway up
   ```

4. **Add custom domain in Railway dashboard**

---

## DNS Configuration

Once you've chosen a hosting provider, update your DNS records:

### For Vercel/Netlify:
```
Type: CNAME
Name: www
Value: [provided by hosting]

Type: A
Name: @
Value: [provided by hosting]
```

### For Traditional Hosting:
```
Type: A
Name: @
Value: [your server IP]

Type: CNAME
Name: www
Value: lumin.com.pk
```

---

## Environment Variables

If using the waitlist backend, set these environment variables:

```
PORT=3000
NODE_ENV=production
```

---

## Pre-Deployment Checklist

- [ ] All links work correctly
- [ ] Images load properly
- [ ] Forms submit successfully
- [ ] Mobile responsive design works
- [ ] Page transitions are smooth
- [ ] Waitlist backend is functional
- [ ] SSL certificate is active
- [ ] Domain points to hosting
- [ ] Analytics added (optional)

---

## Post-Deployment

1. **Test the website:**
   - Visit https://lumin.com.pk
   - Test all pages and features
   - Check mobile responsiveness
   - Test form submissions

2. **Monitor:**
   - Check server logs
   - Monitor waitlist submissions
   - Track any errors

3. **Backup:**
   - Regular backups of waitlist data
   - Keep code in version control (Git)

---

## Recommended: Vercel Deployment

For the easiest deployment with your Node.js backend, I recommend Vercel:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add custom domain in dashboard
# Deploy to production
vercel --prod
```

---

## Need Help?

If you encounter issues:
1. Check hosting provider documentation
2. Verify DNS propagation (can take 24-48 hours)
3. Check server logs for errors
4. Ensure Node.js version compatibility

---

## Quick Deploy Commands

```bash
# For Vercel
vercel --prod

# For Netlify
netlify deploy --prod

# For Railway
railway up
```

Good luck with your deployment! 🚀
