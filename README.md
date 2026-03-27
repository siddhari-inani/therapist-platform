# Revora Health - Therapist Practice Management Platform

A modern, HIPAA-compliant practice management platform for physical therapists built with Next.js, TypeScript, and Supabase. Features comprehensive patient management, appointment scheduling, SOAP note charting, messaging, and AI-powered assistance.

## Features

### Core Functionality
- 📊 **Dashboard**: Overview of appointments, patients, and practice statistics
- 👥 **Patient Management**: Complete patient profiles with medical history
- 📅 **Calendar & Appointments**: Drag-and-drop scheduling with calendar view
- 📝 **SOAP Charting**: Comprehensive SOAP note editor with templates and body map
- 💬 **Messaging**: Secure messaging between therapists and patients
- 🎯 **Recovery Milestones**: Track patient recovery progress with milestones
- 🤖 **AI Assistant**: Clara - AI-powered assistant for navigation and patient summaries

### Enhanced Features (Latest)
- 🔔 **Toast Notifications**: Beautiful, non-intrusive notifications for all actions
- 🌙 **Dark Mode**: System-aware theme toggle with persistent preferences
- ⚠️ **Error Boundaries**: Graceful error handling with user-friendly messages
- 💀 **Loading Skeletons**: Professional loading states for better UX
- 🔍 **Enhanced Search**: Improved search with clear functionality
- ♿ **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- ✅ **Form Validation**: Better form inputs with proper labels and validation

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Notifications**: Sonner
- **Theming**: next-themes

## Project Structure

```
therapist-platform/
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   ├── dashboard/          # Dashboard pages
│   ├── login/              # Authentication pages
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── ui/                 # Reusable UI components
│   ├── dashboard/          # Dashboard-specific components
│   ├── patients/           # Patient management components
│   ├── calendar/           # Calendar components
│   └── charting/           # SOAP note components
├── lib/                    # Utility functions
│   └── supabase/           # Supabase client setup
├── types/                  # TypeScript type definitions
└── supabase/               # Database migrations
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd therapist-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run database migrations**
   Apply the migrations in the `supabase/migrations/` directory to your Supabase project.

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Creating a Test User

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter:
   - Email: `therapist@example.com`
   - Password: `Therapist123!`
   - Auto Confirm: ✅
   - User Metadata: `{"role": "therapist", "full_name": "Dr. Jane Smith"}`
4. Log in with these credentials

## Recent Enhancements

See [`ENHANCEMENTS.md`](ENHANCEMENTS.md) for a complete list of recent improvements including:
- Toast notification system
- Dark mode toggle
- Error boundaries
- Loading skeletons
- Enhanced search
- Improved accessibility
- Form validation

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting (recommended)
- Component-based architecture

## Deployment

See **[GO_LIVE.md](GO_LIVE.md)** for a step-by-step guide to deploy to production (Vercel, Supabase auth redirect URLs, env vars, and optional custom domain).

**Quick summary:**
1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com) and add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. In Supabase: set **Site URL** and **Redirect URLs** to your production URL
4. Deploy

Copy `.env.example` to `.env.local` for local development; use the same variable names in your host’s environment for production.

## Documentation

- [`ENHANCEMENTS.md`](ENHANCEMENTS.md) - Recent enhancements and features
- [`QUICK_SETUP.md`](QUICK_SETUP.md) - Quick setup guide
- [`SETUP_AUTH.md`](SETUP_AUTH.md) - Authentication setup
- [`SUPABASE_SETUP_COMPLETE.md`](SUPABASE_SETUP_COMPLETE.md) - Supabase configuration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available for use.

## Support

For questions or support, please open an issue on GitHub or contact the development team.
