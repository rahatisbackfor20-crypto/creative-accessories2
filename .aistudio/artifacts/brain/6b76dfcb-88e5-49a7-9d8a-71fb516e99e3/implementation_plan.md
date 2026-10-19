# Horizontal Mouse Wheel Navigation & Admin Password Management

Enable intuitive mouse-wheel horizontal scrolling across all navigation tabs, sub-menu bars, priority indicators, and data tables, and implement a dedicated Admin Master Password management card inside the Admin Settings modal to allow admins to securely change the master password with live cloud synchronization.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during the interactive clarification phase and are incorporated as core requirements:

- **Confirmed Decision 1 (Horizontal Scroll Scope)**: Enable mouse-wheel horizontal scrolling across **all** horizontal overflow bars and containers throughout the application, including the top navigation bar, admin sub-menu tabs, priority urgency bar, and all wide data tables (worker accounts, production records, attendance logs, overtime sheets, and payroll grids).
- **Confirmed Decision 2 (Admin Password Location)**: Place the Admin Password Change control inside a dedicated **Security & Password** card in the **Admin Settings** modal, featuring current password verification, new password input with eye icon visibility toggle, confirmation validation, and cloud synchronization.

---

### 1. Overview & Core Concept

- **What It Does**:
  1. Translates vertical mouse wheel rotation (`deltaY`) into smooth horizontal scrolling (`scrollLeft`) whenever the mouse cursor hovers over any horizontal scrollable container or table.
  2. Empowers system administrators to change the Master Admin password directly from the Admin Panel Settings, updating local storage, session state, and the cloud database in real time.
- **Target Audience / Persona**: Factory administrators, production supervisors, and payroll managers using desktop mice and laptops who need fast lateral navigation without manual scrollbar dragging.
- **Key Value**: Drastically speeds up table inspection and tab switching with natural mouse wheel scrolling, while providing self-service administrative credential security.

---

### 2. User Experience & Visual Design

- **Mouse Wheel Horizontal Scroll Flow**:
  - Hovering the mouse over any horizontal tab bar (e.g., Top Nav, Admin Tabs: *Worker Accounts*, *Approval Queue*, *Production Orders*, *Sections*) or data table (e.g., Worker Accounts table, Production logs).
  - Rolling the mouse wheel scrolls the container left and right smoothly without requiring Shift+Wheel, clicking track arrows, or dragging narrow scrollbars.
  - When the container reaches its left or right boundary, normal page scroll behavior remains unaffected.
- **Admin Password Change Flow**:
  - Clicking **⚙️ Settings** in the Admin Panel header opens the Admin Settings modal.
  - A prominent **Admin Master Password & Security (অ্যাডমিন মাস্টার পাসওয়ার্ড পরিবর্তন)** card is featured with an indigo shield/key accent.
  - Input fields for **Current Password**, **New Password**, and **Confirm New Password**, each equipped with an interactive **Eye (`Eye` / `EyeOff`)** icon button to toggle text visibility.
  - Submitting checks that the current password matches, verifies that the new password meets length requirements, and matches the confirmation.
  - Upon success, displays an emerald confirmation message, updates the hosting admin user credentials, and syncs to the cloud database.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Global Non-Passive Wheel Event Listener vs Per-Component Handlers**
  - *Chosen Approach*: Implement a smart global wheel listener in `App.tsx` that inspects whether the event target resides within an `.overflow-x-auto` container with active horizontal scroll headroom (`scrollWidth > clientWidth`). Supplement with explicit `onWheel` handlers on primary navigation bars for guaranteed responsiveness.
  - *Why*: Eliminates the need to manually wire dozens of nested table divs and guarantees 100% coverage across all existing and future tables, while maintaining native vertical scrolling when the container has no horizontal overflow.
  
- **Decision 2: Admin Password Persistence & Cloud Sync**
  - *Chosen Approach*: Store `adminMasterPass` in `App.tsx` state and `localStorage` (`caf_admin_pass`), update the hosting super admin user record (`u-hosting-1`) in the `users` array, and push to the Firebase RTDB cloud sync (`caf_portal_db.json`).
  - *Why*: Guarantees that whether logging in via the Admin Gate modal or standard username login, the updated password is immediately recognized locally and across devices.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌──────────────────────────────────────────────────────────────────┐
│                             App.tsx                              │
│  State: adminMasterPass, users, cloudDbUrl                       │
│  Global Wheel Hook: Translates deltaY -> scrollLeft on overflows │
└──────────────┬───────────────────────────────────┬───────────────┘
               │                                   │
               ▼                                   ▼
┌──────────────────────────────┐   ┌───────────────────────────────┐
│          Navbar.tsx          │   │      AdminPanelView.tsx       │
│  Horizontal Nav Tabs:        │   │  - Sub-menu Tabs (horizontal) │
│  Mouse wheel enabled         │   │  - Data Tables (horizontal)   │
└──────────────────────────────┘   │  - Settings Modal:            │
                                   │    Admin Password Change Card │
                                   └───────────────┬───────────────┘
                                                   │
                                                   ▼ onUpdateAdminPassword
                                   ┌───────────────────────────────┐
                                   │    App.tsx / storage.ts       │
                                   │  - Update adminMasterPass     │
                                   │  - Update u-hosting-1 user    │
                                   │  - pushToCloud sync           │
                                   └───────────────────────────────┘
```

- **Interactive Component & State Mapping**:
  - `src/App.tsx`:
    - Add `adminMasterPass` state initialized with `localStorage.getItem('caf_admin_pass') || MASTER_ADMIN_PASS`.
    - Provide `handleUpdateAdminPassword(newPassword: string)` which updates state, `localStorage`, `users`, and calls `pushToCloud`.
    - Pass `adminMasterPass` and `onUpdateAdminPassword` down to `AdminPanelView`.
    - Add global `wheel` listener with `{ passive: false }` for automatic horizontal scrolling on any hovered container with `.overflow-x-auto`.
  - `src/components/AdminPanelView.tsx`:
    - Accept `adminMasterPass: string` and `onUpdateAdminPassword: (newPass: string) => Promise<void> | void`.
    - Inside the Settings Modal (`settingsModalOpen`), render the Admin Password Change form with eye toggle visibility, validation, and feedback toast.
  - `src/components/Navbar.tsx`, `PriorityBar.tsx`, `ProductionView.tsx`, `AttendanceView.tsx`, `OvertimeView.tsx`, `PayrollView.tsx`:
    - Ensure all horizontal overflow wrappers have `overflow-x-auto` with smooth horizontal wheel handling.
