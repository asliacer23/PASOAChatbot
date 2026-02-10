# PASOA Student Hub

## Project Overview

**PASOA Student Hub** is a comprehensive student community platform designed for the College of Business Administration (CBA) at PASOA. This web-based platform serves as a centralized hub for student engagement, information management, and administrative communication.

The platform is built on modern web technologies with a focus on user experience, accessibility, and secure data management in compliance with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173).

### Purpose & Goals

- **Centralized Communication**: Provide a single platform for announcements, events, FAQs, and student support
- **Student Empowerment**: Enable students to access information and services in a user-friendly interface
- **Administrative Efficiency**: Streamline how administrators manage announcements, FAQs, events, and student queries
- **24/7 Support**: Offer an intelligent chatbot to answer common student questions instantly
- **Community Building**: Foster a sense of belonging within the PASOA community

---

## Core Features

### 1. **Public Landing Page**
- Server-side rendered landing page for unauthenticated users
- Feature showcase carousel
- Latest announcements preview
- Upcoming events preview
- Call-to-action for sign-up
- Theme toggle (light/dark mode)
- Fully responsive design (mobile & desktop)

### 2. **Authentication & User Management**
- **Sign In/Sign Up**: Secure authentication via Supabase Auth
- **Email Verification**: Verify student email addresses
- **OAuth Integration**: Google OAuth support
- **Profile Management**: Students can manage their profile, upload avatar, and set preferences
- **Role-Based Access Control**: Three roles: Student, Admin, Super Admin
- **Account Suspension**: Admin capability to temporarily suspend user accounts with reason logging

### 3. **Intelligent Chatbot**
- Conversational AI interface for answering student questions
- FAQ-based responses with keyword matching
- Real-time message delivery with typing indicators
- Message reactions (emoji support)
- Image sharing capability within chat
- Admin intervention for escalated queries
- Chat history and conversation management
- Learning from FAQ updates to improve responses

### 4. **FAQ Management System**
- Categorized FAQ database (Internship, Enrollment, Events, Requirements, General)
- Full-text search with keyword matching
- View count tracking for analytics
- Admin interface to create, edit, and archive FAQs
- Public browsing available to all authenticated users
- Icon-based category visualization

### 5. **Announcements Center**
- **Publishing**: Create and schedule announcements
- **Categorization**: Color-coded categories (Academic, Events, General, Urgent, Facilities)
- **Targeting**: Send announcements to specific student segments
- **Pinning**: Highlight important announcements
- **Urgency Marking**: Visual distinction for time-sensitive announcements
- **Read Tracking**: Track which students have read announcements
- **Expiration**: Set announcement expiration dates
- **Public Feed**: View all published announcements

### 6. **Events Management**
- Create, publish, and manage campus events
- Event registration system with capacity limits
- Featured events on landing page
- Attendee tracking
- Event categorization
- Event images and descriptions
- Automatic notifications when events are published
- View registered attendees (admin)

### 7. **Student Dashboard**
- Personalized welcome with time-based greeting
- Quick action cards for common tasks
- Latest announcements feed
- Event registration highlights
- Notification center
- Recent chat conversations
- Profile and settings access
- PASOA mascot with multiple moods and animations

### 8. **User Preferences & Settings**
- **Theme Selection**: Light/dark mode toggle
- **Notification Settings**: Control which notifications to receive
- **Display Preferences**: Font size and layout density options
- **Accent Color**: Customizable accent color
- **Profile Settings**: Update personal information and avatar

### 9. **Admin Dashboard**
- Comprehensive admin control panel (admin/super_admin only)
- Analytics and activity monitoring
- User management and role assignment
- Announcement creation and management
- FAQ administration
- Event management
- Event registration viewing
- Conversation oversight
- Activity logging for security

### 10. **Real-Time Notifications**
- Push notifications for announcements
- Event publication alerts
- Chat message notifications
- Admin message alerts
- Customizable notification preferences
- Unread notification badge

---

## Technology Stack

### Frontend
```json
{
  "framework": "React 18.3.1 with TypeScript",
  "build_tool": "Vite 5.x",
  "routing": "React Router DOM 6.30.1",
  "state_management": "TanStack React Query 5.83.0",
  "styling": "Tailwind CSS 3.4.1",
  "ui_components": "Shadcn/ui with Radix UI primitives",
  "icons": "Lucide React 0.462.0",
  "forms": "React Hook Form 7.61.1",
  "validation": "Zod TypeScript-first schema validation",
  "theming": "next-themes 0.4.6",
  "date_utils": "date-fns 3.6.0",
  "carousel": "Embla Carousel 8.6.0",
  "charts": "Recharts 2.15.4",
  "testing": "Vitest with example tests"
}
```

### Backend & Database
```json
{
  "backend": "Supabase (PostgreSQL + Real-time API)",
  "auth": "Supabase Auth with JWT tokens",
  "storage": "Supabase Storage (images, PDFs, documents)",
  "database": "PostgreSQL with Row-Level Security",
  "functions": "Supabase Functions (serverless)",
  "real_time": "Supabase Realtime websockets"
}
```

### Code Quality
```json
{
  "linter": "ESLint",
  "package_manager": "Bun",
  "postcss": "PostCSS with plugins"
}
```

---

## Database Schema

### Core Entities

#### 1. **profiles**
Extends Supabase auth.users with additional student information.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, references auth.users(id) |
| student_id | VARCHAR(20) | Unique student identifier |
| first_name | VARCHAR(100) | Student first name |
| last_name | VARCHAR(100) | Student last name |
| email | VARCHAR(255) | Student email |
| avatar_url | TEXT | URL to profile avatar image |
| program | VARCHAR(50) | Academic program (e.g., BSOA, BSBA) |
| year_level | SMALLINT | Academic year (1-4) |
| status | ENUM | active / inactive / suspended |
| suspension_reason | TEXT | Reason for account suspension |
| last_login_at | TIMESTAMPTZ | Last login timestamp |
| created_at | TIMESTAMPTZ | Account creation date |
| updated_at | TIMESTAMPTZ | Last profile update |

**Relationships**: References auth.users; referenced by user_roles, user_preferences, faqs, conversations, messages, etc.

#### 2. **user_roles**
Maps users to their app roles. Prevents privilege escalation by separating roles from profiles (4NF).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References profiles(id) |
| role | ENUM | student / admin / super_admin |
| created_at | TIMESTAMPTZ | Role assignment date |

**Constraints**: UNIQUE(user_id, role) - prevents duplicate role assignments

#### 3. **user_preferences**
Stores user display and notification settings (4NF normalization).

| Column | Type | Description |
|--------|------|-------------|
| user_id | UUID | Primary key, references profiles(id) |
| theme | VARCHAR(10) | light / dark |
| accent_color | VARCHAR(20) | Customizable accent color |
| font_size | VARCHAR(10) | small / medium / large |
| layout_density | VARCHAR(15) | comfortable / compact |
| notifications_announcements | BOOLEAN | Receive announcement notifications |
| notifications_chat_replies | BOOLEAN | Receive chat reply notifications |
| created_at | TIMESTAMPTZ | Preference creation date |
| updated_at | TIMESTAMPTZ | Last updated |

---

### FAQ Management

#### 4. **faq_categories**
Groups FAQs by topic for better organization and navigation.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(100) | Category name (e.g., Internship) |
| slug | VARCHAR(100) | URL-friendly slug |
| description | TEXT | Category description |
| icon | VARCHAR(50) | Icon name from Lucide (e.g., Briefcase) |
| display_order | SMALLINT | Sort order in UI |
| is_active | BOOLEAN | Show/hide category |
| created_at | TIMESTAMPTZ | Creation date |
| updated_at | TIMESTAMPTZ | Last update |

**Indexes**: UNIQUE(name), UNIQUE(slug)

#### 5. **faqs**
Frequently asked questions database with search optimization.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| category_id | UUID | References faq_categories(id) |
| question | TEXT | FAQ question text |
| answer | TEXT | FAQ answer text |
| keywords | TEXT[] | Array of search keywords |
| view_count | INTEGER | Number of views |
| match_count | INTEGER | Chatbot match count |
| is_active | BOOLEAN | Published status |
| is_archived | BOOLEAN | Soft delete flag |
| created_by | UUID | Admin who created |
| updated_by | UUID | Admin who last updated |
| created_at | TIMESTAMPTZ | Creation date |
| updated_at | TIMESTAMPTZ | Last update |

**Indexes**: 
- idx_faqs_category (category_id)
- idx_faqs_active (is_active) filtered
- idx_faqs_keywords (GIN index for full-text search)

---

### Chat & Conversations

#### 6. **conversations**
User chat sessions with the chatbot or admin support team.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References profiles(id) |
| title | VARCHAR(255) | Conversation title |
| status | VARCHAR(20) | active / closed / escalated |
| requires_admin | BOOLEAN | Needs human intervention |
| assigned_admin_id | UUID | Admin handling conversation |
| created_at | TIMESTAMPTZ | Conversation start |
| updated_at | TIMESTAMPTZ | Last activity |
| closed_at | TIMESTAMPTZ | Closure timestamp |

#### 7. **messages**
Individual chat messages within conversations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| conversation_id | UUID | References conversations(id) |
| sender_type | VARCHAR(10) | user / bot / admin |
| sender_id | UUID | References profiles(id) |
| content | TEXT | Message text |
| image_url | TEXT | Attached image URL |
| matched_faq_id | UUID | FAQ matched by chatbot |
| is_read | BOOLEAN | Message read status |
| created_at | TIMESTAMPTZ | When sent |

#### 8. **message_reactions**
Emoji reactions on messages for social engagement.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| message_id | UUID | References messages(id) |
| user_id | UUID | References profiles(id) |
| reaction | TEXT | Emoji character/code |
| created_at | TIMESTAMPTZ | When reacted |

**Constraints**: UNIQUE(message_id, user_id) - one reaction per user per message

#### 9. **typing_status**
Real-time typing indicators showing who is currently typing.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| conversation_id | UUID | References conversations(id) |
| user_id | UUID | References profiles(id) |
| is_typing | BOOLEAN | Typing status |
| updated_at | TIMESTAMPTZ | Last update |

**Constraints**: UNIQUE(conversation_id, user_id) - one row per user per conversation

---

### Announcements

#### 10. **announcement_categories**
Color-coded categories for announcements.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(100) | Category name |
| color | VARCHAR(20) | Display color (e.g., blue, red) |
| created_at | TIMESTAMPTZ | Creation date |

#### 11. **announcements**
Published announcements and news for students.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| category_id | UUID | References announcement_categories(id) |
| title | VARCHAR(255) | Announcement title |
| content | TEXT | Full announcement text |
| is_pinned | BOOLEAN | Show at top of feed |
| is_urgent | BOOLEAN | Mark as important/urgent |
| is_published | BOOLEAN | Published status |
| scheduled_at | TIMESTAMPTZ | Schedule publication time |
| published_at | TIMESTAMPTZ | Actual publication time |
| expires_at | TIMESTAMPTZ | When announcement expires |
| created_by | UUID | Admin who created |
| updated_by | UUID | Admin who last updated |
| created_at | TIMESTAMPTZ | Creation date |
| updated_at | TIMESTAMPTZ | Last update |

**Indexes**:
- idx_announcements_published (is_published, published_at DESC)
- idx_announcements_pinned (is_pinned) filtered

#### 12. **announcement_targets**
Specify which student segments receive each announcement.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| announcement_id | UUID | References announcements(id) |
| target_type | VARCHAR(20) | year_level / program / all_students |
| target_value | VARCHAR(50) | Specific value (e.g., 2nd year, BSOA) |

**Constraints**: UNIQUE(announcement_id, target_type, target_value)

#### 13. **announcement_reads**
Track which students have read each announcement.

| Column | Type | Description |
|--------|------|-------------|
| announcement_id | UUID | References announcements(id) |
| user_id | UUID | References profiles(id) |
| read_at | TIMESTAMPTZ | When read |

**Primary Key**: (announcement_id, user_id)

---

### Events

#### 14. **events**
Campus events and activities.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Event name |
| description | TEXT | Event details |
| event_date | TIMESTAMPTZ | Event start time |
| end_date | TIMESTAMPTZ | Event end time |
| location | TEXT | Event location |
| image_url | TEXT | Event poster/image |
| category | TEXT | Event type/category |
| is_featured | BOOLEAN | Show on landing page |
| is_published | BOOLEAN | Published status |
| max_attendees | INTEGER | Capacity limit |
| created_by | UUID | Admin who created |
| created_at | TIMESTAMPTZ | Creation date |
| updated_at | TIMESTAMPTZ | Last update |

#### 15. **event_registrations**
Student registrations for events.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| event_id | UUID | References events(id) |
| user_id | UUID | References profiles(id) |
| registered_at | TIMESTAMPTZ | Registration time |
| status | TEXT | registered / checked_in / cancelled |

**Constraints**: UNIQUE(event_id, user_id) - one registration per student per event

---

### Content & Files

#### 16. **content_files**
Uploaded documents and resources.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | File name |
| file_path | TEXT | Path in storage bucket |
| file_type | TEXT | MIME type |
| file_size | INTEGER | File size in bytes |
| category | TEXT | Document category |
| uploaded_by | UUID | References profiles(id) |
| created_at | TIMESTAMPTZ | Upload time |
| updated_at | TIMESTAMPTZ | Last update |

---

### System & Analytics

#### 17. **activity_logs**
Audit trail for system activities and user actions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References profiles(id) |
| action | VARCHAR(50) | Action performed (e.g., login, create) |
| entity_type | VARCHAR(50) | Type of entity (announcement, faq, etc.) |
| entity_id | UUID | ID of affected entity |
| details | JSONB | Additional action details |
| ip_address | INET | User IP address |
| user_agent | TEXT | Browser user agent |
| created_at | TIMESTAMPTZ | When action occurred |

**Indexes**: idx_activity_logs_user, idx_activity_logs_created (DESC)

#### 18. **notifications**
System notifications for users.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References profiles(id) |
| type | VARCHAR(50) | announcement / event / message / admin |
| title | VARCHAR(255) | Notification title |
| message | TEXT | Notification content |
| link | TEXT | Navigation link |
| is_read | BOOLEAN | Read status |
| created_at | TIMESTAMPTZ | Creation time |

**Indexes**: idx_notifications_user_unread (user_id, is_read) filtered

---

## Storage Buckets (Supabase Storage)

### 1. **avatars**
- **Path**: `avatars/{user_id}/{filename}`
- **Purpose**: User profile avatar images
- **Permissions**: Public read; users can upload/update/delete own
- **Size Limit**: 10MB (configurable)

### 2. **content-uploads**
- **Path**: `content-uploads/{filename}`
- **Purpose**: Admin-uploaded documents, PDFs, announcements
- **Permissions**: Public read; admins can upload/update/delete
- **Size Limit**: 10MB
- **Allowed Types**: JPEG, PNG, GIF, WebP, PDF, Word documents

### 3. **chat-images**
- **Path**: `chat-images/{conversation_id}/{filename}`
- **Purpose**: Images shared in chat conversations
- **Permissions**: Public read; authenticated users can upload
- **Size Limit**: 5MB
- **Allowed Types**: JPEG, PNG, GIF, WebP

---

## Row-Level Security (RLS) Architecture

The database uses PostgreSQL Row-Level Security to enforce data access control:

### Security Roles
- **Anonymous**: Can only view public data
- **Authenticated Users**: Can access announcements, events, FAQs, and manage own data
- **Admin**: Can manage announcements, FAQs, events, and view activity logs
- **Super Admin**: Full database access and privilege management

### Key RLS Policies

**Profiles**
- Users can view all profiles
- Users can only update own profile
- Admins can update any profile (for suspension, etc.)

**FAQs**
- All authenticated users can view active FAQs
- Only admins can create, edit, delete FAQs

**Announcements**
- Authenticated users see only published announcements
- Admins see all announcements (draft, scheduled, published)
- Only admins can create/edit announcements

**Conversations & Messages**
- Users can only access their own conversations
- Admins can view all conversations
- Only message sender can edit their message

**Events**
- Published events visible to all
- Only admins can manage events
- Users can register for events

---

## API Endpoints & Realtime Features

### Realtime Subscriptions (via Supabase)
- **Messages**: New messages stream in real-time
- **Typing Status**: Live typing indicators
- **Notifications**: Push notifications as they're created
- **Announcements**: Auto-update when admins publish

### Server-Side Functions
- **Notifications on announcement**: Automatic trigger when announcement published
- **Notifications on event**: Automatic trigger when event published
- **Profile creation**: Auto-create on user signup
- **Default preferences**: Auto-assign on signup
- **Default role**: Auto-assign 'student' role on signup

### Query Optimization
- Indexed searches on frequently filtered columns
- GIN indexes for full-text FAQ search
- Partial indexes on boolean flags (is_published, is_pinned)
- Materialized views for analytics (optional)

---

## File Structure

```
src/
├── features/              # Feature-based folder structure
│   ├── auth/             # Authentication pages and hooks
│   │   ├── components/   # AuthPage, SuspendedPage, TermsOfService, PrivacyPolicy
│   │   ├── hooks/        # useAuth, useAuthForm
│   │   └── index.ts
│   ├── landing/          # Public landing page
│   │   ├── components/   # LandingPage, QuestionsCarousel, FeaturedAnnouncements, FeaturedEvents
│   │   └── index.ts
│   ├── dashboard/        # Student dashboard
│   │   ├── components/   # StudentDashboard with announcements and actions
│   │   └── index.ts
│   ├── chat/             # Chat interface and chatbot
│   │   ├── components/   # ChatPage
│   │   ├── hooks/        # useChatMessages, useSmartResponses
│   │   └── index.ts
│   ├── faq/              # FAQ management and browsing
│   │   ├── components/   # FAQCenter with search and categories
│   │   └── index.ts
│   ├── announcements/    # Announcements feed
│   │   ├── components/   # AnnouncementsList
│   │   └── index.ts
│   ├── events/           # Event listing and registration
│   │   ├── components/   # UpcomingEvents, EventDetails
│   │   └── index.ts
│   ├── profile/          # User profile settings
│   │   ├── components/   # ProfileSettings with avatar upload
│   │   └── index.ts
│   ├── settings/         # Application settings
│   │   └── components/
│   ├── admin/            # Admin dashboard and management
│   │   ├── components/   # AdminDashboard, user management, analytics
│   │   └── index.ts
│   └── shared/           # Shared layout and UI components
│       ├── components/   # AppLayout, Headers, Navigation, NotificationCenter
│       └── index.ts
├── components/           # Shadcn/ui reusable components
│   └── ui/              # Accordion, Alert, Button, Card, Dialog, etc.
├── hooks/               # Custom React hooks
│   ├── use-mobile.tsx   # Responsive mobile detection
│   └── use-toast.ts     # Toast notifications
├── integrations/        # External service integrations
│   └── supabase/        # Supabase client setup
├── lib/                 # Utility functions
│   └── utils.ts         # Helper utilities
├── pages/               # Page wrappers (if needed)
│   └── NotFound.tsx
├── App.tsx              # Main app with routing
├── main.tsx             # React DOM root
├── index.css            # Global styles and animations
└── vite-env.d.ts        # Vite type definitions
```

---

## Installation & Setup

### Prerequisites
- Node.js 18+ or Bun 1.0+
- Supabase account and project
- Git for version control

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd schema-weaver-main

# Install dependencies with Bun
bun install

# Or with npm
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these credentials from your Supabase project settings.

### 3. Database Setup

The database schema is automatically created via Supabase migrations:

```bash
# Apply migrations (handled by Supabase CLI)
supabase migration up
```

If you're setting up a new Supabase project, run the migration files in order:
1. `20260130144850_...sql` - Core schema
2. `20260130144911_...sql` - Security fixes
3. `20260130153935_...sql` - Storage buckets
4. `20260131125352_...sql` - Events and avatars
5. `20260131132638_...sql` - Typing status constraint
6. `20260131135727_...sql` - Message reactions and notifications
7. `20260201000001_...sql` - Admin profile policy

### 4. Run Development Server

```bash
# Start dev server
bun run dev

# Or with npm
npm run dev
```

Server runs at `http://localhost:5173`

### 5. Build for Production

```bash
# Build optimized bundle
bun run build

# Preview production build locally
bun run preview
```

---

## Development Commands

```bash
# Development
bun run dev          # Start development server
bun run dev:debug    # Start with debug mode

# Building
bun run build        # Production build
bun run build:dev    # Development build with source maps
bun run preview      # Preview production build

# Code Quality
bun run lint         # Run ESLint
bun run lint:fix     # Fix linting issues

# Testing
bun run test         # Run tests once
bun run test:watch   # Run in watch mode

# Database (with Supabase CLI)
supabase start       # Start local dev environment
supabase migration new <name>  # Create new migration
supabase push        # Push migrations to production
```

---

## Authentication Flow

### Sign-Up Process
1. User fills signup form with email
2. Confirm password and accept terms
3. Email verification sent (Supabase Auth)
4. Auto-create profile with default student role
5. Auto-create preferences with defaults
6. Redirect to dashboard on success

### Sign-In Process
1. Email/password or Google OAuth
2. JWT token issued by Supabase
3. Token stored in browser (secure)
4. Redirect to dashboard
5. RLS policies enforce data access

### Role Assignment
- New users: Auto-assigned 'student' role
- Admin promotion: Manual assignment by super_admin
- Role stored in `user_roles` table (4NF normalized)

### Account Suspension
- Admin can suspend accounts from user management
- Suspended users cannot log in
- Suspension reason is logged in profiles.suspension_reason
- Users see "Account Suspended" page with contact info

---

## Data Privacy & Compliance

### Data Collection
- Name, email, student ID
- Chat history and messages
- Uploaded images
- Login activity
- Browser user agent

### Data Usage
- Answering student questions (chatbot)
- Administrative communication
- Analytics and reporting
- Compliance with university regulations

### Data Protection
- Encrypted in transit (HTTPS)
- Row-Level Security enforces access
- User data cannot be accessed by other students
- Admin data segregated from student data

### Data Retention
- Chat logs: Retained per university policy (default: 1 year)
- Activity logs: 6 months
- User profiles: Until account deletion
- Images: Until user deletion or manual removal

### User Rights
- **Right to Access**: Request export of personal data
- **Right to Deletion**: Request account and data deletion
- **Right to Correction**: Update own profile information
- Contact: support@pasoahub.edu.ph

---

## Deployment

### Deploy to Netlify (Recommended)
1. Push code to GitHub
2. Connect repository to Netlify
3. Set build command: `bun run build`
4. Set publish directory: `dist`
5. Add environment variables in Netlify dashboard
6. Deploy! (CI/CD automatic)

### Environment Variables for Production
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
```

### Production Checklist
- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] RLS policies enabled and tested
- [ ] HTTPS enforced
- [ ] CORS configured for your domain
- [ ] Email notifications configured
- [ ] Error monitoring (Sentry) set up
- [ ] Analytics configured
- [ ] Terms and Privacy Policy reviewed

---

## Performance Optimizations

### Frontend
- Code splitting with React Router
- Lazy loading of route components
- Image optimization (next-gen formats)
- CSS minification
- Tree shaking of unused code

### Database
- Indexed queries for common searches
- GIN indexes for full-text FAQ search
- Partial indexes on boolean flags
- Connection pooling via Supabase

### Caching
- Browser cache for static assets
- React Query caching of API responses
- Supabase real-time subscriptions avoid polling

---

## Troubleshooting

### Common Issues

**"VITE_SUPABASE_URL not found"**
- Ensure `.env.local` exists with correct keys
- Keys must start with `VITE_` to be accessible in frontend

**"RLS policy violation error"**
- Check user role in `user_roles` table
- Verify RLS policy matches your access intent
- Cannot read other users' private data

**"Image upload fails"**
- Check file size (5MB for chat, 10MB for content)
- Verify allowed MIME types
- Check storage bucket permissions

**"Chatbot not responding"**
- Verify FAQs exist and are active
- Check conversation matches requirement
- View admin dashboard for error logs

**"Styling issues on mobile"**
- Clear browser cache
- Check Tailwind responsive classes
- Verify viewport meta tag in index.html

---

## Contributing

### Development Workflow
1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit: `git commit -am 'Add feature'`
3. Push to GitHub: `git push origin feature/my-feature`
4. Create Pull Request with description

### Code Style
- Use TypeScript for type safety
- Follow ESLint rules
- Use shadcn/ui components
- Tailwind classes for styling
- Functional components with hooks

### Testing
Written tests should cover:
- User authentication flows
- Data mutations
- Error states
- Accessibility

---

## Support & Contact

- **Email**: support@pasoahub.edu.ph
- **Issues**: GitHub Issues tab
- **Documentation**: This README and inline comments
- **Admin Help**: In-app help center

---

## License

PASOA Student Hub is provided for PASOA members use.

---

## Credits

**Built with** 
- React + TypeScript + Vite
- Supabase for backend & database
- Shadcn/ui for beautiful components
- Tailwind CSS for styling
- Lucide React for icons

**Maintained by PASOA Admin Team**

---

## Changelog

### Version 1.0.0 (February 2026)
- ✅ Initial public release
- ✅ Core features: Auth, Chat, Announcements, Events, FAQs
- ✅ Admin dashboard
- ✅ Mobile responsiveness
- ✅ Theme switching
- ✅ Real-time notifications
- ✅ Privacy & security compliance

---

**Last Updated**: February 1, 2026

For the latest updates, visit the [GitHub repository](https://github.com/pasoa/student-hub) or contact the PASOA Admin Team.