# Session Persistence Fix

This document explains the session persistence implementation that keeps users logged in when they close and reopen the app.

## Problem

Previously, users had to log in again every time they closed and reopened the app on a real device. This happened because:

1. The Supabase client was not configured to persist sessions to AsyncStorage
2. There was no centralized auth state management
3. Sessions were only stored in custom format but not integrated with Supabase's auth system

## Solution

### 1. Supabase Client Configuration

**File**: `utils/supabase.ts`

Updated the Supabase client to use AsyncStorage for session persistence:

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,           // Persist sessions to AsyncStorage
    autoRefreshToken: true,          // Auto-refresh expired tokens
    persistSession: true,            // Enable session persistence
    detectSessionInUrl: false,       // Disable URL-based session (mobile)
  },
});
```

### 2. Auth Context

**File**: `contexts/AuthContext.tsx`

Created a centralized auth context that:

- Manages both custom sessions and Supabase auth sessions
- Automatically restores sessions on app launch
- Listens for auth state changes
- Provides sign out functionality
- Handles session refresh

Key features:

```typescript
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State management
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseSession, setSupabaseSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth on app launch
  useEffect(() => {
    const initializeAuth = async () => {
      // Restore custom session from AsyncStorage
      const storedSession = await getSession();
      if (storedSession) {
        setSession(storedSession);
      }

      // Restore Supabase auth session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        setSupabaseSession(currentSession);
      }

      setIsLoading(false);
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSupabaseSession(session);
      if (event === 'SIGNED_OUT') {
        await clearSession();
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ... rest of the implementation
};
```

### 3. Root Layout Integration

**File**: `app/_layout.tsx`

Wrapped the entire app with AuthProvider:

```typescript
return (
  <AuthProvider>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
    <StatusBar style="auto" />
  </AuthProvider>
);
```

### 4. Index Screen Update

**File**: `app/index.tsx`

Updated to check for authentication before redirecting:

```typescript
export default function Index() {
  const { session, supabaseSession, isLoading } = useAuth();

  // Show loading while checking session
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Redirect to tabs if authenticated
  if (session || supabaseSession) {
    return <Redirect href="/(tabs)" />;
  }

  // Redirect to login if not authenticated
  return <Redirect href="/login" />;
}
```

### 5. Login Screen Updates

**Files**:
- `app/(auth)/patient-login.tsx`
- `app/(auth)/doctor-login.tsx`

Updated login screens to refresh auth context after saving session:

```typescript
await saveSession({
  access_token: data.session.token,
  refresh_token: data.session.refresh_token || '',
  expires_at: data.session.expires_at || 0,
  user: data.user,
  patient: data.patient,
});

// Refresh auth context to update state
await refreshSession();

router.replace('/(tabs)');
```

### 6. Profile Screen Update

**File**: `app/(tabs)/profile.tsx`

Updated sign out to use auth context:

```typescript
const { signOut } = useAuth();

const handleLogout = async () => {
  Alert.alert('Logout', 'Are you sure you want to logout?', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Logout',
      style: 'destructive',
      onPress: async () => {
        await signOut();  // Uses auth context
        router.replace('/login');
      },
    },
  ]);
};
```

## How It Works

1. **First Login**:
   - User logs in via patient-login or doctor-login
   - Custom session is saved to AsyncStorage
   - Auth context state is updated
   - User is redirected to the app

2. **App Close & Reopen**:
   - Auth context initializes on app launch
   - Checks AsyncStorage for existing session
   - Restores session state if found
   - Index screen checks auth state
   - Redirects to tabs if authenticated, or login if not

3. **Token Auto-Refresh**:
   - Supabase client automatically refreshes expired tokens
   - Session remains valid without user intervention

4. **Sign Out**:
   - Clears both custom session and Supabase auth session
   - Clears AsyncStorage
   - Redirects to login screen

## Benefits

1. **Seamless User Experience**: Users stay logged in across app restarts
2. **Automatic Token Refresh**: No manual token refresh needed
3. **Centralized State**: Single source of truth for auth state
4. **Type Safe**: Full TypeScript support
5. **React Native Best Practices**: Uses AsyncStorage for persistence

## Testing

To verify session persistence:

1. Log in to the app
2. Close the app completely (swipe away from recent apps)
3. Reopen the app
4. You should be automatically logged in without seeing the login screen

## Security Considerations

- Sessions are stored securely in AsyncStorage
- Tokens auto-refresh to maintain security
- Proper session expiration checks
- Clean session clearing on sign out
