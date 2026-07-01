import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_INSTRUCTION = `You are a safe healthcare assistant for patients using Maw3edak. You can explain general health information, medication labels, visible prescription text, appointment preparation, and questions to ask a doctor. You must not diagnose, prescribe medication, change dosages, or replace a doctor/pharmacist. If the user describes emergency symptoms such as chest pain, severe breathing difficulty, stroke symptoms, severe allergic reaction, severe bleeding, fainting, or suicidal thoughts, advise them to seek emergency medical care immediately. For medicine or prescription images, identify only visible text and provide general information. If the image is unclear, say you cannot identify it confidently. Always tell the user to confirm with a doctor or pharmacist.`;

// In-app help. When a user asks how to do something in the app, answer with
// short numbered steps using these EXACT screen/button names. Only describe
// features listed here; if unsure, say so and point them to the Settings screen
// rather than inventing menu names.
const APP_GUIDE = `You are also the built-in help guide for the Maw3edak patient mobile app. When the user asks how to do something in the app, or where to find a screen, reply with short numbered steps using the EXACT button and screen names listed below. Keep it brief. Only describe features listed here — if you are not sure the app has a feature, say so and suggest the user check the Settings screen or the Help guide, instead of inventing a menu name.

== APP LAYOUT ==
The app has a bottom navigation bar with 4 tabs: "Home", "Appointments", "AI", "Scan".
- The "Home" tab is the dashboard. Its top-right has a notification bell (your notifications) and a menu (☰) icon that opens the Settings screen.
- The Home screen has a "Next Appointment" card, a "Book an Appointment" button, and a "Healthcare Services" grid of cards: "Orders" (Lab Tests), "Medications" (Prescriptions), "Packages" (Beauty & Spa Services), "Finance" (Statement & Invoices), "Visits" (Visit History), "Find Doctors" (Search Specialists), and "Responses" (Doctor Questions). It may also show "Dental", "Vision", and "Nutrition" cards if you have records with those specialists.

== APPOINTMENTS ==
- Book an appointment: "Home" → "Book an Appointment" → Step 1 pick the doctor → Step 2 pick the clinic → Step 3 pick the date & time slot → confirm.
- See your next / upcoming appointment: "Home" → look at the "Next Appointment" card; or open the "Appointments" tab for the full list. (If you are signed in, you can also just ask me "what is my next appointment?".)
- View / filter all appointments: open the "Appointments" tab → use the filter button to filter by doctor, date, or status (Scheduled, Confirmed, Pending, Cancelled, Completed). Tap an appointment to see its details.

== MEDICATIONS & PRESCRIPTIONS ==
- View prescriptions: "Home" → "Medications" card. Prescriptions are grouped by doctor; you can filter by doctor and date.
- Set or edit medication reminder times: open a prescription → tap the edit (pencil) icon on a medicine → set the start/end dates and add reminder times → save. You can pause/resume or delete a reminder there too.
- Mark today's doses as taken: open the today's medications view → tap "Taken" or "Skip" for each dose.

== LAB ORDERS ==
- Check your lab orders / tests: "Home" → "Orders" card. Orders are grouped by doctor; tap one to see the order type, doctor notes, and any attached files you can download. Filter by doctor or date.

== DOCTORS ==
- Find a doctor: "Home" → "Find Doctors" card → search by name or specialization. Tap a doctor to see their clinics and to call them or message them on WhatsApp.
- See doctors' answers to your questions: "Home" → "Responses" card.

== MEDICAL RECORDS & SPECIALTIES ==
- View dental / vision / nutrition records: "Home" → tap the "Dental", "Vision", or "Nutrition" card (shown when you have those records).
- Your medical history (such as allergies, surgeries, and chronic conditions) is part of your profile's medical information.

== VISITS, PACKAGES & FINANCE ==
- View past visits: "Home" → "Visits" card → visits are grouped by doctor; tap one for full details.
- View your packages: "Home" → "Packages" card → tap a package to see its services, remaining sessions, and usage history.
- View invoices and statement: "Home" → "Finance" card.

== PROFILE ==
- Edit your profile / personal info: "Home" → tap the menu (☰) icon → Settings → "Personal Information"; or tap your profile photo on the Home screen. You can edit your name, email, phone, date of birth, gender, blood type, address, and profile photo, then save.

== SETTINGS (open with the menu ☰ icon on Home) ==
- Change your password: Settings → "Change Password" → enter your current password and a new password → save.
- Turn dark mode on/off: Settings → toggle "Dark Mode".
- Change the app language: Settings → "Language" → choose English, العربية (Arabic), or Français.
- Turn notifications on/off: Settings → toggle the notifications option.
- Enable fingerprint / Face ID login: Settings → toggle "Biometric Login" (only if your device supports it).
- Set up two-factor authentication (2FA): Settings → enable "Two-Factor Authentication" → scan the QR code with an authenticator app (e.g. Google Authenticator) → enter the 6-digit code to confirm.
- Link a clinic / care provider by QR: Settings → "Care Providers" → "Link Provider", or tap the "Scan" tab → scan the provider's QR code.
- Log out: Settings → scroll to the bottom → "Log Out".

== AI ASSISTANT (this screen) ==
- Ask a question: type it in the message box and send.
- Attach a photo or file: tap the + button next to the message box → "Add photos & files" (you can attach a PDF or an image such as a prescription or medicine box).
- Scan medicine / a document: use the camera icon next to the message box, or attach a photo.

== ACCOUNT & SIGN-IN (before logging in) ==
- Create an account: on the login screen tap the sign-up / create-account link → fill in your name, email, password, date of birth, gender, blood type, mobile number, and country → accept the terms → complete the captcha → register.
- Forgot your password: on the login screen tap "Forgot password?" → enter your Medical ID → complete the captcha → enter the 6-digit code sent to you → set a new password.`;

interface AppointmentRow {
  appointment_date: string | null;
  appointment_time: string | null;
  status: string | null;
  doctors: { first_name: string | null; last_name: string | null } | null;
  clinics: { name: string | null } | null;
}

// Looks up the logged-in patient and their upcoming appointments, returning a
// text block to inject into the system prompt so the AI can answer personal
// questions ("what is my next appointment?"). Returns "" on any failure so the
// assistant still works without personalization.
async function buildPatientContext(userId: string): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return "";

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: patient } = await supabase
      .from("user_patients")
      .select("medical_id, first_name, last_name")
      .eq("is_deleted", false)
      .eq("id", userId)
      .maybeSingle();

    if (!patient || !patient.medical_id) return "";

    const fullName = [patient.first_name, patient.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    const today = new Date().toISOString().split("T")[0];
    const { data: appointments } = await supabase
      .from("appointments")
      .select(
        `appointment_date, appointment_time, status,
         doctors:doctor_id ( first_name, last_name ),
         clinics:clinic_id ( name ),
         patients:patient_id!inner ( medical_id )`,
      )
      .eq("patients.medical_id", patient.medical_id)
      .gte("appointment_date", today)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true })
      .limit(5);

    const lines = ((appointments as AppointmentRow[] | null) || []).map((a) => {
      const doctor = a.doctors
        ? `Dr. ${[a.doctors.first_name, a.doctors.last_name].filter(Boolean).join(" ")}`
        : "the doctor";
      const clinic = a.clinics?.name ? ` at ${a.clinics.name}` : "";
      const time = a.appointment_time ? ` at ${a.appointment_time.slice(0, 5)}` : "";
      const status = a.status ? ` (${a.status})` : "";
      return `- ${a.appointment_date}${time} with ${doctor}${clinic}${status}`;
    });

    const appointmentsBlock = lines.length
      ? lines.join("\n")
      : "- No upcoming appointments found.";

    return `\n\nLOGGED-IN PATIENT CONTEXT — use this to answer personal questions such as "what is my next appointment". Today's date is ${today}. Only share THIS patient's own data.
Name: ${fullName || "Unknown"}
Medical ID: ${patient.medical_id}
Upcoming appointments (earliest first):
${appointmentsBlock}`;
  } catch (err) {
    console.error("AI: buildPatientContext failed:", err instanceof Error ? err.message : String(err));
    return "";
  }
}

// image/heic & image/heif are the default formats for photos taken on iOS.
const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

interface Attachment {
  name?: string;
  mimeType?: string;
  size?: number;
  base64?: string;
}

interface RequestBody {
  message?: string;
  imageBase64?: string;
  attachment?: Attachment;
  userId?: string;
  language?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Convenience reply helper — always 2xx so the app never sees a raw error.
const reply = (text: string) => json({ success: true, reply: text });

// Pull the assistant text out of a Responses API payload, with a fallback
// for the raw REST shape (output[].content[].text) when output_text is absent.
function extractOutputText(data: any): string | null {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }
  const output = data?.output;
  if (Array.isArray(output)) {
    const parts: string[] = [];
    for (const item of output) {
      if (Array.isArray(item?.content)) {
        for (const c of item.content) {
          if ((c?.type === "output_text" || c?.type === "text") && typeof c?.text === "string") {
            parts.push(c.text);
          }
        }
      }
    }
    if (parts.length) return parts.join("\n").trim();
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    console.log("AI: hasApiKey:", !!openaiKey);

    if (!openaiKey) {
      console.error("AI: OPENAI_API_KEY not configured");
      return json({ error: "AI service not configured" }, 500);
    }

    const body = (await req.json()) as RequestBody;
    const message = typeof body.message === "string" ? body.message : "";
    const imageBase64 = body.imageBase64;
    const attachment = body.attachment;
    const userId = typeof body.userId === "string" ? body.userId : "";
    const language = typeof body.language === "string" ? body.language : "";

    // Compose the system prompt: medical-safety base + in-app help guide +
    // (when we know who is asking) the patient's own data for personal answers.
    const patientContext = userId ? await buildPatientContext(userId) : "";
    const languageNote = language
      ? `\n\nReply in the same language the user writes in. The app's current language is "${language}" (en=English, ar=Arabic, fr=French) — prefer that if the user's language is unclear.`
      : "";
    const systemInstruction = `${SYSTEM_INSTRUCTION}\n\n${APP_GUIDE}${patientContext}${languageNote}`;

    const hasAttachment = !!attachment;
    console.log("AI: hasAttachment:", hasAttachment);
    if (attachment) {
      console.log("AI: mimeType:", attachment.mimeType || "unknown");
      console.log("AI: fileName:", attachment.name || "unknown");
      console.log("AI: fileSize:", attachment.size ?? 0);
      console.log("AI: hasBase64:", !!attachment.base64);
      console.log("AI: base64Length:", attachment.base64 ? attachment.base64.length : 0);
    }

    if (!message.trim() && !imageBase64 && !attachment) {
      console.error("AI: Empty request");
      return json({ error: "Message is required" }, 400);
    }

    // ---------------------------------------------------------------
    // Attachment flow (new + button: PDF / image / other documents)
    // ---------------------------------------------------------------
    if (attachment) {
      const mimeType = attachment.mimeType || "application/octet-stream";

      if (!attachment.base64) {
        return reply(
          "I received the file name, but the file content was not sent. Please attach it again.",
        );
      }

      const isPdf = mimeType === "application/pdf";
      const isSupportedImage = SUPPORTED_IMAGE_TYPES.includes(mimeType);

      if (!isPdf && !isSupportedImage) {
        return reply(
          "I received the file, but I can only analyze supported medical images or readable prescription PDFs right now.",
        );
      }

      const userContent = isPdf
        ? [
            {
              type: "input_text",
              text: message || "Please explain this PDF safely for a patient.",
            },
            {
              type: "input_file",
              filename: attachment.name || "document.pdf",
              file_data: "data:application/pdf;base64," + attachment.base64,
            },
          ]
        : [
            {
              type: "input_text",
              text: message || "Please explain what is visible in this image safely for a patient.",
            },
            {
              type: "input_image",
              image_url: "data:" + mimeType + ";base64," + attachment.base64,
            },
          ];

      try {
        console.log("AI: OpenAI request started (responses, attachment)");
        const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4.1-mini",
            input: [
              {
                role: "system",
                content: [{ type: "input_text", text: systemInstruction }],
              },
              {
                role: "user",
                content: userContent,
              },
            ],
          }),
        });

        if (!openaiResponse.ok) {
          const errorText = await openaiResponse.text();
          console.error("AI: OpenAI request failed", openaiResponse.status);
          console.error("AI: OpenAI error message:", errorText.substring(0, 300));
          return reply(
            "Sorry, I couldn’t read this file right now. Please upload a clear image or PDF.",
          );
        }

        const openaiData = await openaiResponse.json();
        const text = extractOutputText(openaiData);
        console.log("AI: OpenAI request succeeded (attachment)");

        if (!text) {
          return reply(
            "Sorry, I couldn’t read this file right now. Please upload a clear image or PDF.",
          );
        }
        return reply(text);
      } catch (err) {
        console.error(
          "AI: OpenAI request failed (attachment):",
          err instanceof Error ? err.message : String(err),
        );
        return reply(
          "Sorry, I couldn’t read this file right now. Please upload a clear image or PDF.",
        );
      }
    }

    // ---------------------------------------------------------------
    // Text / camera-image flow (unchanged behavior)
    // ---------------------------------------------------------------
    const contentArray: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: "text", text: message },
    ];

    if (imageBase64) {
      contentArray.push({
        type: "image_url",
        image_url: { url: imageBase64 },
      });
    }

    console.log("AI: OpenAI request started (chat)");

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: contentArray },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error("AI: OpenAI request failed", openaiResponse.status);
      console.error("AI: OpenAI error message:", errorData.substring(0, 300));
      return json({ error: "Failed to get AI response" }, 500);
    }

    const openaiData = await openaiResponse.json();
    const aiReply =
      openaiData.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response. Please try again.";

    console.log("AI: OpenAI request succeeded (chat)");

    return reply(aiReply);
  } catch (error) {
    console.error(
      "AI: Error:",
      error instanceof Error ? error.message : String(error),
    );
    return json({ error: "Internal server error" }, 500);
  }
});
