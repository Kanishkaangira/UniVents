# Event push notifications

The `event_notifications` table is maintained by the approval trigger in
`event_notifications.sql` and stores snapshots for approved events and
notices. A Supabase Database Webhook can send each new row to the `send-push`
Edge Function. The function sends the row's `title` and `message` through
Firebase Cloud Messaging (FCM) HTTP v1 to eligible registered device tokens.

When a student or faculty member signs in, the app requests notification
permission, saves its FCM token in `device_tokens`, and updates `last_seen` when
the token refreshes. Signing out attempts to remove that device's token. The
Edge Function uses the post's `visibility` to find eligible profiles, then
sends the FCM notification to each registered device. Events and notices share
the admin panel's scope-based approval: pending or rejected posts do not enter
the notification feed or send pushes. Firebase service-account credentials
remain in Supabase secrets and are never stored in the mobile app.

Android displays the UniVents status icon, event poster or notice image when available,
high-priority channel, and the device's default notification sound. The channel
is created when the app registers for notifications and is also configured as
the native FCM default. While the app is open, the mobile app loads the push's
notification row from `event_notifications` before displaying its local banner.

The function accepts both the admin app's `{event_id}` request (validated
against the signed-in admin and event scope) and a Supabase Database Webhook
`INSERT` payload for `event_notifications` or an `INSERT`/`UPDATE` payload for
`events` (validated against the service-role key). The `events` webhook path
uses the webhook's `old_record` on updates to detect a new approval, then looks
up the approved notification snapshot before sending. This supports posts that
were already represented in the notification feed before they were approved.
All paths claim the
same notification row before sending, preventing duplicate pushes if multiple
webhooks are enabled. Deploy this updated `send-push` function from the mobile
repository.

## Configure and deploy

Run `event_notifications.sql` and then `push_notifications_setup.sql` in the
Supabase SQL Editor. The first maintains notification snapshots for approved
events and notices; the second creates the RLS-protected device-token table and
adds the push claim column. Existing approved notices are added to the feed
without sending a historical push. Then deploy the Edge Function from the
linked mobile app project:

```powershell
$serviceAccountPath = "$HOME\Downloads\<downloaded-service-account>.json"
$serviceAccount = Get-Content -Raw $serviceAccountPath |
  ConvertFrom-Json |
  ConvertTo-Json -Compress
$envFile = [System.IO.Path]::GetTempFileName()
try {
  [System.IO.File]::WriteAllText(
    $envFile,
    "FIREBASE_SERVICE_ACCOUNT=$serviceAccount",
    [System.Text.UTF8Encoding]::new($false)
  )
  supabase secrets set --env-file $envFile
  if ($LASTEXITCODE -ne 0) {
    throw "Could not set the Firebase service-account secret in Supabase."
  }
} finally {
  Remove-Item $envFile -Force -ErrorAction SilentlyContinue
  Remove-Variable serviceAccount -ErrorAction SilentlyContinue
}

supabase functions deploy send-push --no-verify-jwt
```

Replace the placeholder with the downloaded JSON file's path. Run this only from
the linked Supabase project; it uploads the credential to Supabase Secrets and
removes the temporary env file afterward. Never add the service-account JSON or
the generated env file to the repository or mobile app.

Configure Database Webhooks in Supabase:

1. Configure `public.event_notifications` for **Insert**. This is the
   preferred webhook because the approval trigger creates a snapshot for both
   approved events and notices.
2. Also configure `public.events` for **Update**. This covers a post created
   pending approval and later approved. The function ignores updates that do
   not transition a post into the approved state and looks up the generated
   snapshot after approval.
3. For both webhooks, select **Supabase Edge Functions**, choose `send-push`,
   and use method `POST`.
4. Under HTTP Headers, choose **Add auth header with service key** and keep
   `Content-Type: application/json`.
5. Save both webhooks. Duplicate calls are safe: the function atomically
   claims `push_sent_at` so each notification is sent at most once.

JWT verification is disabled at the Edge Function gateway so it can accept
both request types. The handler validates admin access tokens for direct
admin-app requests and the Supabase service-key bearer header for database
webhooks. Keep `FIREBASE_SERVICE_ACCOUNT` only in Supabase secrets. Never add
it to the repository or mobile app.

## Campus AI assistant

The `campus-assistant` Edge Function answers chat questions using approved
event notifications visible to the signed-in user. It queries Supabase with
the user's access token, so the `event_notifications` row-level security policy
continues to control which events the assistant can use. Gemini receives only
that event context and must not invent event details.

Keep `GEMINI_API_KEY` in Supabase Edge Function secrets; never put it in the
mobile app. The chat screen invokes `campus-assistant` through the authenticated
Supabase client. Deploy function updates from the linked project with:

```powershell
supabase functions deploy campus-assistant
```

JWT verification must remain enabled for this function.

After applying the SQL and deploying the function, rebuild and install the app
so the device can register its FCM token:

```powershell
npm install
npx react-native run-android
```

Test on a physical device by signing in, granting notification permission, and
then approving an event with visibility `all`, `student`, or `faculty`.
Notifications are shown by the operating system while the app is backgrounded
or closed, and as a local banner while the app is open. Check `device_tokens`
for the signed-in user's FCM token and check Supabase Edge Function logs and
Database Webhook delivery logs if a notification does not arrive. Push delivery
requires Firebase Cloud Messaging to be enabled for the service account's
Firebase project. iOS also requires the app's Firebase/APNs configuration.
