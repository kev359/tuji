# TUJIIMARISHE - Next.js Version

**Modern web application for managing self-help group finances**

## 🚀 Tech Stack

- **Frontend:** Next.js 15 (React 19)
- **Styling:** Tailwind CSS + Custom CSS Variables
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **Language:** JavaScript (ES6+)
- **Deployment:** Vercel (recommended) or Netlify

## 📦 Features

✅ **Member Portal**
- Personal dashboard with real-time financial overview
- Contribution tracking (Table Banking & Bank Savings)
- Loan request system with automatic 10% interest calculation
- View all group members

✅ **Treasurer Admin Panel**
- Confirm member contributions
- Approve/reject loan requests
- Record loan payments
- Comprehensive dashboard with pending actions

✅ **Security**
- Row-level security (RLS)
- Secure authentication
- Role-based access control

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

The database schema is already set up in your Supabase project. If you need to recreate it, run the SQL from `../db/schema.sql` in your Supabase SQL Editor.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
tuj-nextjs/
├── app/
│   ├── page.js                 # Login page
│   ├── layout.js               # Root layout
│   ├── globals.css             # Global styles
│   ├── dashboard/
│   │   └── page.js            # Member dashboard
│   ├── contributions/
│   │   └── page.js            # Contributions page
│   ├── loans/
│   │   └── page.js            # Loans page
│   ├── members/
│   │   └── page.js            # Members directory
│   └── admin/
│       └── page.js            # Admin panel (treasurer only)
├── components/
│   └── Navbar.js              # Navigation component
├── lib/
│   └── supabase.js            # Supabase client
├── .env.local                 # Environment variables
└── package.json
```

## 🎨 Design System

### Colors
- **Primary Green:** `#2E7D32`
- **Gold Accent:** `#FFD700`
- **Light Green:** `#E8F5E9`

### Typography
- **Font:** Inter (Google Fonts)
- Responsive sizing with CSS variables

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Deploy!

### Netlify

1. Build the project: `npm run build`
2. Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

3. Deploy to Netlify

## 🔐 User Roles

### Member
- View personal dashboard
- Record contributions
- Request loans
- View members

### Treasurer
- All member permissions
- Confirm contributions
- Approve/reject loans
- Record payments
- Access admin panel

## 📝 Key Differences from HTML Version

### Advantages
1. ✅ **Better Performance** - Server-side rendering, code splitting
2. ✅ **Modern Development** - React hooks, component reusability
3. ✅ **Better SEO** - Server-side rendering
4. ✅ **Type Safety** - Can easily add TypeScript
5. ✅ **Hot Reload** - Instant updates during development
6. ✅ **Image Optimization** - Built-in Next.js features
7. ✅ **API Routes** - Can add backend logic easily

### Same Features
- ✅ All business logic preserved
- ✅ Same UI/UX design
- ✅ Same database schema
- ✅ Same Supabase backend
- ✅ Same security model

## 🐛 Troubleshooting

**Problem:** "Module not found: Can't resolve '@/lib/supabase'"
- **Solution:** Make sure `jsconfig.json` has the correct path alias

**Problem:** "NEXT_PUBLIC_SUPABASE_URL is undefined"
- **Solution:** Restart the dev server after adding `.env.local`

**Problem:** Can't access admin panel
- **Solution:** Ensure user role is 'treasurer' in Supabase profiles table

## 📞 Support

For issues or questions:
1. Check this README
2. Review Next.js documentation: https://nextjs.org/docs
3. Check Supabase documentation: https://supabase.com/docs

---

**Built with ❤️ for TUJIIMARISHE**
