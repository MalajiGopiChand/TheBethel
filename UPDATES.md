# Updates and recovery — 6 October 2026

## Backup

Before editing, the Git working tree was clean. The original tracked source is saved in:

- `backups/before-updates-2026-10-06.zip`
- Original Git commit: `1b62f3b1f71107be645bf554525b5986f61b39d7`
- ZIP SHA-256: `FE7D6B863297F0AB3A387BD9F647C9D03DABD7A93612AF582B586155CF73478B`

The ZIP excludes Git history, installed dependencies, ignored build output, and any ignored local configuration. It is a source backup, not a Firebase database backup. No production data was changed. Keep this ZIP locally; backups are excluded from Git.

To undo, ask to restore all of this update or name the specific feature. Files can be restored individually from that commit or ZIP while preserving later unrelated edits. Extract the ZIP into a separate folder first if restoring manually.

## Changes

- All teacher URLs redirect pending teachers to the approval screen.
- Invalid student-roll signup removes the newly created incomplete Auth account. Signup does not delete an account after a profile write was attempted, since a failed response may still mean the write succeeded. Cleanup failures show recovery instructions.
- Signup validation now displays errors instead of silently doing nothing. Forms have more room on narrow screens.
- Back navigation falls back to the appropriate dashboard for directly opened links.
- Action tiles work with keyboard navigation and display up to two lines of text.
- A single app-wide install dialog replaces repeated automatic popups. Dismissing a reminder does not disable manual installation. Browser instructions remain available when the native install prompt is unavailable.
- Reduced-motion preferences are respected, and shared icon buttons have accessible labels.
- README and setup paths now reference JavaScript files.

## Firebase rules — local changes, not deployed

The updated `firestore.rules`:

1. Requires new self-created teacher profiles to use the owner's UID, role `TEACHER`, `isVerified: false`, `isApproved: false`, and `approvalState: 'pending'`.
2. Prevents teachers from editing their role, UID, approval flags, approval state, or legacy status. Admins retain approval access.
3. Requires self-created parent profiles to use role `PARENT` and the owner's UID; prevents self-service role/UID changes.
4. Treats explicit pending/rejected approval states as unapproved despite old boolean verification flags. Privileged custom teacher claims still grant access.
5. Supplies defaults when reading optional custom claims.
6. Removes the placeholder email admin accounts `admin@example.com` and `admin@gmail.com`. The two existing named admin addresses and the admin custom claim remain supported.

Before publishing, verify Android signup also supplies the required teacher/parent fields because it shares this database. Existing profile updates can omit old approval fields as long as those fields are not changed. If any legacy teacher uses string verification flags, normalize their approval through the admin screen.

In Firebase Console, select `the-bethel-ams`, open Firestore Database → Rules, review and replace the rules with `firestore.rules`, test the cases below, and publish. Alternatively, from this folder with the Firebase CLI authenticated:

```powershell
firebase deploy --only firestore:rules --project the-bethel-ams
```

Test pending teacher signup, denied self-approval and role changes, admin approval, approved teacher access, and existing parent/teacher profile edits. These rules were reviewed locally but have not been compiled or exercised in a Firestore emulator. This is a targeted improvement, not a complete database security audit.

## Verification

- `node --test tests/reliability.test.mjs`: eight regression tests pass (Firebase calls mocked; no real accounts created).
- Production build passes, with a large-bundle warning.
- ESLint completes with zero errors and existing project-wide warning categories (unused imports and hook dependencies).
- Live Firebase authorization and authenticated UI flows still require testing with test accounts.
- Browser automation could not start because of a Windows sandbox error, so visual review is unverified. The local preview is available at http://127.0.0.1:5174 while the development server is running.

## Admin dashboard layout update

Where to see it: `/admin/dashboard` → **Home**.

- Summary cards now appear first: students, attendance, and reward dollars.
- Quick actions use two columns on phones and three on larger screens, with readable descriptions and keyboard focus styling.
- Attendance and top performers appear side by side on desktop, stacked on mobile.
- Loading placeholders, a Retry action for data errors, and an Add student prompt for an empty school replace misleading zero-data displays.
- The header adapts to narrow screens, long account names truncate, and the notification button opens the notifications page.
- Bottom navigation has higher-contrast labels and safe-area spacing for mobile devices.

Files changed in this round:
- `src/pages/admin/components/AdminHomeTab.jsx`
- `src/pages/admin/AdminDashboard.jsx`

A separate before-this-round copy of both files is in `backups/before-dashboard-update/`. The original full source ZIP remains unchanged. No additional Firebase rules or database changes are needed for this layout update.

## Dashboard layout restored
At the user's request, both admin dashboard files were restored exactly from backups/before-dashboard-update. The dashboard layout update described above is no longer active. Earlier reliability and access-check fixes remain.
