import { Redirect } from 'expo-router';

// This tab never actually mounts: the tab bar button intercepts the press and
// pushes the full-screen `/doctor-link-clinic` scanner (see (doctor-tabs)/_layout.tsx).
// The redirect is only a safety net if the route is ever focused directly.
export default function DoctorScanTab() {
  return <Redirect href="/doctor-link-clinic" />;
}
