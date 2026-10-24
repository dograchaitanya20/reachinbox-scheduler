# ReachInbox Scheduler - Frontend

Next.js App Router frontend for the cold email scheduler, built with TypeScript (strict), Tailwind CSS, TanStack Query, TipTap rich-text editor, and Sonner toasts.

## Features

- **Google OAuth Login (`/login`)**: Google sign-in integration, disabled email login mockup with tooltip matching Figma design.
- **Scheduled & Sent Tabs (`/scheduled`, `/sent`)**:
  - Pixel font "ONB" logo.
  - Active user card with avatar, name, email, and dropdown menu (Connect/Disconnect Slack, Logout).
  - Outlined green "Compose" pill button.
  - Core navigation items with real-time counts from `/api/counts` (auto-refreshes every 10s).
  - Fully rounded search bar with 300ms debouncing querying `/api/search?q=`, filtered client-side.
  - Filter menu (All / Sent / Failed) and refetch button with spinner.
  - Email rows with recipient, status pill (orange with clock icon and short weekday + seconds timestamp for scheduled, grey for sent, red for failed), bold subject with stripped HTML preview snippet, and localStorage persistent star toggle.
  - Skeleton loading states and empty states.
- **Compose (`/compose`)**:
  - Sender dropdown ("Auto-rotate senders" default or specific sender).
  - Chip input for recipient emails with "+N" collapse, copy-paste extraction, email validation, recipient counter, and CSV/TXT file upload via PapaParse.
  - Delay between emails and hourly rate limit numeric inputs.
  - Full-featured TipTap rich text editor with toolbar (undo, redo, headings, bold, italic, underline, strike, alignment, lists, indentation, blockquotes).
  - "Send Later" popover with date/time picker, quick presets (Tomorrow, Tomorrow 10 AM, etc.), dynamically toggling the button to "Send Later".
  - Validation error handling and redirect to `/scheduled` on success.
- **Email Detail (`/email/[id]`)**:
  - Header with back arrow, subject title, interactive star, disabled archive/trash tooltips, and user avatar.
  - Sender avatar with initial, sender email, recipient, date formatting, and sanitized HTML email body rendered via DOMPurify.

## Getting Started

### 1. Environment Setup

Create `.env.local` inside `/frontend` (or copy `.env.example`):

```bash
cp .env.example .env.local
```

Default contents:
```env
BACKEND_URL=http://localhost:4000
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```
