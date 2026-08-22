# StreetVision AI — Product Requirements Document

## 1. Product Overview

StreetVision AI is a real-world smart city reporting platform.

Citizens can report problems in public streets and infrastructure using images, descriptions, severity, and geographic location.

Administrators can review, manage, update, and resolve citizen reports.

The application uses real Supabase authentication, database, storage, and Row Level Security.

There must be no fake or demo production data.

---

## 2. User Roles

### Citizen

A registered user has the Citizen role by default.

Citizens can:

- Register
- Login
- Logout
- View their profile
- Create reports
- Upload report images
- Add report descriptions
- Select report categories
- Select severity
- Add geographic location
- View their own reports
- View report status
- Receive notifications
- View resolved reports

Citizens must NOT be able to:

- Access the Admin dashboard
- Change their role to Admin
- Modify another user's reports
- Modify report status directly
- Access another user's private files

---

### Admin

The administrator account is:

youssefabdallah.701@gmail.com

Admin users can:

- Login
- Access Admin Dashboard
- View reports
- View report details
- View report images
- View reports on the map
- Filter reports
- Update report status
- Resolve reports
- Manage reports
- View relevant analytics
- Review citizen reports

Admin authorization must be enforced by Supabase/RLS and not only by frontend UI checks.

---

# 3. Authentication

## Registration

A new user can register using:

- Email
- Password

Successful registration creates a Citizen account.

The system must handle:

- Invalid email
- Weak password
- Existing email
- Unconfirmed email
- Empty fields
- Network errors

---

## Login

Users can login using:

- Email
- Password

Successful login should:

1. Create a Supabase session.
2. Load the user's profile.
3. Determine the user's role.
4. Load the appropriate dashboard data.

Existing data must appear immediately after login.

The user must NOT need to navigate to another page or create a new report to make existing data appear.

---

# 4. Dashboard

The Citizen dashboard should display real Supabase data.

Possible dashboard information:

- Total reports
- Pending reports
- In-progress reports
- Resolved reports
- Recent reports
- Notifications
- Map/report information

The dashboard must distinguish between:

- Loading
- Empty data
- Error
- Successfully loaded data

The system must never display "No reports" while data is still loading.

No hardcoded statistics should be used.

---

# 5. Reports

Citizens can create reports containing:

- Category
- Description
- Severity
- Image
- Geographic location

Example categories:

- Pothole
- Garbage
- Street light
- Road damage
- Water leak
- Traffic problem
- Other

The report must be stored in Supabase.

Each report must be associated with the authenticated user's ID.

---

# 6. Image Upload

Report images are stored in the private Supabase Storage bucket:

street-reports

Allowed formats:

- JPEG
- PNG
- WebP

Maximum size:

10 MB

Expected storage path:

reports/{user_id}/{filename}

Users must only be able to access their own files.

Invalid file types must be rejected.

Files larger than 10 MB must be rejected.

If image upload fails, the report must not be falsely reported as successfully submitted.

---

# 7. Report Status

Reports can have statuses such as:

- Pending
- In Progress
- Resolved

Citizens can view the current status.

Citizens cannot directly modify report status.

Admins can update report status.

When an Admin resolves a report:

1. The report status is updated in Supabase.
2. The Citizen can see the updated status.
3. A notification should be created if the notification system is enabled.

The notification must belong to the report owner, not the Admin.

---

# 8. Notifications

Citizens should receive notifications for important report updates.

Examples:

- Report submitted
- Report status changed
- Report resolved

Notifications must be associated with the correct Citizen.

Citizens must not see another Citizen's notifications.

---

# 9. Map

The application uses Leaflet.

Reports with valid geographic coordinates should appear on the map.

The map should support:

- Report markers
- Report details
- Clustering if enabled
- Heatmap if enabled
- Responsive behavior

Invalid coordinates must not break the map.

---

# 10. Admin Dashboard

The Admin Dashboard should display real reports from Supabase.

Admin functionality includes:

- View reports
- Search reports
- Filter reports
- View report details
- View report image
- View report location
- Change status
- Resolve reports

Admin actions must persist to Supabase.

Refreshing the page must preserve the updated data.

---

# 11. Security

Supabase Row Level Security must be enabled.

Citizens must not be able to:

- Read unauthorized reports
- Modify another user's data
- Modify roles
- Access private files belonging to another user
- Access Admin-only functionality through direct API requests

Frontend restrictions alone are not considered sufficient security.

---

# 12. Data Integrity

All production data must come from Supabase.

The application must not use:

- Fake reports
- Fake users
- Demo statistics
- Mock API responses
- Hardcoded production data
- localStorage as a database

Errors from Supabase should be handled properly.

---

# 13. Responsive Design

The application must work correctly on:

- Mobile 320px
- Mobile 360px
- Mobile 390px
- Mobile 414px
- Tablet 768px
- Desktop 1024px
- Desktop 1280px
- Desktop 1440px
- Desktop 1920px

There must be:

- No horizontal overflow
- No overlapping components
- No broken navigation
- No clipped buttons
- No broken modals
- No unreadable text

---

# 14. Main Test Scenarios

## Citizen Registration

Register new Citizen
→ Confirm email if enabled
→ Login
→ Dashboard loads
→ User profile loads

## Existing Data

Login
→ Dashboard
→ Existing reports appear immediately
→ No page navigation required

## Create Report

Login as Citizen
→ Create Report
→ Fill all required fields
→ Upload valid image
→ Select location
→ Submit
→ Verify report exists in Supabase
→ Verify report appears in Citizen dashboard

## Invalid Upload

Upload unsupported file
→ Upload rejected

Upload file >10 MB
→ Upload rejected

## Admin

Login as Admin
→ Admin Dashboard
→ View real reports
→ Open report
→ Change status
→ Resolve report

## Citizen Status

Admin resolves report
→ Citizen dashboard/report details
→ Status shows Resolved

## Security

Citizen attempts to access another user's data
→ Access denied

Citizen attempts to modify role
→ Access denied

Citizen attempts to modify report status
→ Access denied

## Refresh Persistence

Create/update report
→ Refresh browser
→ Data remains correct

## Logout

Logout
→ Session removed
→ Protected pages inaccessible
→ Login page displayed