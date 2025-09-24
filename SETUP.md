# Absurd Guild Setup Guide

This guide will help you set up the Absurd Guild platform with Cloudflare D1 database and KV storage for authentication.

## Prerequisites

Before starting, make sure you have:

- [Node.js](https://nodejs.org/) (v18 or later)
- [pnpm](https://pnpm.io/) package manager
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed and authenticated
- A Cloudflare account

## Quick Setup (Automated)

We've included an automated setup script that handles all the infrastructure setup:

```bash
# Make the script executable (if not already)
chmod +x setup-db.sh

# Run the setup script
./setup-db.sh
```

This script will automatically:

1. Create the Cloudflare D1 database
2. Create KV namespaces for sessions
3. Update your `wrangler.jsonc` with the actual IDs
4. Execute the database schema
5. Display your infrastructure details

## Manual Setup (Step by Step)

If you prefer to set up manually or the script fails, follow these steps:

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Create Cloudflare D1 Database

```bash
wrangler d1 create absurd-guild-db
```

This will output something like:

```
✅ Successfully created DB 'absurd-guild-db' in region APAC
Created your database using D1's new storage backend. The new storage backend is not yet recommended for production workloads, but backs up your data via point-in-time restore.

[[d1_databases]]
binding = "DB" # i.e. available in your Worker on env.DB
database_name = "absurd-guild-db"
database_id = "your-database-id-here"
```

**Copy the `database_id` value** - you'll need it for the next step.

### 3. Create KV Namespaces for Sessions

Create the production KV namespace:

```bash
wrangler kv namespace create "absurd-guild-sessions"
```

Output:

```
🌀 Creating namespace with title "your-worker-name-sessions"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "SESSIONS", id = "your-kv-id-here" }
```

Create the preview KV namespace:

```bash
wrangler kv namespace create "absurd-guild-sessions" --preview
```

Output:

```
🌀 Creating namespace with title "your-worker-name-sessions_preview"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "SESSIONS", preview_id = "your-preview-kv-id-here" }
```

**Copy both the `id` and `preview_id` values**.

### 4. Update wrangler.jsonc

Replace the placeholder values in `wrangler.jsonc` with your actual IDs:

```jsonc
{
  // ... other config
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "absurd-guild-db",
      "database_id": "your-actual-database-id",
    },
  ],
  "kv_namespaces": [
    {
      "binding": "SESSIONS",
      "id": "your-actual-kv-id",
      "preview_id": "your-actual-preview-kv-id",
    },
  ],
}
```

### 5. Set Up Database Schema

Execute the schema file to create all necessary tables:

```bash
wrangler d1 migrations apply absurd-guild-db
```

This creates all the tables needed:

- `users` - User accounts
- `magic_links` - Authentication tokens
- `user_sessions` - Session management
- `campaigns` - Crowdfunding campaigns
- `rewards` - Campaign reward tiers
- `backers` - Campaign supporters
- `products` - Shop products
- `campaign_assets` - Open source files
- `campaign_updates` - Project updates
- `shipping_addresses` - User addresses
- `site_settings` - Platform configuration

## Development

Start the development server:

```bash
pnpm run dev
```

Visit `http://localhost:5173` to see your app.

## Testing Authentication

1. Go to `/auth/login`
2. Enter any email address
3. Check your console logs for the magic link (in development)
4. Click the magic link to authenticate
5. You'll be redirected with a persistent session

## Production Deployment

Before deploying to production:

### 1. Configure Email Service

Update the `sendMagicLinkEmail` function in `app/lib/auth.server.ts` to use a real email service like:

- [Resend](https://resend.com/)
- [SendGrid](https://sendgrid.com/)
- [Mailgun](https://www.mailgun.com/)
- [Amazon SES](https://aws.amazon.com/ses/)

Example with Resend:

```typescript
async function sendMagicLinkEmail(
  email: string,
  magicLink: string
): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Absurd Guild <noreply@yourdomain.com>",
      to: [email],
      subject: "Your Magic Link to Absurd Guild",
      html: `
        <h1>Welcome to Absurd Guild!</h1>
        <p>Click the link below to sign in:</p>
        <a href="${magicLink}" style="background: #ff4500; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
          Sign In to Absurd Guild
        </a>
        <p>This link will expire in 15 minutes.</p>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send email");
  }
}
```

### 2. Deploy to Cloudflare

```bash
pnpm run deploy
```

## Troubleshooting

### Common Issues

**Database ID not found:**

- Make sure you're using the correct database ID from the `wrangler d1 create` output
- Check that `wrangler.jsonc` has been updated with the correct ID

**KV namespace errors:**

- Verify both `id` and `preview_id` are set correctly
- Make sure you're authenticated with Wrangler: `wrangler auth login`

**Schema execution fails:**

- Check that your `schema.sql` file exists and is valid
- Try running the schema commands individually

**Magic links not working:**

- Check the browser console for any JavaScript errors
- Verify the token in the URL matches what's in the database
- Check that the token hasn't expired (15-minute window)

**Authentication not persisting:**

- Check that cookies are being set properly
- Verify KV namespace is working: `wrangler kv:key list --binding SESSIONS`

### Getting Help

- Check the [Cloudflare Workers docs](https://developers.cloudflare.com/workers/)
- Review the [React Router v7 documentation](https://reactrouter.com/)
- Look at the implementation plan in `notes/guild.md`

## Project Structure

```
absurd-guild/
├── app/
│   ├── lib/
│   │   ├── db.server.ts          # Database utilities
│   │   └── auth.server.ts        # Authentication service
│   ├── components/
│   │   └── Navigation.tsx        # Main navigation
│   ├── routes/
│   │   ├── _index.tsx           # Homepage
│   │   ├── auth.login.tsx       # Magic link login
│   │   ├── auth.verify.tsx      # Magic link verification
│   │   └── auth.logout.tsx      # Logout handler
│   ├── app.css                  # Styling with Absurd brand colors
│   ├── root.tsx                 # Root layout
│   └── routes.ts                # Route configuration
├── schema.sql                   # Database schema
├── setup-db.sh                 # Automated setup script
├── wrangler.jsonc              # Cloudflare configuration
└── package.json                # Dependencies
```

## Next Steps

Once you have the basic authentication working, you can proceed with the implementation plan:

1. **Phase 2**: Campaign Management (create, edit, display campaigns)
2. **Phase 3**: Backing System (payments, rewards, shipping)
3. **Phase 4**: Advanced Features (updates, community, shop integration)

Check `notes/guild.md` for the detailed implementation roadmap.
