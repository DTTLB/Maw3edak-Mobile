/*
  # Add WhatsApp chat permission column to doctors table

  1. Changes
    - Add `allow_whatsapp_chat` boolean column to `doctors` table
    - Default value is `true` to maintain backward compatibility
    - This column controls whether WhatsApp chat button is displayed for the doctor

  2. Notes
    - Existing doctors will have WhatsApp enabled by default
    - Combined with `whatsapp_number` field to determine button visibility
*/

-- Add allow_whatsapp_chat column to doctors table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctors' AND column_name = 'allow_whatsapp_chat'
  ) THEN
    ALTER TABLE doctors ADD COLUMN allow_whatsapp_chat boolean DEFAULT true;
  END IF;
END $$;