# Client website access

Sign in at https://em-carpentry.netlify.app/login using the privately agreed website-admin credentials. The client does not need a Supabase/Netlify organization seat, database-console access or API keys. There is no public registration.

Use the dashboard to manage portfolio projects, photos, services, FAQs, testimonials and business information. Follow the [owner workflow](owner-workflow.md) and publish only approved content.

## Account security

Under Account security, enter the current password and a different new passphrase of at least 12 characters twice. Keep it in a password manager. Use Sign out on shared devices and verify that the new password works after changing it.

Password changes request revocation of other refresh sessions, but existing access tokens may remain valid until expiry. Contact the developer for urgent access removal or forgotten-password recovery; automatic reset emails are not configured. The developer can remove private website membership and revoke provider sessions.

For a replacement account, follow [backend setup](backend-setup.md). Keep all passwords, session tokens and personal login details outside source code and public documents.
