// =============================================================================
// receptionApi.ts
// -----------------------------------------------------------------------------
// Thin client for the RECEPTIONIST booking feature. Every call hits one of the
// NEW `business-*` edge functions (never the existing patient/doctor booking
// endpoints), keeping the reception flow fully self-contained.
//
// A receptionist's data-resolution key is their own user_id (a UUID). The login
// stores it on `session.user.global_id` (and `session.user.realUserId`); this
// module reads whichever is present, plus the company_id, to scope every call.
// =============================================================================

import { config } from '@/utils/config';

// ---- Types -----------------------------------------------------------------

export interface ReceptionPatient {
  patient_id: string;
  medical_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company_id: string;
  company_name: string;
  appointment_count: number;
  last_appointment_date: string | null;
}

export interface ReceptionPatientDetail {
  patient_id: string;
  medical_id: string | null;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_type: string | null;
  address: string | null;
  image: string | null;
  medical_notes: string | null;
  medical_history: string | null;
  company_id: string;
  company_name: string;
  is_active: boolean;
}

export interface ReceptionClinic {
  id: string;
  name: string;
  address: string;
}

export interface ReceptionDoctor {
  id: string;
  first_name: string;
  last_name: string;
  image_url: string | null;
  specialization: string;
  company_id: string;
  clinics: ReceptionClinic[];
}

export interface ReceptionSlot {
  time: string; // "HH:MM"
  available: boolean;
}

export interface ReceptionService {
  id: string;
  name: string;
  description: string;
  price: number | null;
  duration_minutes: number | null;
}

export interface ReceptionRoom {
  id: string;
  room_number: string;
  room_type: string;
  floor: number | null;
}

export interface ReceptionAppointment {
  id: string | number;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  endTime: string;    // HH:MM
  status: string;     // pending | scheduled | confirmed | completed | cancelled
  notes: string;
  isCustom: boolean;
  createdAt: string;
  doctorId: string;
  clinicId: string;
  patientId: string;
  doctorName: string;
  clinicName: string;
  clinicAddress: string;
  patientName: string;
  medicalId: string;
}

const FN = `${config.supabaseUrl}/functions/v1`;

// Shared POST helper — attaches the anon key and parses JSON, surfacing the
// edge function's `error` field as a thrown Error for the caller's catch block.
async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${FN}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // fall through to status-based error
  }

  if (!res.ok || (data && data.success === false)) {
    const message = data?.error || `Request failed (${res.status})`;
    const details = data?.details ? `\n${data.details}` : '';
    throw new Error(message + details);
  }
  return data as T;
}

// ---- Endpoints -------------------------------------------------------------

/** Patients the receptionist may book for (across all their assigned doctors). */
export async function getPatients(userId: string, companyId?: string | null): Promise<ReceptionPatient[]> {
  const data = await post<{ patients: ReceptionPatient[] }>('business-get-booking-patients', {
    user_id: userId,
    company_id: companyId ?? null,
  });
  return data.patients || [];
}

export interface CreatePatientResult {
  patientId: string;
  medicalId: string;
  password: string;
  reactivated: boolean;
}

/**
 * Register a walk-in patient from the reception desk. Mirrors patient sign-up
 * (creates the global account, generates a unique medical_id and password) but
 * skips the human-verification / OTP step, and also creates the company-scoped
 * patient profile + doctor links. Returns the medical_id and the generated
 * password (shown once) so the receptionist can share them with the patient.
 */
export async function createPatient(params: {
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  bloodType?: string | null;
  address?: string | null;
}): Promise<CreatePatientResult> {
  const data = await post<{
    patientId: string;
    medicalId: string;
    password: string;
    reactivated: boolean;
  }>('business-create-patient', {
    user_id: params.userId,
    first_name: params.firstName,
    last_name: params.lastName,
    phone: params.phone ?? null,
    email: params.email ?? null,
    date_of_birth: params.dateOfBirth ?? null,
    gender: params.gender ?? null,
    blood_type: params.bloodType ?? null,
    address: params.address ?? null,
  });
  return {
    patientId: data.patientId,
    medicalId: data.medicalId,
    password: data.password,
    reactivated: !!data.reactivated,
  };
}

/** Full profile (DOB, gender, blood type, address, ...) for one patient. */
export async function getPatientDetail(
  userId: string,
  patientId: string,
  companyId?: string | null
): Promise<ReceptionPatientDetail> {
  const data = await post<{ patient: ReceptionPatientDetail }>('business-get-patient', {
    user_id: userId,
    patient_id: patientId,
    company_id: companyId ?? null,
  });
  return data.patient;
}

// ---- Patient overview (medical records + purchased packages) ---------------

export interface MedicalAllergy {
  id: string;
  allergen: string | null;
  type: string | null;
  severity: string | null;
  reaction: string | null;
}

export interface MedicalEmergencyContact {
  id: string;
  name: string | null;
  relationship: string | null;
  phone: string | null;
  is_primary: boolean | null;
}

export interface MedicalCondition {
  id: string;
  condition: string | null;
  diagnosed_on: string | null;
  notes: string | null;
}

export interface MedicalSurgery {
  id: string;
  procedure: string | null;
  performed_on: string | null;
  notes: string | null;
}

export interface PatientMedicalRecords {
  allergies: MedicalAllergy[];
  emergency_contacts: MedicalEmergencyContact[];
  conditions: MedicalCondition[];
  surgeries: MedicalSurgery[];
}

export interface PatientPackageService {
  service_id: string;
  service_name: string;
  total_sessions: number;
  used_sessions: number;
  remaining_sessions: number;
}

export interface PatientPackage {
  patient_package_id: string;
  package_id: string;
  package_name: string;
  buy_date: string | null;
  price: number;
  services: PatientPackageService[];
  total_sessions: number;
  remaining_sessions: number;
}

export interface PatientOverview {
  medical_records: PatientMedicalRecords;
  packages: PatientPackage[];
}

/**
 * Clinical "extras" for the reception patient-details screen: read-only medical
 * records (allergies / emergency contacts / conditions / surgeries) and the
 * patient's purchased packages with per-service remaining-session counts.
 * Authorized exactly like getPatientDetail. Backed by business-get-patient-overview.
 */
export async function getPatientOverview(
  userId: string,
  patientId: string,
  companyId?: string | null
): Promise<PatientOverview> {
  const data = await post<{
    medical_records?: PatientMedicalRecords;
    packages?: PatientPackage[];
  }>('business-get-patient-overview', {
    user_id: userId,
    patient_id: patientId,
    company_id: companyId ?? null,
  });
  return {
    medical_records: data.medical_records || {
      allergies: [],
      emergency_contacts: [],
      conditions: [],
      surgeries: [],
    },
    packages: data.packages || [],
  };
}

/**
 * Patients linked to ONE specific doctor (patient_doctor_access), validated
 * against the logged-in user's access to that doctor. Use this in the booking
 * flow where the patient list must be scoped to the chosen doctor.
 */
export async function getPatientsByDoctor(
  userId: string,
  doctorId: string,
  companyId?: string | null
): Promise<ReceptionPatient[]> {
  const data = await post<{ patients: ReceptionPatient[] }>('business-get-booking-patients', {
    user_id: userId,
    company_id: companyId ?? null,
    doctor_id: doctorId,
  });
  return data.patients || [];
}

/**
 * Doctors (with their clinics) the receptionist may book with. When `patientId`
 * is given, the list is restricted to the doctors that patient has access to.
 */
export async function getDoctors(
  userId: string,
  companyId?: string | null,
  patientId?: string | null
): Promise<ReceptionDoctor[]> {
  const data = await post<{ doctors: ReceptionDoctor[] }>('business-get-booking-doctors', {
    user_id: userId,
    company_id: companyId ?? null,
    patient_id: patientId ?? null,
  });
  return data.doctors || [];
}

/**
 * 30-minute slots for a doctor/clinic/date. Returns every slot with a flag.
 * `fallback` is true when the doctor has no schedule for that date and the
 * window is a default one for booking a custom appointment.
 */
export async function getSlots(
  doctorId: string,
  clinicId: string,
  date: string
): Promise<{ slots: ReceptionSlot[]; fallback: boolean }> {
  const data = await post<{ slots: ReceptionSlot[]; fallback?: boolean }>('business-get-booking-slots', {
    doctorId,
    clinicId,
    date,
  });
  return { slots: data.slots || [], fallback: !!data.fallback };
}

/** Validate a manual "HH:MM" (24h) custom time and normalise to 2-digit hour. */
export function normalizeTime(input: string): string | null {
  const m = input.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!m) return null;
  return `${m[1].padStart(2, '0')}:${m[2]}`;
}

/** Services + rooms the chosen doctor has access to (doctor-scoped, not company-wide). */
export async function getBookingOptions(
  doctorId: string,
  companyId?: string | null
): Promise<{ services: ReceptionService[]; rooms: ReceptionRoom[] }> {
  const data = await post<{ services: ReceptionService[]; rooms: ReceptionRoom[] }>(
    'business-get-booking-options',
    { doctorId, company_id: companyId ?? null }
  );
  return { services: data.services || [], rooms: data.rooms || [] };
}

/**
 * Create a pending appointment for the chosen patient. The patient is identified
 * by patient_id (preferred — works even with no medical_id) or medical_id.
 */
export async function book(params: {
  userId: string;
  patientId?: string | null;
  medicalId?: string | null;
  doctorId: string;
  clinicId: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceId?: string | null;
  roomId?: string | null;
}): Promise<ReceptionAppointment> {
  const data = await post<{ appointment: ReceptionAppointment }>('business-book-appointment', {
    bookedByUserId: params.userId,
    patientId: params.patientId ?? null,
    medicalId: params.medicalId ?? null,
    doctorId: params.doctorId,
    clinicId: params.clinicId,
    appointmentDate: params.appointmentDate,
    appointmentTime: params.appointmentTime,
    serviceId: params.serviceId ?? null,
    roomId: params.roomId ?? null,
  });
  return data.appointment;
}

/** All appointments across the receptionist's doctors (optionally one patient). */
export async function listMyAppointments(
  userId: string,
  companyId?: string | null,
  medicalId?: string | null
): Promise<ReceptionAppointment[]> {
  const data = await post<{ appointments: ReceptionAppointment[] }>('business-list-appointments', {
    user_id: userId,
    company_id: companyId ?? null,
    medical_id: medicalId ?? null,
  });
  return data.appointments || [];
}

/** Appointments for ONE patient (by patient_id — works even without a medical_id). */
export async function listPatientAppointments(
  userId: string,
  patientId: string,
  companyId?: string | null
): Promise<ReceptionAppointment[]> {
  const data = await post<{ appointments: ReceptionAppointment[] }>('business-list-appointments', {
    user_id: userId,
    company_id: companyId ?? null,
    patient_id: patientId,
  });
  return data.appointments || [];
}

export interface ReceptionNotification {
  id: string;
  category: string;
  message_header: string;
  message_body: string;
  read: boolean;
  created_at: string;
  objective_id: string | null;
  completed: boolean;
  auth_status: string | null;
  company_name: string | null;
}

/** Notifications for the doctors this receptionist has access to. */
export async function listNotifications(
  userId: string,
  companyId?: string | null
): Promise<{ notifications: ReceptionNotification[]; unreadCount: number }> {
  const data = await post<{ notifications: ReceptionNotification[]; unreadCount: number }>(
    'business-get-notifications',
    { user_id: userId, company_id: companyId ?? null }
  );
  return { notifications: data.notifications || [], unreadCount: data.unreadCount || 0 };
}

/** Mark a single notification read (or all when notificationId is omitted). */
export async function markNotificationsRead(
  userId: string,
  companyId?: string | null,
  notificationId?: string | null
): Promise<void> {
  await post('business-mark-notifications-read', {
    user_id: userId,
    company_id: companyId ?? null,
    notificationId: notificationId ?? null,
  });
}

/** Cancel a pending appointment. */
export async function cancel(userId: string, appointmentId: string | number): Promise<void> {
  await post('business-cancel-appointment', {
    user_id: userId,
    appointmentId,
  });
}

/** Statuses a receptionist may set from the appointments screen. */
export type SettableStatus = 'scheduled' | 'completed' | 'cancelled';
export const SETTABLE_STATUSES: SettableStatus[] = ['scheduled', 'completed', 'cancelled'];

/** Change an appointment's status (any current status -> scheduled/completed/cancelled). */
export async function setStatus(
  userId: string,
  appointmentId: string | number,
  status: SettableStatus
): Promise<void> {
  await post('business-set-appointment-status', {
    user_id: userId,
    appointmentId,
    status,
  });
}

/** Reschedule an existing appointment to a new date/time. */
export async function reschedule(
  userId: string,
  appointmentId: string | number,
  appointmentDate: string,
  appointmentTime: string
): Promise<void> {
  await post('business-update-appointment', {
    user_id: userId,
    appointmentId,
    appointmentDate,
    appointmentTime,
  });
}

// ---- Invoicing & statement -------------------------------------------------

export type BillingItemType = 'service' | 'material' | 'package';

export interface BillingResource {
  id: string;
  name: string;
  price: number;
  unit?: string; // materials only
}

export interface BillingResources {
  services: BillingResource[];
  materials: BillingResource[];
  packages: BillingResource[];
}

export type PaymentMethod =
  | 'cash'
  | 'card'
  | 'bank_transfer'
  | 'check'
  | 'mobile_payment'
  | 'other';

export const PAYMENT_METHODS: PaymentMethod[] = [
  'cash',
  'card',
  'bank_transfer',
  'check',
  'mobile_payment',
  'other',
];

export interface InvoiceLineItemInput {
  item_type: BillingItemType;
  service_id?: string | null;
  medical_material_id?: string | null;
  package_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface CreatedInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: string;
}

export interface InvoiceHeaderSummary {
  id: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  payment_status: string;
  status: string;
}

export interface StatementItem {
  item_type: BillingItemType;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface StatementPayment {
  id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number: string;
}

export interface StatementInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  status: string;
  payment_status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  doctor_id: string;
  doctor_name: string;
  patient_id: string;
  patient_name: string;
  patient_medical_id: string;
  items: StatementItem[];
  payments: StatementPayment[];
}

export interface InvoiceDetailLine {
  id: string;
  item_type: BillingItemType;
  service_id: string | null;
  medical_material_id: string | null;
  package_id: string | null;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface InvoiceDetail {
  id: string;
  invoice_number: string;
  invoice_date: string;
  status: string;
  payment_status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  notes: string;
  doctor_id: string;
  doctor_name: string;
  clinic_id: string | null;
  patient_id: string;
  patient_name: string;
  patient_medical_id: string;
  items: InvoiceDetailLine[];
}

export interface StatementSummary {
  total_charges: number;
  total_paid: number;
  total_balance: number;
  total_invoices: number;
}

export interface StatementOption {
  id: string;
  name: string;
}

export interface StatementPatientOption extends StatementOption {
  medical_id: string;
}

export interface Statement {
  summary: StatementSummary;
  by_doctor: (StatementOption & { charges: number; paid: number; balance: number; count: number })[];
  by_patient: (StatementPatientOption & { charges: number; paid: number; balance: number; count: number })[];
  invoices: StatementInvoice[];
  doctors: StatementOption[];
  patients: StatementPatientOption[];
}

/**
 * Billable items (services, materials, packages). When `doctorId` is given the
 * lists are scoped to that doctor's assigned items; otherwise every active item
 * in the staff member's company is returned.
 */
export async function getBillingResources(
  userId: string,
  companyId?: string | null,
  doctorId?: string | null
): Promise<BillingResources> {
  const data = await post<BillingResources>('business-list-billing-resources', {
    user_id: userId,
    company_id: companyId ?? null,
    doctor_id: doctorId ?? null,
  });
  return {
    services: data.services || [],
    materials: data.materials || [],
    packages: data.packages || [],
  };
}

/** Create an invoice (header + line items) for a patient/doctor. */
export async function createInvoice(params: {
  userId: string;
  patientId: string;
  doctorId: string;
  clinicId?: string | null;
  invoiceDate: string;
  taxAmount?: number;
  discountAmount?: number;
  status?: string;
  notes?: string | null;
  items: InvoiceLineItemInput[];
}): Promise<{ invoice: CreatedInvoice; invoiceNumber: string }> {
  const data = await post<{ invoice: CreatedInvoice; invoice_number: string }>('business-create-invoice', {
    user_id: params.userId,
    patient_id: params.patientId,
    doctor_id: params.doctorId,
    clinic_id: params.clinicId ?? null,
    invoice_date: params.invoiceDate,
    tax_amount: params.taxAmount ?? 0,
    discount_amount: params.discountAmount ?? 0,
    status: params.status ?? 'draft',
    notes: params.notes ?? null,
    items: params.items,
  });
  return { invoice: data.invoice, invoiceNumber: data.invoice_number };
}

/** Record a payment against an invoice; returns the trigger-refreshed header. */
export async function addInvoicePayment(params: {
  userId: string;
  invoiceId: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string | null;
  notes?: string | null;
}): Promise<InvoiceHeaderSummary | null> {
  const data = await post<{ header: InvoiceHeaderSummary | null }>('business-add-invoice-payment', {
    user_id: params.userId,
    invoice_id: params.invoiceId,
    payment_date: params.paymentDate,
    amount: params.amount,
    payment_method: params.paymentMethod,
    reference_number: params.referenceNumber ?? null,
    notes: params.notes ?? null,
  });
  return data.header;
}

/** Staff financial statement, optionally filtered by doctor AND/OR patient. */
export async function getStatement(
  userId: string,
  companyId?: string | null,
  doctorId?: string | null,
  patientId?: string | null
): Promise<Statement> {
  const data = await post<Statement>('business-get-statement', {
    user_id: userId,
    company_id: companyId ?? null,
    doctor_id: doctorId ?? null,
    patient_id: patientId ?? null,
  });
  return {
    summary: data.summary || { total_charges: 0, total_paid: 0, total_balance: 0, total_invoices: 0 },
    by_doctor: data.by_doctor || [],
    by_patient: data.by_patient || [],
    invoices: data.invoices || [],
    doctors: data.doctors || [],
    patients: data.patients || [],
  };
}

/** Full invoice (header + line items with their id references) for editing. */
export async function getInvoiceDetail(userId: string, invoiceId: string): Promise<InvoiceDetail> {
  const data = await post<{ invoice: InvoiceDetail }>('business-get-invoice-detail', {
    user_id: userId,
    invoice_id: invoiceId,
  });
  return data.invoice;
}

/** Update an existing invoice's header fields and replace its line items. */
export async function updateInvoice(params: {
  userId: string;
  invoiceId: string;
  doctorId: string;
  clinicId?: string | null;
  invoiceDate: string;
  taxAmount?: number;
  discountAmount?: number;
  status?: string;
  notes?: string | null;
  items: InvoiceLineItemInput[];
}): Promise<{ invoice: CreatedInvoice }> {
  const data = await post<{ invoice: CreatedInvoice }>('business-update-invoice', {
    user_id: params.userId,
    invoice_id: params.invoiceId,
    doctor_id: params.doctorId,
    clinic_id: params.clinicId ?? null,
    invoice_date: params.invoiceDate,
    tax_amount: params.taxAmount ?? 0,
    discount_amount: params.discountAmount ?? 0,
    status: params.status ?? 'draft',
    notes: params.notes ?? null,
    items: params.items,
  });
  return { invoice: data.invoice };
}

/** Delete an invoice and all of its line items and payments. */
export async function deleteInvoice(userId: string, invoiceId: string): Promise<void> {
  await post('business-delete-invoice', { user_id: userId, invoice_id: invoiceId });
}

/** Delete a single payment; the parent invoice's totals are recomputed by a trigger. */
export async function deletePayment(userId: string, paymentId: string): Promise<void> {
  await post('business-delete-payment', { user_id: userId, payment_id: paymentId });
}

// ---- Date / time helpers (shared by the reception screens) -----------------

/** Local YYYY-MM-DD for a Date (avoids UTC off-by-one from toISOString). */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** "HH:MM" 24h -> "h:MM AM/PM". */
export function formatTime12(time: string): string {
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m || '00'} ${ampm}`;
}
