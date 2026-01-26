# Tujiimarishe SHG - Vercel Deployment Guide

## 🚀 Deploy to Vercel in 5 Minutes

### Prerequisites:
- ✅ Code pushed to GitHub
- ✅ Vercel account (free)
- ✅ Supabase project running

---

## Step 1: Push to GitHub

```bash
cd c:\Users\MKT\Desktop\tuj\tuj-nextjs

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Tujiimarishe SHG Platform"

# Add remote (replace with your GitHub repo URL)
git remote add origin https://github.com/YOUR_USERNAME/tujiimarishe-shg.git

# Push
git push -u origin main
```

---

## Step 2: Deploy on Vercel

### 1. Go to Vercel
Visit: https://vercel.com

### 2. Sign Up/Login
- Use GitHub account (recommended)

### 3. New Project
- Click "Add New" → "Project"
- Select your GitHub repository
- Click "Import"

### 4. Configure Project
```
Framework Preset: Next.js (auto-detected)
Root Directory: ./
Build Command: (leave default)
Output Directory: (leave default)
Install Command: (leave default)
```

### 5. Add Environment Variables
Click "Environment Variables" and add:

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://yxuewxyrxsgzelyaatbt.supabase.co

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZ...
```

### 6. Deploy
- Click "Deploy"
- Wait 2-3 minutes
- Done! ✨

---

## Step 3: Get Your URL

After deployment:
- Vercel will provide a URL like: `https://tujiimarishe-shg.vercel.app`
- You can customize this in Settings → Domains

---

## Step 4: Set Yourself as Admin

### Run this SQL in Supabase:

```sql
-- Replace with your email
UPDATE profiles 
SET role = 'treasurer',
    full_name = 'Kelvin Kinyua'
WHERE email = 'kevinmugo359@gmail.com';
```

**How to run:**
1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Paste the query above
4. Replace email with yours
5. Click "Run"

---

## Step 5: Test Everything

### 1. Create Your Account
- Go to your Vercel URL
- Click "Sign Up"
- Enter:
  - Name: Kelvin Kinyua
  - Email: kevinmugo359@gmail.com
  - Phone: +254XXXXXXXXX
  - Password: [secure password]

### 2. Update Your Role
- Run the SQL query from Step 4
- This makes you admin/treasurer

### 3. Test Admin Access
- Logout and login again
- You should see "⚡ Admin Panel" in navbar
- Click it to verify access

---

## 🎊 You're Live!

### Share with Members:
Send them:
```
Tujiimarishe SHG Platform is now live! 🎉

URL: https://your-app.vercel.app

To join:
1. Click "Sign Up"
2. Fill in your details
3. Start managing your finances!

Questions? Contact: Kelvin Kinyua
```

---

## 🔄 Updating Your App

### When you make changes:

```bash
# In tuj-nextjs folder
git add .
git commit -m "Description of changes"
git push

# Vercel auto-deploys!
# Check deployment at: vercel.com/dashboard
```

---

## 🛠️ Troubleshooting

### Problem: Build fails
**Solution:** Check build logs in Vercel dashboard

### Problem: Environment variables not working  
**Solution:** 
1. Go to Vercel → Settings → Environment Variables
2. Re-add variables
3. Redeploy

### Problem: Can't access Admin Panel
**Solution:**
1. Check your role in Supabase profiles table
2. Should be `role = 'treasurer'`
3. Logout and login again

---

## 📱 Custom Domain (Optional)

### To use custom domain:
1. Buy domain (e.g., tujiimarishe.com)
2. Vercel → Settings → Domains
3. Add custom domain
4. Follow DNS setup instructions

---

## ✅ Post-Deployment Checklist

- [ ] App deployed successfully
- [ ] Environment variables set
- [ ] Your admin account created
- [ ] Your role set to 'treasurer'
- [ ] Admin panel accessible
- [ ] Members can signup
- [ ] Members can view members list
- [ ] Contributions work
- [ ] Loans work
- [ ] You can confirm contributions
- [ ] You can approve loans

---

## 🎉 Success!

Your Tujiimarishe SHG platform is now:
- ✅ Live on the internet
- ✅ Accessible to all members
- ✅ Secured with Supabase
- ✅ Beautiful vibrant design
- ✅ Ready for production use!

**Enjoy managing your group's finances! 🚀**
