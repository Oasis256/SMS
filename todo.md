# Ultimate SMS - Project TODO

## Foundation
- [x] Database schema (users with roles, students, staff, classes, subjects, attendance, finance tables)
- [x] Custom color theme (Child Africa green + Solberg College red/maroon)
- [x] Google Fonts setup (Inter for professional look)
- [x] Remove Manus logo from all pages

## Authentication & Access Control
- [x] Six roles: Administrator, Head Teacher/Principal, Bursar, Director of Studies, Teacher, Department Head
- [x] Role-based route protection and menu visibility
- [x] 30-minute inactivity auto-logout
- [x] Account lockout after 5 failed attempts
- [x] Full audit logs for all data changes

## Dashboard (Unified Enrollment Interface)
- [x] Display all students and staff in one view
- [x] Real-time biometric status indicators (Green/Yellow/Red/Blue/Gray)
- [x] Global search across all user types
- [x] Profile cards with photo, role, department/class, status
- [x] Filtering and sorting capabilities

## Finance Module
- [x] Income tracking (sponsorship, student fees, other income)
- [x] Expense request submission with documentation
- [x] Multi-step approval workflow: Request → Finance Review → Principal Approval → Payment
- [x] Principal digital PIN approval (mandatory for ALL amounts)
- [x] Budget planning and monitoring with alerts
- [x] Payroll management linked to biometric attendance
- [x] Financial reporting (daily cash, monthly statements, audit trails)

## Student Module
- [x] Student enrollment with comprehensive info capture
- [x] Academic records and performance tracking
- [x] Attendance records linked to biometric data
- [x] Discipline records
- [x] Student welfare tracking
- [x] Sponsor information management

## Academic Module
- [x] Curriculum management (subjects, grade levels, topics)
- [x] Class scheduling and timetable management
- [x] Lesson plan submission and tracking
- [x] Academic calendar management
- [x] Grade entry and automatic calculations

## Human Resources Module
- [x] Staff records management
- [x] Performance tracking and appraisals
- [x] Professional development tracking
- [x] Leave management (request, approval, tracking)
- [x] Payroll linked to biometric clock-in/out

## Biometric Attendance Module
- [x] Student biometric clock-in/out tracking
- [x] Staff biometric clock-in/out tracking
- [x] Real-time presence status updates
- [x] Late arrival detection and flagging
- [x] Boarding student curfew monitoring

## Reports & Analytics Module
- [x] Financial reports (income, expense, budget, payroll, audit)
- [x] Student reports (enrollment, attendance, performance, discipline)
- [x] Academic reports (class performance, curriculum coverage)
- [x] HR reports (staff roster, performance, leave, training)
- [x] Role-specific dashboards with key metrics

## Email Notifications
- [x] Absent/late student alerts to parents/guardians
- [x] Fee payment reminders to sponsors and parents

## Scheduled Jobs (Cron)
- [x] Daily cash summaries auto-generated
- [x] Monthly financial statements auto-generated
- [x] Weekly attendance reports auto-generated
- [x] Reports delivered to Principal, Bursar, Director of Studies

## System Security
- [x] Session-based authentication with cookie
- [x] Data encrypted in transit (HTTPS)
- [x] Audit logging on all mutations
- [x] PIN-based approval for expenses
- [x] Setup-cron admin endpoint for heartbeat jobs

## Multi-School Architecture
- [x] Add schools table with 3 predefined schools (Child Africa Jnr. Kabale, Child Africa Jnr. Equator, Solberg College Kabale)
- [x] Add schoolId foreign key to students, staff, classes, attendance, income, expenses, budgets, payroll tables
- [x] Add school type distinction (primary vs secondary)
- [x] Update all backend queries to filter by selected school
- [x] Add school context/selector to frontend (global school switcher)
- [x] Show school-specific dashboards with independent data
- [x] Allow cross-school overview for administrators/principals
- [x] Update navigation to show current school context
- [x] Update reports to support per-school and cross-school views
