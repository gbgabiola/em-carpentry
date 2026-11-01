# Client website-account onboarding

The business owner uses the website’s /login and /admin pages to make updates independently. They do not need to join the developer’s Supabase organization, access a database console, or receive API keys.

## One-time developer setup

1. Confirm the intended client email privately. Do not assume the public business address is the login. Do not commit personal login addresses or passwords to the repository.
2. In [Auth Users](https://supabase.com/dashboard/project/lllzqhfjrrtjavpvhmce/auth/users), choose Add user → Create new user. This creates a website Auth user, not a Supabase organization member.
3. Enter the agreed email, set a strong temporary password privately and enable Auto Confirm User if shown. Use manual creation rather than an email invitation; reliable transactional email has not been configured. Public sign-ups should remain disabled (already verified on 2 November 2026).
4. Confirm that the exact intended user exists, their email is confirmed and a password has been set. Only then grant that user private.admin_users membership through the trusted developer connection, following backend-setup.md. Do not grant access to a guessed address or every existing Auth user.
5. Test /login, /admin, sign-out and denied non-owner/anonymous access. The client can use Account security to change the temporary password after initial sign-in. Keep credentials in an agreed private channel, outside chat/source code. No real password needs to be disclosed to the assistant.
6. Before sharing a public URL, complete hosting and deployment approval, actual browser/Auth/Storage tests, content/photo rights review and the remaining launch gates. localhost is only a developer preview, not a client-facing hosted URL.

## Account security

/admin/account is protected by the same server membership checks as the content tools. The password-change action validates matching new passwords, requires a different passphrase of at least 12 characters, verifies the current password with the provider and checks that reauthentication returns the same user. It updates only that signed-in user and asks the provider to revoke other sessions. Password values and raw provider errors are not returned in action state or logged by this code.

Revoking refresh sessions does not immediately invalidate all existing access tokens. For urgent access removal, the developer should remove the user’s private admin membership and revoke provider sessions. Do not promise instant sign-out everywhere after a routine password change. Forgotten-password recovery still needs developer assistance; no reset-email workflow is advertised.

The new flow has local provider-boundary tests and protected-route checks. A real hosted password change, session refresh and browser interaction remain to be verified after provisioning; no live password was changed during implementation.

References: [Supabase users](https://supabase.com/docs/guides/auth/users), [password updates](https://supabase.com/docs/reference/javascript/auth-updateuser), [sign-out behaviour](https://supabase.com/docs/reference/javascript/auth-signout).
