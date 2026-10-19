# Factory Production & Worker Tracking Portal (CAF Operations)

A production-grade, bilingual (English & বাংলা) manufacturing operations platform featuring live production line tracking, worker attendance, automatic overtime and payroll calculations, digital employee ID badges, and cloud database synchronization with offline resilience.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions have been confirmed from your clarifications and will guide the build:
>
> - **Application Scope**: Built as a dedicated Factory Production & Worker Tracking Portal supporting real manufacturing lines (Sewing, Cutting, Finishing, Packaging, Quality Control, Maintenance, Admin).
> - **Data & Cloud Strategy**: Live multi-device cloud synchronization connected to Firebase Realtime Database with automatic bidirectional sync, background heartbeat, and complete offline `localStorage` fallback.
> - **Bilingual Experience**: Instant toggle between English and Bengali (বাংলা) across all navigation, KPI cards, form fields, table columns, and generated payslips/ID cards.
> - **Role & Security Hierarchy**: Multi-role access (Super Admin, Managing Director, Staff/Supervisor, Worker) with hidden administrative gate (`Robiulawal0209@`) protecting sensitive salary and account creation features.

---

## 1. Overview & Core Concept

### What It Does
The Factory Production & Worker Tracking Portal provides a unified operations hub for manufacturing facilities. Line operators and supervisors record daily production outputs against buyer orders and work orders, log daily attendance with shift times, submit and approve overtime hours with automatic wage calculations, generate printable digital worker ID badges, and export monthly payroll slips with direct WhatsApp dispatch.

### Target Audience & Persona
- **Floor Workers & Operators**: Fast, clear check-in, overtime logging, production target tracking, and digital badge access.
- **Line Supervisors & Staff**: Daily attendance management, real-time line output logging, and overtime review.
- **Factory Executives & Admins (MD / Super Admin)**: Global dashboard, order fulfillment analytics, master payroll calculation, employee profile creation, and cloud database administration.

### Key Value
Eliminates paper registers, manual overtime logbooks, and payroll errors by centralizing manufacturing operations into an intuitive, responsive interface optimized for desktop, factory floor tablets, and mobile devices.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Authentication & Role Access**:
   - Clean login screen supporting employee credentials or master administrative access (`Robiulawal0209@`).
   - Role-aware interface: Workers view their own logs, earnings, and badge; Managers/Admins access global analytics, roster management, and employee profile editing.
2. **Production Line Monitoring**:
   - Live dashboard showing active orders by Buyer (e.g. H&M, Zara, Apex), Item Name, Section, Target Quantity, and Produced Quantity with percentage progress bars.
   - Quick "Log Output" modal with validation for order quantities and timestamps.
3. **Attendance & Overtime Management**:
   - Daily attendance table with shift hours (In-Time / Out-Time), status filters (Present, Late, Absent), and one-click entry.
   - Overtime tracking with auto-calculated overtime rate derived from `(Basic Salary ÷ 30) ÷ 8` hours.
4. **Payroll & Digital ID Generation**:
   - Monthly payroll summary card displaying basic salary, approved overtime bill, and total gross payout.
   - Official printable Digital ID Card with QR/barcode styling, factory registration number, and 1-click WhatsApp dispatch.
5. **Admin Control & Cloud Settings**:
   - Protected admin view for creating new employee records, assigning sections, adjusting salary structures, and configuring live cloud endpoints.

### Visual Identity & Theme
- **Aesthetic Direction**: High-density industrial SaaS dashboard adhering to anti-slop principles: flat elevation with crisp 1px borders, single-line controls, zero static pill tags, and tabular figures for all numerical metrics.
- **Color Palette (60-30-10 Rule)**:
  - *Dominant Neutral Canvas (60%)*: Crisp light slate (`#F8FAFC`) in light mode / deep slate (`#0F172A`) in dark mode.
  - *Structural Surfaces (30%)*: Clean white cards (`#FFFFFF`) / dark surface panels (`#1E293B`) with hairline borders (`#E2E8F0` / `#334155`).
  - *Accent Budget (10%)*: High-intent industrial indigo (`#4F46E5` / `#6366F1`) for primary actions and active tabs; emerald (`#16A34A`) for nominal/approved status; amber (`#D97706`) for pending/late.
- **Typography**:
  - *Display / Headings*: Plus Jakarta Sans (`font-sans font-bold tracking-tight`).
  - *Bengali Script*: Hind Siliguri (`font-sans` with optical weights for clear Bengali legibility).
  - *Data & Metrics*: Monospace with tabular figures (`font-mono tabular-nums`).
- **Top Bar Contract**:
  - Zone 1: Single brand wordmark (`Creative Accessories Factory`).
  - Zone 2: Single-line navigation links (`Dashboard`, `Production`, `Attendance`, `Overtime`, `Payroll`, `Admin`).
  - Zone 3: Language toggle (`EN | বাংলা`), Dark mode toggle, and User Profile / Logout.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Hybrid Cloud Synchronization Architecture
- **Chosen Approach**: REST-based live polling and bidirectional sync to the Firebase Realtime Database endpoint (`https://database-ffe41-default-rtdb.firebaseio.com/caf_portal_db.json`) combined with `localStorage` persistent caching.
- **Why**: Allows instant cross-device updates across factory tablets and mobile phones without requiring complex SDK setups, while guaranteeing zero data loss if the factory internet connection drops.
- **Trade-Off**: 4-second polling heartbeat balances real-time freshness with low network overhead.

### Decision 2: Automatic Overtime Rate Calculation
- **Chosen Approach**: System automatically computes hourly overtime rate as `(basic_salary / 30) / 8` with manual override capability.
- **Why**: Standardizes Bangladesh EPZ & garment accessories factory compliance, eliminating manual calculation discrepancies.

### Decision 3: Bilingual State Architecture
- **Chosen Approach**: Global dictionary-driven localization context with a persistent switcher preserving language choice across sessions.
- **Why**: Ensures floor operators who prefer Bengali can effortlessly navigate, while management reports and export slips can be generated in English or Bengali.

---

## 4. Technical Architecture & Data Strategy

### System & Component Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          App Container                                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Top Navigation Bar (Brand Wordmark · Nav Tabs · Language · Theme) │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Global Status Strip (Sync Indicator · Active Role · Quick Info)  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌───────────────┬───────────────┬─────────────────┬────────────────┐  │
│  │  Dashboard    │  Production   │   Attendance    │    Payroll     │  │
│  │  - KPI Grid   │  - Order List │   & Overtime    │  - Pay Slips   │  │
│  │  - Workers    │  - Output Log │   - Shift Logs  │  - ID Badges   │  │
│  │  - Line Stats │  - Buyer Flow │   - OT Calculator│  - WhatsApp   │  │
│  └───────────────┴───────────────┴─────────────────┴────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Protected Admin Gate (Master Pass: Robiulawal0209@)              │  │
│  │ - Employee Creator · Section Config · Salary Editor · Sync Config │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Data & Sync Engine                                               │  │
│  │ ┌─────────────────────────┐     ┌──────────────────────────────┐ │  │
│  │ │ localStorage (Offline)  │ <-> │ Cloud DB REST (Firebase RTDB)│ │  │
│  │ └─────────────────────────┘     └──────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model Entities
- **User / Worker**: `id`, `fullName`, `photoUrl`, `accountType` (`hosting` | `md` | `admin` | `staff` | `employee`), `designation`, `section`, `department`, `username`, `password`, `employeeId`, `joiningDate`, `whatsapp`, `accountStatus`, `basicSalary`, `hourlyRate`.
- **Attendance Record**: `id`, `userId`, `date`, `status` (`Present` | `Late` | `Absent`), `inTime`, `outTime`, `shift`.
- **Overtime Record**: `id`, `userId`, `date`, `hours`, `section`, `reason`, `status` (`Pending` | `Approved` | `Rejected`), `approvedBy`.
- **Production Order Record**: `id`, `userId`, `date`, `section`, `itemName`, `buyer`, `company`, `length`, `orderQty`, `prodQty`, `unit`, `startTime`, `endTime`, `hours`, `status`.
- **Company Profile**: `name`, `logoUrl`, `contactNumber`, `email`, `address`, `factoryRegNo`, `establishedYear`, `noticeText`.

---

## 5. Implementation Phases & Milestones

1. **Phase 1: Project Setup & Foundation**
   - Configure HTML metadata, typography fonts (Plus Jakarta Sans + Hind Siliguri + JetBrains Mono), and Tailwind theme.
   - Establish bilingual dictionary (English / Bengali) and localization hooks.
2. **Phase 2: Data Persistence & Cloud Sync Layer**
   - Implement storage manager with automatic Firebase Realtime Database sync and offline `localStorage` fallback.
   - Provide authentication controller with role-based view filtering and master admin bypass.
3. **Phase 3: Core Operations Views**
   - Build Dashboard KPI cards, notice board, and worker profile roster.
   - Build Production Line management with real-time target tracking and entry modal.
   - Build Attendance and Overtime modules with automatic wage rate calculation.
4. **Phase 4: Payroll, ID Badges & Admin Control**
   - Build Monthly Payroll slip calculator with WhatsApp message formatting.
   - Implement printable Digital ID Card with crisp employee badge details.
   - Build password-gated Admin Panel for user creation, salary adjustments, and section management.
5. **Phase 5: Verification & Polish**
   - Verify all interactive handlers, responsive breakpoints (mobile, tablet, desktop), dark/light mode contrast, and run compilation.
