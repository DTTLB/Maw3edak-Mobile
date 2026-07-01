// Receptionists get the exact same settings screen as doctors (theme, language,
// notifications, biometrics, password, 2FA, help, account deletion, logout).
// Re-export keeps a single source of truth — no duplicated settings logic.
export { default } from '../(doctor-tabs)/settings';
