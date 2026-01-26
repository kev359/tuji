# 👥 Tujiimarishe SHG - Members Setup Guide

## Group Members List

### Leadership Team:
1. **Kelvin Kinyua** - Admin/Treasurer (You)
2. **Victor Wandera** - Chairman
3. **Regina Gachara** - Vice Chairperson
4. **Theopyster Wajeshi** - Treasurer (will become admin later)
5. **Peter Mureithi** - Secretary
6. **Paul Peace** - Organizing Secretary

### Members:
7. Sailus Kiboma
8. Lorna Mukeni
9. Beatrice Muchonku
10. Cecilia Nyagothie
11. Francis Amkoa
12. Brian Musundi
13. Branham Ombula

**Total: 13 Members**

---

## 🔐 Setting Up Members in Supabase

Since we're using **Supabase Authentication**, members need to be created through the Auth system. Here are two methods:

### **Method 1: Manual Setup (Recommended for Initial Setup)**

#### Step 1: Go to Supabase Dashboard
1. Open: https://supabase.com
2. Sign in to your account
3. Select your **TUJIIMARISHE** project
4. Go to **Authentication** → **Users**

#### Step 2: Create Each Member Account
For each member, click **"Add User"** → **"Create new user"**

**Example for Kelvin Kinyua (Admin):**
```
Email: kelvin.kinyua@tujiimarishe.org (or kelvinkinyua254@gmail.com)
Password: [Create a secure password]
✓ Auto Confirm User: YES
```

Click **Create User**

#### Step 3: Update Profile Information
After creating each user:
1. Go to **Table Editor** → **profiles** table
2. Find the user you just created
3. Click to edit and fill in:
   - `full_name`: "Kelvin Kinyua"
   - `phone_number`: "+254XXXXXXXXX"
   - `role`: "treasurer" (for you and Theopyster), "member" for others

---

## 📋 Quick Reference: Member Information Template

Here's a template for each member. You'll need to collect:

### **1. Kelvin Kinyua (Admin/Treasurer)**
```
Email: ___________________________
Phone: ___________________________
Role: treasurer
Password: [Create secure password]
```

### **2. Victor Wandera (Chairman)**
```
Email: ___________________________
Phone: ___________________________
Role: member
Title: Chairman
Password: [Create secure password]
```

### **3. Regina Gachara (Vice Chairperson)**
```
Email: ___________________________
Phone: ___________________________  
Role: member
Title: Vice Chairperson
Password: [Create secure password]
```

### **4. Theopyster Wajeshi (Treasurer)**
```
Email: ___________________________
Phone: ___________________________
Role: member (change to 'treasurer' later)
Title: Treasurer
Password: [Create secure password]
```

### **5. Peter Mureithi (Secretary)**
```
Email: ___________________________
Phone: ___________________________
Role: member
Title: Secretary
Password: [Create secure password]
```

### **6. Paul Peace (Organizing Secretary)**
```
Email: ___________________________
Phone: ___________________________
Role: member
Title: Organizing Secretary
Password: [Create secure password]
```

### **7-13. Other Members**
(Same template for: Sailus Kiboma, Lorna Mukeni, Beatrice Muchonku, Cecilia Nyagothie, Francis Amkoa, Brian Musundi, Branham Ombula)

```
Email: ___________________________
Phone: ___________________________
Role: member
Password: [Create secure password]
```

---

## 🚀 Method 2: Invite Members to Self-Register

### Step 1: Share the Platform URL
Send your members the link: **https://your-app-url.vercel.app** (or localhost for testing)

### Step 2: Members Register Themselves
1. They go to the login page
2. Click "Need an account? Contact your group treasurer"
3. You (as admin) create accounts for them manually in Supabase

### Step 3: You Update Their Profiles
After they're created:
1. Go to Supabase → Table Editor → profiles
2. Update `full_name` and `phone_number`
3. Keep `role` as 'member' (except for treasurers)

---

## 👨‍💼 Admin/Treasurer Role Setup

### Current Setup:
- **You (Kelvin Kinyua):** `role = 'treasurer'`
  - This gives you access to the Admin Panel
  - You can confirm contributions
  - You can approve loans
  - You can record payments

### Later (When Ready):
To make **Theopyster Wajeshi** a treasurer too:
1. Go to Supabase → Table Editor → profiles
2. Find Theopyster's account
3. Change `role` from 'member' to 'treasurer'
4. Save

**Note:** You can have **multiple treasurers**! Both of you will have admin access.

---

## 📝 Step-by-Step Member Creation Process

### For Each Member:

#### 1️⃣ **Create Auth Account**
```
Supabase Dashboard → Authentication → Users → Add User
- Email: [member's email]
- Password: [secure password]
- Auto Confirm: YES
```

#### 2️⃣ **Update Profile**
```
Supabase Dashboard → Table Editor → profiles
- Find the new user (by email)
- Set full_name: "[Member's Full Name]"
- Set phone_number: "+254XXXXXXXXX"
- Set role: "member" (or "treasurer" for admins)
```

#### 3️⃣ **Share Credentials**
Send the member:
- Platform URL
- Their email
- Their temporary password
- Ask them to change password on first login

---

## 🔒 Password Best Practices

### For Initial Setup:
1. Create **unique passwords** for each member
2. Use format: `Tujiimarishe2024![MemberInitials]`
   - Example: `Tujiimarishe2024!KK` for Kelvin Kinyua
3. Share securely (WhatsApp, SMS, or in person)
4. Ask members to change on first login

### Password Requirements:
- Minimum 6 characters (Supabase default)
- Recommend: 8+ characters with mix of:
  - Uppercase letters
  - Lowercase letters
  - Numbers
  - Special characters

---

## 📊 Roles & Permissions Summary

### **Member Role (`role = 'member'`)**
✅ Can view own dashboard  
✅ Can record contributions  
✅ Can request loans  
✅ Can view own history  
✅ Can view all members  
❌ Cannot access Admin Panel  
❌ Cannot confirm contributions  
❌ Cannot approve loans  

### **Treasurer Role (`role = 'treasurer'`)**
✅ All member permissions  
✅ **Can access Admin Panel**  
✅ **Can confirm contributions**  
✅ **Can approve/reject loans**  
✅ **Can record loan payments**  
✅ **Can view all member data**  

---

## 🎯 Quick Checklist

After setting up all members, verify:

- [ ] 13 users created in Supabase Auth
- [ ] All profiles have `full_name` filled
- [ ] All profiles have `phone_number` filled
- [ ] Kelvin Kinyua has `role = 'treasurer'`
- [ ] All others have `role = 'member'`
- [ ] All members can login successfully
- [ ] Members can see their dashboard
- [ ] You can access Admin Panel

---

## 🔄 Testing the Setup

### Test as Admin (You):
1. Login at http://localhost:3000
2. Verify you see "⚡ Admin Panel" in navbar
3. Click Admin Panel
4. Check you can see:
   - Pending Contributions tab
   - Pending Loans tab
   - Record Payment tab

### Test as Member:
1. Ask a member to login
2. They should see:
   - Dashboard with their stats
   - Contributions page
   - Loans page
   - Members page
3. They should NOT see "Admin Panel"

---

## 📱 Member Onboarding Message Template

Send this to your members:

```
Hello [Member Name],

Welcome to the Tujiimarishe SHG Management Platform! 🎉

Your login details:
📧 Email: [their-email]
🔐 Password: [temporary-password]
🌐 Platform: http://localhost:3000 (or your deployed URL)

What you can do:
✅ View your financial dashboard
✅ Record monthly contributions
✅ Request loans
✅ View all members
✅ Track your contribution history

Please login and change your password immediately.

If you need help, contact:
Kelvin Kinyua (Admin/Treasurer)
[Your contact info]

Thank you!
Tujiimarishe SHG Leadership
```

---

## 🆘 Troubleshooting

### Problem: Member can't login
**Solution:**
1. Check email is correct in Supabase Auth
2. Verify user is confirmed (Auto Confirm was YES)
3. Reset password in Supabase if needed

### Problem: Member sees "Access Denied" in Admin Panel
**Solution:**
- This is correct! Only treasurers should access Admin Panel
- If they should be treasurer, update their `role` in profiles table

### Problem: Profile shows "Not Set" or missing info
**Solution:**
1. Go to Supabase → Table Editor → profiles
2. Find the user
3. Manually enter `full_name` and `phone_number`

---

## 🎊 Ready to Go!

Once all 13 members are set up:
1. ✅ Everyone can login
2. ✅ Members can record contributions
3. ✅ Members can request loans
4. ✅ You (admin) can manage everything
5. ✅ Platform is fully operational!

---

**Questions?** Check the main README.md or contact support.

**Happy managing! 🚀**
