# Firebase Setup Guide for RaceDayPack

Follow these steps to set up Firebase Authentication and Firestore Database for your RaceDayPack application.

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Name your project: `racedaypack` (or your preferred name)
4. Enable Google Analytics (optional but recommended)
5. Create the project

## 2. Enable Authentication

1. In your Firebase project, go to **Authentication** > **Sign-in method**
2. Enable the following sign-in providers:
   - **Email/Password**: Enable this provider
   - **Google**: Enable and configure with your domain
3. Go to **Authentication** > **Settings** > **Authorized domains**
4. Add your domain (for local development, `localhost` is already included)

## 3. Create Firestore Database

1. Go to **Firestore Database** in the Firebase console
2. Click "Create database"
3. Start in **production mode** (we'll add security rules)
4. Choose your location (pick closest to your users)

## 4. Configure Web App

1. Go to **Project settings** (gear icon) > **General**
2. Scroll to "Your apps" and click **Web** (`</>` icon)
3. Register your app with nickname: `racedaypack-web`
4. Copy the configuration object
5. Replace the placeholder config in `firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-actual-app-id"
};
```

## 5. Set Up Security Rules

1. Go to **Firestore Database** > **Rules**
2. Replace the default rules with the contents from `firestore.rules`
3. Click "Publish"

## 6. Test the Setup

1. Open your app in a web browser
2. Try creating an account
3. Check the Authentication tab in Firebase Console to see the new user
4. Create a race plan and check Firestore to see the data

## Database Structure

The app creates the following collections:

```
users/{userId}
├── displayName: string
├── email: string
├── experience: string
├── preferredRaceTypes: array
├── settings: object
├── createdAt: timestamp
└── updatedAt: timestamp

users/{userId}/racePlans/{planId}
├── raceDetails: object
├── recommendations: object
├── userProfile: object
├── isPublic: boolean
├── createdAt: timestamp
└── updatedAt: timestamp

publicRacePlans/{planId}
├── [same as race plan data]
├── ownerName: string
└── ownerId: string
```

## Optional Enhancements

### Enable Offline Support
The app automatically enables Firestore offline persistence. Users can use the app offline and sync when back online.

### Email Verification
To enable email verification:
1. Go to Authentication > Templates
2. Customize the email verification template
3. In your app settings, require email verification before access

### Password Reset
Email templates for password reset are automatically configured. Users can reset passwords through the "Forgot Password" link.

### Google Sign-In Configuration
For production deployment:
1. Add your production domain to authorized domains
2. Configure OAuth consent screen in Google Cloud Console
3. Add your client IDs to the authorized origins

## Deployment Notes

### GitHub Pages
If deploying to GitHub Pages, add your GitHub Pages domain to:
- Firebase Authentication > Settings > Authorized domains
- Update `firebase-config.js` with production URLs

### Custom Domain
For custom domains:
1. Set up Firebase Hosting or use your own hosting
2. Update authorized domains in Firebase Auth
3. Ensure HTTPS is enabled (required for authentication)

## Security Considerations

The included security rules ensure:
- Users can only access their own data
- Public plans are readable by all authenticated users
- Proper validation of data types and required fields
- Rate limiting and size limits on documents

## Troubleshooting

### Common Issues

**"Firebase not defined" errors:**
- Ensure Firebase scripts are loaded before your app script
- Check the script loading order in `index.html`

**Authentication not working:**
- Verify your domain is in authorized domains
- Check browser console for specific error messages
- Ensure popup blockers aren't blocking Google sign-in

**Firestore permission errors:**
- Verify security rules are properly deployed
- Check that user is authenticated before accessing data
- Ensure document paths match the security rules

**Offline mode issues:**
- Clear browser cache and storage if having sync issues
- Check network connectivity
- Verify Firestore persistence is enabled

For more help, check the [Firebase Documentation](https://firebase.google.com/docs) or contact support.