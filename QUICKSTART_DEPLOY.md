# Quick Deploy to lumin.com.pk

## Fastest Method: Vercel (Recommended)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Deploy
```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No
- **Project name?** → lumin
- **Directory?** → ./
- **Override settings?** → No

### Step 3: Add Custom Domain
1. Go to https://vercel.com/dashboard
2. Select your "lumin" project
3. Click "Settings" → "Domains"
4. Add domain: `lumin.com.pk`
5. Add domain: `www.lumin.com.pk`

### Step 4: Update DNS Records
Go to your domain registrar (where you bought lumin.com.pk) and add these DNS records:

**For root domain (lumin.com.pk):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Step 5: Deploy to Production
```bash
vercel --prod
```

### Done! 🎉
Your website will be live at https://lumin.com.pk in a few minutes!

---

## Alternative: Manual Upload to Hosting

If you have traditional hosting (cPanel):

### Step 1: Prepare Files
Create a ZIP of these files:
- All HTML files
- All CSS files
- All JS files
- All image files
- logo blue.png
- All ezgif-frame-*.webp files

### Step 2: Upload
1. Login to your hosting cPanel
2. Go to File Manager
3. Navigate to `public_html`
4. Upload and extract the ZIP file
5. Make sure `index.html` is in the root

### Step 3: Setup Backend (Optional)
If your host supports Node.js:
1. Go to "Setup Node.js App"
2. Create new application
3. Set entry point: `server.js`
4. Install dependencies
5. Start application

### Step 4: Point Domain
1. Update nameservers to your hosting provider
2. Wait 24-48 hours for DNS propagation

---

## Troubleshooting

**Website not loading?**
- Check DNS propagation: https://dnschecker.org
- Verify files are in correct directory
- Check for typos in domain name

**Backend not working?**
- Ensure Node.js is installed on server
- Check server logs for errors
- Verify port configuration

**SSL not working?**
- Vercel provides automatic SSL
- For cPanel, use Let's Encrypt (free)

---

## Contact Support

If you need help:
- Vercel: https://vercel.com/support
- Your hosting provider's support team
