# Maw3edak Mobile App - Complete Setup Guide

## Prerequisites

Before starting, make sure you have:

1. **Node.js** (v18 or later) - [Download](https://nodejs.org/)
2. **Git** installed - [Download](https://git-scm.com/)
3. **Expo CLI** installed globally:
   ```bash
   npm install -g expo-cli eas-cli
   ```
4. **Expo Account** - [Sign up](https://expo.dev/)
5. **Expo Go App** installed on your iPhone (from App Store)
6. **Android device or emulator** for testing

---

## Step 1: Create Git Repository

### Option A: GitHub
1. Go to [github.com](https://github.com) and create a new repository
2. Name it: `maw3edak-mobile`
3. Keep it **private** (contains sensitive configs)
4. **DO NOT** initialize with README

### Option B: GitLab or Bitbucket
Same steps as GitHub

---

## Step 2: Upload Code to Repository

Open Terminal in your project directory and run:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Make first commit
git commit -m "Initial commit - Maw3edak mobile app"

# Add your remote repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/maw3edak-mobile.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 3: Configure Environment Variables

1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your actual values:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://ttyukcvqifqyfolxtwba.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_actual_key_here
   ```

---

## Step 4: Install Dependencies

```bash
npm install
```

---

## Step 5: Add Firebase Configuration Files

### For Android:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** > **General**
4. Scroll to "Your apps" section
5. Click **Android app**
6. Download `google-services.json`
7. Place it in: `android/app/google-services.json`

### For iOS:
1. Same Firebase Console
2. Click **iOS app**
3. Download `GoogleService-Info.plist`
4. Place it in: `ios/Maw3edakAPP/GoogleService-Info.plist`

**Note:** These files are already in your project but should be replaced with YOUR Firebase project files.

---

## Step 6: Login to Expo

```bash
# Login to your Expo account
npx expo login

# Or create new account
npx expo register
```

---

## Step 7: Configure EAS (Expo Application Services)

```bash
# Login to EAS
eas login

# Link project to your Expo account
eas init

# This will ask for project details - keep the defaults
```

Your `app.json` already has the project ID configured.

---

## Step 8: Test on iPhone (Development)

### Method 1: Expo Go (Quick Test)
```bash
# Start development server with tunnel
npm run dev:tunnel
```

1. Scan the QR code with your iPhone camera
2. App will open in Expo Go
3. **Note:** Some features like Firebase push notifications won't work in Expo Go

### Method 2: Development Build (Full Features)
```bash
# Build development version for iOS
eas build --profile development --platform ios

# This creates an .ipa file you can install via TestFlight
```

---

## Step 9: Build Android APK

### Preview Build (for testing):
```bash
eas build --profile preview --platform android
```

This will:
1. Build the app on Expo's servers
2. Create an APK file
3. Provide a download link

**Build time:** 10-20 minutes

### Production Build:
```bash
eas build --profile production --platform android
```

---

## Step 10: Install APK on Android

1. After build completes, you'll get a download link
2. Download the APK to your Android device
3. Enable "Install from Unknown Sources" in Settings
4. Open the APK file to install
5. App will be installed as "Maw3edak"

---

## Step 11: Working with Git Branches

### Create feature branch:
```bash
git checkout -b feature/new-feature-name
```

### View all branches:
```bash
git branch -a
```

### Switch branches:
```bash
git checkout main
git checkout feature/new-feature-name
```

### Push branch to remote:
```bash
git push origin feature/new-feature-name
```

### Merge branch to main:
```bash
git checkout main
git merge feature/new-feature-name
git push origin main
```

---

## Step 12: View Updates in Expo Dashboard

1. Go to [expo.dev](https://expo.dev/)
2. Login to your account
3. Click on "Maw3edak" project
4. You'll see:
   - All builds (iOS/Android)
   - Build status and logs
   - Download links for APKs
   - Update history

---

## Useful Commands

### Development:
```bash
# Start dev server (local network)
npm run dev

# Start with tunnel (works anywhere)
npm run dev:tunnel

# Start with LAN only
npm run dev:lan
```

### Building:
```bash
# Android APK (preview)
eas build -p android --profile preview

# Android APK (production)
eas build -p android --profile production

# iOS build
eas build -p ios --profile preview
```

### Type Checking:
```bash
npm run typecheck
```

### Linting:
```bash
npm run lint
```

---

## Troubleshooting

### Build fails with Firebase error:
- Ensure `google-services.json` and `GoogleService-Info.plist` are in correct locations
- Verify files are from the same Firebase project

### Expo Go shows error:
- Use development build instead: `eas build --profile development`
- Expo Go has limitations with native modules

### Can't connect with tunnel:
- Check firewall settings
- Try using `--lan` flag instead
- Use `--tunnel` if testing on different network

### Environment variables not working:
- Must prefix with `EXPO_PUBLIC_` for client-side access
- Restart dev server after changing `.env`

---

## Project Structure

```
maw3edak-mobile/
├── app/                    # Routes (expo-router)
│   ├── (auth)/            # Auth screens
│   ├── (tabs)/            # Main tab screens
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
├── contexts/              # React contexts (Auth)
├── utils/                 # Utilities (Supabase, Auth, etc)
├── assets/               # Images and static files
├── android/              # Android native files
├── ios/                  # iOS native files
├── supabase/             # Supabase migrations & functions
├── .env                  # Environment variables (not in git)
├── app.json              # Expo config
└── eas.json              # EAS build config
```

---

## Important Notes

1. **Never commit** `.env` file to git (already in .gitignore)
2. **Never commit** Firebase config files with real credentials
3. **Always test** on real device before production build
4. **Keep** your Expo account credentials secure
5. **Update** `version` in `app.json` before each build

---

## Support

- **Expo Docs:** https://docs.expo.dev/
- **EAS Build:** https://docs.expo.dev/build/introduction/
- **React Native:** https://reactnative.dev/
- **Supabase:** https://supabase.com/docs

---

## Next Steps After Setup

1. Test login functionality
2. Test push notifications on real device
3. Test appointment booking flow
4. Submit to Google Play Store (for production)
5. Submit to Apple App Store (requires Apple Developer account)
