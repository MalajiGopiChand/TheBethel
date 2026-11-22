# Notification and website reset setup

## Current deployment constraint

The live website is https://thebethelams.vercel.app/ and Firebase is on Spark.
The Firebase Functions deployment requires Blaze. The repository now also
includes a Vercel API and website write integration that can use Firebase Spark.
FCM itself is free; Vercel and Firestore usage still count against their limits.
Never paste a service-account private key into chat or into a VITE variable.

## Vercel setup for Spark (current choice)

1. In Firebase Console, Project settings → Service accounts, obtain a service-account
   credential for `the-bethel-ams`. Keep the downloaded JSON private and outside this repository.
2. In the existing Vercel project's Settings → Environment Variables, add these
   for Production (and Preview only if previews are authorized to use the same database):
   - `FIREBASE_SERVICE_ACCOUNT_JSON`: the complete JSON, stored as a sensitive server variable.
   - `VITE_NOTIFICATION_BACKEND`: `vercel`.
   - `VITE_FIREBASE_VAPID_KEY`: the public Web Push key already supplied and saved locally.
3. Deploy this updated repository to the existing Vercel project. The API route
   `/api/notification-events` must deploy along with the frontend. Plain `vite dev`
   does not run Vercel API functions; use the deployed preview or Vercel's local runtime
   for delivery testing. Leave the local backend flag unset for frontend-only development.
4. Publish the existing `firestore.rules` file if its notification/period additions
   have not already been published. No rule edits were needed for the Vercel implementation:
   internal receipt/delivery collections remain denied to client SDKs by the existing default.
5. Enable `VITE_ENABLE_WEBSITE_PERIODS=true` only after the period rules are live.
   Redeploy after any frontend environment-variable change.
6. Users open the notification bell and enable device notifications on each device.

The server verifies Firebase ID tokens, checks roles and record ownership, and reads
before/after snapshots itself. Client writes still use the existing Firebase SDK and rules.
The API cannot be used to send arbitrary text to arbitrary recipients. Deterministic
inbox IDs prevent duplicate inbox entries, and failed push requests can be retried.
Retries preserve the original after-snapshot even if another edit occurs meanwhile.

Limitations: this route observes writes made through the updated website, not direct
Firebase Console changes or an unchanged native Android app. A change made while the
prepare endpoint is unreachable is saved with a visible alert but cannot generate a
verified notification later. Delivery retries run while the originating signed-in browser
is open or when it reopens, and expire after 24 hours. Immediate app closure can delay
delivery until reopening. Push is at-least-once; the stable notification tag reduces duplicates.
Successful receipts discard copied student snapshots. Abandoned/expired receipt subcollections
require periodic server-side cleanup; do not enable an untested recursive deletion job.

Live delivery has not been tested: Vercel credentials and deployment access are still required.

## Alternative: Firebase Functions with Blaze

The local code is implemented, but backend deployment is not complete. The currently signed-in Firebase CLI account cannot access `the-bethel-ams`. No reset has been performed and no historical records have been deleted.

1. Sign in to an account with access: `firebase login --reauth` (or `firebase login:add` and select that account).
2. Review and deploy the Firestore rules and notification functions: `firebase deploy --only firestore:rules,functions --project the-bethel-ams`. The project must support Cloud Functions billing and Node.js 22. Do not enable billing without the project owner's approval.
3. Set `VITE_FIREBASE_VAPID_KEY` in the deployed website's build environment to the Web Push public key. It is already configured in the local `.env.local`. Never include a service-account private key in frontend code or a VITE variable.
4. After the rules are deployed, set `VITE_ENABLE_WEBSITE_PERIODS=true` in the website environment. Rebuild/redeploy the website (restart Vite for local use).
5. Each user opens Notifications and clicks **Enable device notifications** on each device. This requires a supported browser, notification permission, and HTTPS (localhost is allowed). On iOS use the installed home-screen web app.

## Behavior

- More → App Settings → Reset website data is visible only to admins. It requires confirmation and is disabled until website periods are configured.
- Reset creates a new `website_activity/{periodId}` and updates `app_settings/website_activity`. It never deletes or zeroes historical student documents.
- Original attendance/rewards remain in `students`. New website records live in `website_activity/{periodId}/students/{studentId}`. Previous periods are retained. Android's original student records are not reset.
- All website attendance/reward screens, totals, leaderboards, and exports use the selected period. Names and enrollment information stay visible. Stale writes are rejected transactionally. The UI remounts on a period change, discarding unsaved forms.
- A missing/denied period configuration fails closed once enabled. Do not disable the flag after beginning a period: doing so restores original-record views.
- Server triggers create deterministic per-user inbox entries. Push delivery listens to inbox creation, retries transient errors, and removes invalid device tokens.
- Parents receive only their child's attendance/rewards, matching class/branch homework, and their own complaint status. Staff receive chat, schedules, student and report updates. Admins receive parent complaints and finance updates. Named announcements are not broadcast to everyone.
- No inbox or push messages are sent by local tests. The existing native Android app must register its own FCM tokens with uid in `pushTokens` to use this backend; its code is outside this website repository.

## Verification

`node --test tests/*.test.mjs`
`npm run build`
`node --input-type=module -e "await import('./functions/index.js')"`

After deployment, use designated test accounts to verify: parent A receives student A updates but parent B does not; staff receive attendance updates; complaint submission/resolution notifications arrive; installed app receives push while closed; logout stops device delivery; reset preserves database history and new-period saves stay separate. These live checks remain pending Firebase access. Do not test by modifying real student records without explicit authorization.
