# Google OAuth Setup Guide

Follow these steps to generate the `ClientID` and `ClientSecret` required for Google OAuth integration:

## Step 1: Access Google Cloud Console
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Log in with your Google account.

## Step 2: Create a New Project
1. Click on the project dropdown at the top of the page.
2. Select **New Project**.
3. Enter a project name and click **Create**.

## Step 3: Enable the OAuth Consent Screen
1. In the left-hand menu, go to **APIs & Services** > **OAuth consent screen**.
2. Select **External** and click **Create**.
3. Fill in the required fields (e.g., App Name, User Support Email).
4. Add your domain and authorized redirect URIs if applicable.
5. Save the changes.

## Step 4: Enable APIs and Services
1. In the left-hand menu, go to **APIs & Services** > **Library**.
2. Search for "Google Identity Services API".
3. Click on it and enable the API.

## Step 5: Create OAuth Credentials
1. In the left-hand menu, go to **APIs & Services** > **Credentials**.
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**.
3. Select **Web application** as the application type.
4. Add authorized redirect URIs (e.g., `http://localhost:3000/oauth/callback`).
5. Click **Create**.

## Step 6: Retrieve ClientID and ClientSecret
1. After creating the credentials, you will see the `ClientID` and `ClientSecret`.
2. Copy these values and add them to your environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

## Step 7: Update Environment Variables
1. Open your `.env` file in the backend project.
2. Add the following lines:
   ```env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

## Step 8: Test the Integration
1. Restart your backend server to apply the changes.
2. Test the OAuth flow to ensure everything works as expected.

---

If you encounter any issues, refer to the [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2) for further assistance.
