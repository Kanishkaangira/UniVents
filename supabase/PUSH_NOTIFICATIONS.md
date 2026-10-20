# Event push notifications

The `event_notifications` table is maintained by the approved-event trigger in
`event_notifications.sql`. Create a Supabase Database Webhook that sends each
new row to the `send-push` Edge Function. The function sends the row's `title`
and `message` through Firebase Cloud Messaging (FCM) HTTP v1.

The mobile app subscribes permitted users to the `all` topic and to their
`student` or `faculty` topic. The function routes `visibility = all` to `all`
and role-specific visibility to that matching role topic. Android displays the
UniVents status icon, event poster when available, high-priority channel, and
the device's default notification sound. The channel is created when the app
starts. It uses the versioned `univents_event_updates_v2` channel so Android
does not keep an older channel's disabled sound or low importance; rebuild and
reinstall the Android app after changing native resources. While the app is
open, the mobile app loads the push's notification row from
`event_notifications` before displaying its local banner.

The function accepts both the admin app's `{event_id}` request (validated
against the signed-in admin and event scope) and a Supabase Database Webhook
`INSERT` payload (validated against the service-role key). Both paths claim the
same notification row before sending, preventing duplicate pushes if both are
enabled. Deploy either repository's updated `send-push` function; both accept
the two request formats.

## Configure and deploy

The Firebase service account JSON stays in Supabase secrets; do not add it to
the repository or send it to Codex. Since `FIREBASE_SERVICE_ACCOUNT` is already
set in Supabase, there is no need to set it again. First run
`event_notification_push_delivery.sql` from the admin repository in the
Supabase SQL Editor to add the one-time push claim column. Then, from the
linked mobile app project, run:

```powershell
supabase functions deploy send-push --no-verify-jwt
```

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
webhooks. The Firebase service-account secret is only used to send to FCM.

After changing native Firebase settings or Android permissions, rebuild and
install the app:

```powershell
npm install
npx react-native run-android
```

Test by approving an event with visibility `all`, `student`, or `faculty`.
Check Supabase Edge Function logs and the Database Webhook delivery logs if it
does not arrive. Push delivery requires the Firebase Cloud Messaging API to be
enabled for the service account's Firebase project.
