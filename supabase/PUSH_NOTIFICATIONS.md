# Event push notifications

The `event_notifications` table is maintained by the approved-event trigger in
`event_notifications.sql`. A Supabase Database Webhook sends each new row to the
`send-push` Edge Function. The function sends the row's `title` and `message`
through Firebase Cloud Messaging (FCM) HTTP v1 to registered device tokens.

When a student or faculty member signs in, the app requests notification
permission, saves its FCM token in `device_tokens`, and updates `last_seen` when
the token refreshes. Signing out attempts to remove that device's token. The
Edge Function uses the event's `visibility` to find eligible profiles, then
sends the FCM notification to each registered device. Firebase service-account
credentials remain in Supabase secrets and are never stored in the mobile app.

Android displays the UniVents status icon, event poster when available,
high-priority channel, and the device's default notification sound. The channel
is created when the app registers for notifications and is also configured as
the native FCM default. While the app is open, the mobile app loads the push's
notification row from `event_notifications` before displaying its local banner.

The function accepts both the admin app's `{event_id}` request (validated
against the signed-in admin and event scope) and a Supabase Database Webhook
`INSERT` payload (validated against the service-role key). Both paths claim the
same notification row before sending, preventing duplicate pushes if both are
enabled. Deploy this updated `send-push` function from the mobile repository;
it accepts both request formats.

## Configure and deploy

Run `push_notifications_setup.sql` in the Supabase SQL Editor. This creates the
RLS-protected device token table and adds the push claim column. Then deploy the
Edge Function from the linked mobile app project:

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

Configure a Database Webhook in Supabase:

1. Select table `public.event_notifications` and event **Insert** only.
2. Select **Supabase Edge Functions**, choose `send-push`, and use method
   `POST`.
3. Under HTTP Headers, choose **Add auth header with service key** and keep
   `Content-Type: application/json`.
4. Save the webhook. Approved events inserted by the database trigger will
   then generate a push.

JWT verification is disabled at the Edge Function gateway so it can accept
both request types. The handler validates admin access tokens for direct
admin-app requests and the Supabase service-key bearer header for database
webhooks. Keep `FIREBASE_SERVICE_ACCOUNT` only in Supabase secrets. Never add
it to the repository or mobile app.

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
