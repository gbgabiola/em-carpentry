# 0006: Developer-managed website access

Confirmed by the user on 2 November 2026. This supersedes earlier client self-service expectations in AGENTS.md and handover documents.

Only the developer administers the website and Supabase. The business client sends requests and approved content to the developer; the developer edits, verifies and publishes through the existing protected tools. The client does not need a website login, Supabase account or database credentials. Do not create or invite a client user, or assume the public business email is the developer's login.

Retain the existing admin dashboard as a developer tool. The authorisation model is unchanged: only a manually provisioned Supabase Auth user explicitly present in private.admin_users can use protected operations. Legacy SQL/function/migration names using owner are implementation names, not instructions to grant access to the client. No live user or membership is created by this decision.

The Supabase organization/dashboard login and the website's Auth account are separate identities. If the developer wants to use /login, provision their own chosen website Auth account and membership; do not request a password in chat. Alternatively, developer database/source workflows remain available without provisioning a client account. New provider sign-ups must still be disabled before launch.

The client supplies verified service details, photos with permission and permitted Facebook testimonials. The developer checks publication approval, maintains content, reviews enquiries, moderates feedback, manages deletion requests and handles exports/backups. No public enquiry/review intake is enabled until retention is agreed. Business content and customer data remain exportable even though the developer controls the technical accounts.

A client-facing admin handover and client self-service acceptance test are no longer launch requirements. Developer sign-in/access verification, server authorisation, RLS, private storage, recovery, and the remaining launch gates still apply.
