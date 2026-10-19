<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d88e9f5d-216e-4f04-8c55-c1b78ec01cc5

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Email login and first administrator

The portal now uses Netlify Identity email login. There is no shared default login.

1. In the Netlify dashboard, open this project's **Identity** panel. After the updated site is deployed, use **Invite users** to invite your own email address.
2. Open the invitation email and follow the link to the site. Set your own password (at least 12 characters).
3. In Identity, open your user record, add the **admin** role, and save. Sign out and sign in again with your email address and the password you chose.
4. Use **Forgot password** on the login page to request a recovery email when needed. Expired invitation links require a fresh invitation.

Keep Identity registration set to **Invite only** for this factory portal. Accounts without verified email and an assigned role cannot open the application. Public registration does not grant factory access or administrative permissions.

For employees, invite their email, assign the **employee** role, and set server-controlled Identity application metadata `portal_user_id` to their existing factory user ID. This links attendance and production records without trusting user-editable metadata. Existing factory profiles alone do not provide Identity login access. Manage Identity roles and account access separately from the legacy employee directory.

This change replaced the login and session entry flow. Existing factory data synchronization and its backend access rules were not migrated; their authorization remains a separate concern. Do not treat this browser login gate as a replacement for backend data authorization.

Validation: `npm run lint` checks TypeScript. `node --import tsx --test tests/identityAccess.test.ts` checks the Identity role and profile mapping rules. Full email delivery and invitation/reset callbacks require a deployed site with Identity active.
