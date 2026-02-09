# Clerk Authentication Setup

This application uses Clerk for authentication. To run the application, you need to set up Clerk API keys.

## Setup Steps

### 1. Create a Clerk Application

1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Sign up or log in
3. Create a new application
4. Choose your preferred authentication methods (Email, Google, etc.)

### 2. Get API Keys

1. In your Clerk dashboard, navigate to **API Keys** (or visit [https://dashboard.clerk.com/last-active?path=api-keys](https://dashboard.clerk.com/last-active?path=api-keys))
2. Copy your **Publishable Key** (starts with `pk_test_`)
3. Copy your **Secret Key** (starts with `sk_test_`)

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
```

**Important:** Never commit the `.env` file to version control. It's already in `.gitignore`.

### 4. Configure Sign-In/Sign-Up URLs

In your Clerk dashboard:

1. Go to **Settings** → **Paths**
2. Set **Sign-in URL** to: `/sign-in`
3. Set **Sign-up URL** to: `/sign-up`
4. Set **After sign-in URL** to: `/`
5. Set **After sign-up URL** to: `/`

## Keyless Mode (Development)

Alternatively, Clerk supports "Keyless" mode for development:

1. Start your dev server without setting environment variables
2. Navigate to your app in the browser
3. Clerk will show a "Claim your application" popover
4. Follow the prompts to automatically configure your development keys

This is the easiest way to get started for local development.

## Testing Authentication

Once configured, you can test:

1. Visit `http://localhost:4321` - should redirect to `/sign-in`
2. Create an account via the sign-up page
3. After signing in, you should be redirected to the homepage
4. Your user will be automatically synced to the local database

## Troubleshooting

- **500 Error:** Check that your environment variables are set correctly
- **Redirect loops:** Verify your Clerk dashboard paths match the app's routes
- **User not syncing:** Check the server logs for database errors
