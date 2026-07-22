# Calendar Project Overview

## What the Project Is

The Calendar Project is a custom-built, offline-first personal planning application designed to bring scheduling, budgeting, reminders, collaboration, and daily organization into one unified workspace.

Rather than behaving like a traditional calendar that simply stores dates and times, the project acts more like a personal command center. Events can be visually connected across a week, shared with other users, synchronized between devices, paired with reminders, searched quickly, and tied into supporting tools such as budgeting and receipt tracking.

The application is built as a single-page Progressive Web App using vanilla HTML, CSS, and JavaScript. It is designed to work on both desktop and mobile devices, remain functional without an internet connection, and synchronize changes with the cloud when a connection becomes available.

---

## Project Goals

The project is being built around several central goals:

- Create a calendar that is visually expressive rather than limited to standard event blocks.
- Preserve a fast, local-first experience even when the user is offline.
- Allow data to synchronize safely between multiple devices.
- Support both private calendars and collaborative shared calendars.
- Combine scheduling with related personal tools instead of requiring several disconnected apps.
- Remain customizable, expandable, and understandable without relying on a large framework.
- Grow into a polished portfolio project that demonstrates real application architecture, synchronization, security, and user-experience design.

---

## Core Calendar Experience

The application currently supports several ways to view and manage scheduled information.

### Calendar Views

- Month view
- Week view
- Day view
- List view
- Mobile-friendly compact layouts
- Responsive resizing when side panels or editors are opened and collapsed

### Event Management

Users can:

- Create, edit, move, and delete events
- Assign dates, times, colors, categories, and other event details
- Create recurring events
- Drag events between dates and times
- Use quick-add tools to create events faster
- Search for existing events
- Use keyboard shortcuts for common actions
- Undo and redo supported changes
- Save event-specific reminders
- Choose whether an event belongs to a personal or shared calendar

### Recurring Events

The project includes a custom recurrence engine capable of resolving repeating events inside the calendar rather than relying entirely on an external calendar provider.

This allows repeating events to participate in:

- Calendar rendering
- Reminder calculations
- Search results
- Editing workflows
- Cloud synchronization
- Shared calendar behavior

---

## Visual Week Connections

One of the calendar's most distinctive systems is its visual event-connection feature.

Events within the week view can be connected using colored paths that travel between event pills. These paths help represent relationships, sequences, routines, projects, travel plans, or other multi-event chains.

The connection system currently includes:

- Colored event-to-event lines
- Independent connection keys and colors
- Horizontal and vertical routing
- Multiple routing lanes to reduce overlap
- Visual bridges where paths cross
- Solid and dashed line styles
- Highlighted or glowing paths when selected
- Dynamic recalculation when the layout changes
- Scroll-aware positioning
- Mobile-specific behavior
- Controls for editing and removing connections

This feature gives the calendar a circuit-board or transit-map quality, allowing related events to be understood at a glance.

---

## Shared and Collaborative Calendars

The application supports both personal and shared calendars.

### Shared Calendar Features

- Create collaborative calendars
- Invite other users by email
- Accept or decline invitations
- Assign owner, editor, or viewer roles
- View shared events alongside personal events
- Edit shared calendars when permission allows
- Prevent viewers from changing protected data
- Choose an event's destination calendar from the editor
- Display permission and calendar-type badges
- Synchronize shared changes in near real time
- Clear shared data safely during logout or account changes

### Permission Roles

**Owner**

- Full control over the shared calendar
- Can manage events and membership
- Can assign or change roles

**Editor**

- Can create and modify shared events
- Cannot perform owner-only administrative actions

**Viewer**

- Can see shared calendar events
- Cannot modify the calendar

The shared calendar system is protected through Supabase Row Level Security policies and server-side database rules rather than relying only on hidden interface controls.

---

## Offline-First Storage

The application is designed to remain useful even when the internet disappears.

### IndexedDB

Calendar data is stored locally using IndexedDB in a database named:

`myCalendarOfflineDB`

The local database holds separated data slices rather than one enormous saved object. This improves performance, reduces unnecessary writes, and makes synchronization more precise.

Locally stored information includes areas such as:

- Events
- Calendar settings
- Categories
- Budget information
- Receipt-learning data
- Shared calendar information
- Synchronization metadata

### Offline Behavior

- The application can open and function without a network connection.
- Changes can be saved locally before reaching the cloud.
- A synchronization queue records pending changes.
- Queued changes are sent when connectivity returns.
- The application can determine whether the local or cloud copy is newer.
- Device-adoption logic helps prevent one device from overwriting another with stale information.
- Logout and account-switching routines clear protected local stores when required.

---

## Cloud Synchronization

Supabase is used as the project's cloud backend.

The current synchronization system includes:

- User authentication
- Row-based synchronization
- Per-record updates instead of replacing the entire calendar
- A local sync queue
- Device and baseline tracking
- Conflict-prevention logic
- Shared calendar membership
- Realtime collaborative updates
- Row Level Security
- Recovery and cloud pull/push controls
- Separation between personal and shared information

The shift from whole-state synchronization to row-based synchronization was an important architectural upgrade. It allows the application to scale more safely because one small event change no longer requires the complete calendar database to be uploaded again.

---

## Notifications and Reminders

The project includes an event-reminder system.

Current reminder behavior includes:

- Browser notification permission controls
- Event reminder times
- In-tab reminder polling
- Duplicate-notification prevention
- Catch-up checks after the application reopens
- Skipping reminders that are too old to remain useful
- Resolving reminders for recurring events
- Toast messages inside the application
- Debug tools for testing reminder behavior
- Offline reminder settings

The application also explains the relationship between browser notification permission and offline reminder behavior, since browser-level permission is required before some notification features can function.

A more advanced server-driven Web Push architecture has also been designed for future expansion, including service-worker delivery, VAPID keys, scheduled server checks, and Supabase Edge Functions.

---

## Budgeting System

The application contains a built-in personal budget section so financial planning can live beside scheduled plans.

Current budget features include:

- Income tracking
- Expense tracking
- Budget categories
- Recurring transactions
- Transaction editing
- Duplicate-detection logic
- Category totals and breakdowns
- Searchable transactions
- Repeat options for new transactions
- Budget-sourced calendar information where appropriate

The budget system is part of the same application but is logically separated from normal calendar events so financial information is not accidentally exposed through shared calendar views.

---

## Receipt Scanning and Learning

The budget system includes an OCR-assisted receipt workflow.

The receipt system can:

- Read receipt text
- Identify likely merchants
- Detect totals, taxes, gratuities, and line items
- Prefer stronger total indicators such as “Total Paid”
- Suggest transaction categories
- Learn merchant aliases
- Learn from corrected categories
- Save receipt-training records
- Strengthen successful predictions
- Weaken incorrect predictions
- Use phrase, word, merchant, and amount-based scoring
- Apply a lightweight Naive Bayes classification model when enough training data exists

The system is not merely a fixed list of rules. It gradually builds a local memory from the user's corrections and prior receipts, creating a small personalized classification engine.

---

## Search and Quick Navigation

The application includes global search and navigation tools.

Users can search for:

- Calendar events
- Recurring event instances
- Shared events
- Budget transactions

Search results can route the user toward the relevant part of the application, such as opening an event or moving to the budget area for a transaction.

Additional navigation features include:

- Top-level view switching
- Collapsible editing panels
- Keyboard shortcuts
- Quick-add controls
- Category filters
- Mobile navigation behavior
- Context-sensitive editing

---

## Weather Integration

Weather data can be displayed inside the calendar using Open-Meteo.

This allows scheduled plans to be viewed alongside forecast information without requiring a separate weather application.

The weather system is designed as a supporting layer rather than part of the user's saved event data.

---

## Progressive Web App Features

The project functions as a Progressive Web App.

Current PWA-related features include:

- Installable browser experience
- Mobile home-screen access
- Service-worker caching
- Offline loading
- Versioned cache updates
- Responsive desktop and mobile layouts
- Touch-friendly controls
- Mobile-specific week-view adjustments

The service worker is updated using versioned cache names so new application builds can replace older cached files more reliably.

---

## Security and Privacy Design

Security is an important part of the project rather than an afterthought.

Current protections and design choices include:

- Supabase authentication
- Row Level Security
- Role-based shared calendar permissions
- Separation of personal and shared data
- Stripping private event fields from read-only shared views
- Protection of reminder, pricing, budget, and connection information where sharing does not require it
- Local database clearing during logout or account changes
- Server-side permission validation
- Reduced reliance on interface-only restrictions
- Offline queues that preserve ownership and synchronization context

The application is being built with the assumption that users should not receive access to private data simply because they can manipulate the browser interface.

---

## Technical Foundation

### Front End

- HTML
- CSS
- Vanilla JavaScript
- Single-page application structure
- Responsive desktop and mobile design

### Local Storage

- IndexedDB
- Structured data slices
- Offline synchronization queue
- Local learning and prediction records

### Backend

- Supabase
- PostgreSQL
- Authentication
- Row Level Security
- Realtime subscriptions
- Remote procedure calls
- Edge Functions for selected server-side tasks

### PWA Layer

- Service worker
- Offline caching
- Installable application behavior
- Browser notifications

### External Services

- Open-Meteo for weather information
- OCR and server-side receipt processing tools

---

## Current Project Scale

The project has grown into a substantial single-page application.

Approximate current scale:

- More than 17,000 lines of JavaScript
- More than 500 KB of JavaScript source
- More than 150 KB of CSS
- Dozens of responsive media-query sections
- Multiple interconnected feature systems
- Desktop, mobile, offline, cloud, and collaborative behavior

Although the application is still built without a large front-end framework, it now contains many of the systems normally found in a production application: local persistence, authentication, synchronization, permissions, realtime updates, background caching, notifications, data classification, and responsive user-interface state.

---

## Current Development Status

The application is functional and has moved well beyond an early prototype.

Its major foundations are currently in place:

- Core calendar views
- Event creation and recurrence
- Visual week connections
- IndexedDB offline storage
- Row-based Supabase synchronization
- Shared collaborative calendars
- Role-based permissions
- Realtime updates
- Reminder infrastructure
- Budget tracking
- Receipt OCR and personalized category learning
- Weather integration
- Search
- PWA installation and offline support
- Desktop and mobile layouts

Current development is primarily focused on refinement, testing, accessibility, synchronization reliability, notification expansion, import/export compatibility, mobile polish, and eliminating unusual interface edge cases.

---

## Overall Vision

The Calendar Project is becoming a private digital headquarters: part calendar, part planner, part financial dashboard, part collaboration system, and part visual map of the user's life.

Its strongest characteristic is not any single feature. It is the way the systems work together. Events can exist offline, synchronize to the cloud, appear on shared calendars, trigger reminders, connect visually to other events, and live beside the financial or practical information surrounding them.

The result is a calendar that feels less like a grid of appointments and more like an instrument panel—one built piece by piece, wire by wire, until the machine begins to hum.
