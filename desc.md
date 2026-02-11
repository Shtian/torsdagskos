# Product Requirements Document (PRD)
## Private Meetup Website

---

## 1. Overview

A private, invite-only website for coordinating monthly recurring meetups among a close group of friends, replacing Facebook Events.

**Goals**
- Make it easy to create, view, and RSVP to meetups
- Reduce noise and reliance on social platforms
- Provide reliable reminders via email and browser notifications

**Non-goals**
- Public event discovery
- Social feeds, comments, or reactions
- Advanced theming or customization
- Abuse prevention or moderation tooling

---

## 2. Assumptions & Constraints

- All users are located in **Oslo, Norway**
- Single timezone: `Europe/Oslo`
- Close, trusted group of friends
- Manual handling of edge cases is acceptable
- Light mode only

---

## 3. Users & Permissions

### Members (everyone)
- View upcoming and past events
- RSVP to events
- See everyone’s RSVP status
- Edit upcoming events
- Automatically send update notifications when events are edited
- Receive all notifications (email and browser, if enabled)
- View personal RSVP history

There is no strict admin role beyond invite creation.

---

## 4. Authentication & Access

- Invite-only access
- Authentication via **Clerk**
- Invites sent via email
- No public pages except a minimal “Invite required / No access” page

---

## 5. Events

### Event Fields
- Title
- Description
- Date & time (Europe/Oslo)
- Location (free text)
- Optional Google Maps link
- Created at
- Last updated at

### Event Lifecycle
- **Upcoming events**
  - Editable by all members
- **Past events**
  - Read-only
  - Cannot be edited or deleted by anyone

### Recurrence
- No recurrence rules
- Events are created manually
- “Duplicate last event” action:
  - Copies title, description, location, and map link
  - Date and time must be manually adjusted

---

## 6. RSVP

- RSVP options:
  - Going
  - Maybe
  - Not going
- Default state: **No response**
- Users may change RSVP until the event date
- All users can see:
  - Individual RSVP statuses
  - Aggregated counts

---

## 7. Notifications

### Channels
- Email
- Browser native notifications (Web Push, explicit opt-in)

### Notification Types (mandatory for all users)
- New event created
- Event updated
- Reminder before event

### Reminder Rules
- Reminder sent at **18:00 local time** the day before the event
- Same behavior for all users

### Event Update Notifications
- Automatically sent on every event edit
- No confirmation or opt-out

### Email Identity
- Friendly “From” name (if supported by provider)
- Single sender address
- Transactional emails only

---

## 8. Pages & Navigation

### Default Landing Page (after login)
- Upcoming events (primary)
- Past events (secondary, most recent first)

### Key Pages
- Events list (upcoming and past)
- Event detail page
- Invite-only access page
- Minimal settings page (browser notification opt-in only)

---

## 9. Past Events & History

- Users can:
  - View past events
  - View their RSVP history
- Past events are immutable snapshots
- Past events are ordered **most recent first**

---

## 10. Design & UX

### Visual Style
- Light mode only
- Primary color: beige / sand
- Accent color: dark green (`#6B705C`)
- Typography:
  - Headings: serif
  - Body: sans-serif

### Design System
- Design tokens defined from day one:
  - Colors
  - Typography
  - Spacing
  - Border radii
- Token structure must allow future theming, but no theming in v1

### UX Principles
- Mobile-first
- Minimal UI and low visual noise
- Calm, friendly tone
- No social or engagement mechanics

---

## 11. Technical Stack

- Astro
- Astro DB
- Clerk (authentication)
- Email provider (TBD)
- Scheduled jobs / cron for reminders
- Service worker for browser notifications

---

## 12. Data Model (High-Level)

- Users
- Events
- RSVPs
- Invites
- Notification delivery log (optional but recommended)

---

## 13. Explicitly Out of Scope (v1)

- Calendar sync (.ics / Google / Apple)
- Notification preferences or customization
- Recurrence rules
- Public pages
- Comments, chat, or reactions
- Dark mode or theming

