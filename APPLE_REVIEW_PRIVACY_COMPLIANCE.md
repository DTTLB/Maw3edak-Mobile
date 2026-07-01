# Maw3edak — App Store Connect Privacy Label Guidance

This document maps the **actual data the app collects** (verified against the code and
Supabase backend) to Apple's App Privacy questionnaire. It covers the **whole app**,
including both the **Doctor** and **Patient** flows.

> Source of truth: app source (`app/`, `components/`, `utils/`) and Supabase edge
> functions / tables. No analytics, ads, attribution, or crash-reporting SDKs are
> present in the project. The only third-party SDK that transmits data off-device is
> **Firebase Cloud Messaging** (push delivery).

---

## 1. Data collection summary

| Data type | Doctor flow | Patient flow | Purpose | Linked to user | Shared w/ third parties | Used for tracking | Notes |
|---|---|---|---|---|---|---|---|
| Name | Yes | Yes | App functionality (account, appointments) | Yes | No | No | `users.full_name`, `user_patients.first_name/last_name` |
| Email address | Yes | Yes | App functionality, account auth | Yes | No | No | `users.email`, `user_patients.email` |
| Phone number | Yes | Yes | App functionality, account auth, contact | Yes | No | No | `users.mobile`, `user_patients.phone` |
| Physical address | No | Yes | App functionality (patient profile) | Yes | No | No | `user_patients.address` (optional) |
| Health & medical info | Yes | Yes | App functionality (appointments, prescriptions, encounters, dental/eye/nutrition records, patient notes) | Yes | No | No | Core purpose. Doctor accesses patient health data for care/clinic management |
| Sensitive info (medical documents) | Yes | Yes | App functionality (uploaded medical/verification documents) | Yes | No | No | Stored in Supabase storage |
| Photos / user content | Yes | Yes | App functionality (profile photo, uploaded images/documents) | Yes | No | No | `patient-profiles` storage bucket; AI/upload screens |
| Payment / financial info | Yes | Yes | App functionality (invoices, billing, payment status) | Yes | No | No | `invoice_headers`, `invoice_payments`, `patient_payment_methods`. **No card processing SDK** — no raw card data captured in-app |
| User ID | Yes | Yes | App functionality (identity) | Yes | No | No | `medical_id`, `global_id`, internal UUIDs |
| Device ID / Push token | Yes | Yes | App functionality (push notifications) | Yes | **Yes (Firebase/Google)** | No | FCM token in `device_tokens`; sent to Google FCM to deliver notifications |
| Coarse/precise location | No | No | — | — | — | — | **Not collected.** No location APIs used |
| Contacts | No | No | — | — | — | — | **Not collected** |
| Browsing / search history | No | No | — | — | — | — | **Not collected** |
| Usage data / analytics | No | No | — | — | — | — | **Not collected.** No analytics SDK |
| Diagnostics / crash logs | No | No | — | — | — | — | **Not collected off-device.** Errors go to local `console` only; no Crashlytics/Sentry |
| Advertising data / IDFA | No | No | — | — | — | — | **Not collected.** No ads, no App Tracking Transparency needed |

---

## 2. What to declare in App Store Connect

Answer **"Yes, we collect data"**, then select the following data types. For every type
below: **Linked to the user = Yes**, **Used for tracking = No**.

### Contact Info
- **Name** — App Functionality
- **Email Address** — App Functionality
- **Phone Number** — App Functionality
- **Physical Address** — App Functionality *(patient only; still declare at app level)*

### Health & Fitness
- **Health** — App Functionality
  *(appointments, prescriptions, encounters, medical documents, clinical notes — the
  core purpose of the app)*

### User Content
- **Photos or Videos** — App Functionality *(profile photos, uploaded images)*
- **Other User Content** — App Functionality *(uploaded documents / medical files)*

### Financial Info
- **Payment Info / Other Financial Info** — App Functionality
  *(invoices, balances, payment status; note: no card numbers captured in-app)*

### Identifiers
- **User ID** — App Functionality
- **Device ID** — App Functionality *(push notification token, shared with Firebase/Google for delivery)*

> Mark **Device ID** as **shared with a third party (Firebase Cloud Messaging / Google)**
> for the purpose of **App Functionality** (delivering push notifications).

### NOT selected (do not declare)
Location, Contacts, Browsing History, Search History, Usage Data, Diagnostics,
Advertising Data, Sensitive Info beyond health documents already covered.

---

## 3. Permission ≠ privacy label (clarifications for the reviewer)

- **Camera** permission is requested **only** when the user chooses to take a photo/document.
  The *resulting* photo/document is what is declared (User Content) — the camera permission
  itself is not a data type.
- **Photo Library** permission is requested **only** when the user chooses to upload an
  existing photo/document. The uploaded file is declared (User Content).
- **Face ID** uses Apple **local authentication only** (`expo-local-authentication`). No
  facial/biometric data is ever received, stored, or transmitted by the app — therefore it
  is **not** declared as collected data.
- **Notifications** permission itself is not a data type, **but** the resulting **push token**
  is stored and sent to Firebase/Google, so it is declared under **Device ID / Identifiers**.

---

## 4. Third-party SDKs

| SDK | Data it touches | Off-device? | Notes |
|---|---|---|---|
| Firebase Cloud Messaging (`@react-native-firebase/messaging`) | Push token, Firebase installation ID | Yes — to Google | Used solely to deliver push notifications |
| Firebase App (`@react-native-firebase/app`) | Firebase init only | Minimal | No Analytics/Crashlytics modules installed |
| Supabase (`@supabase/supabase-js`) | All app data (first-party backend) | Yes — to our own backend | This is the app's own backend, not a third-party data broker |

No analytics (Segment/Amplitude/GA), no crash reporting (Sentry/Crashlytics), no ads, no
maps SDK, no payment SDK (Stripe/etc.) are present.

---

## 5. Account deletion (Guideline 5.1.1(v))

In-app deletion is available to **both** account types at **Settings → Delete Account**
(and from **Help Center → Delete Account**). On confirmation the app calls the
`mobile-delete-account` edge function, which:
- permanently disables login and **anonymizes** personal identity fields,
- deletes the profile photo from storage,
- purges sessions, push (FCM) tokens, and 2FA records,
- retains only appointment / invoice / medical / legal records that may be legally
  required, now de-linked from identifiable personal data.
