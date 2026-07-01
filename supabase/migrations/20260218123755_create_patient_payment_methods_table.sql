/*
  # Create patient_payment_methods table

  ## Summary
  Creates a table for storing patient saved payment cards with full RLS security.

  ## New Tables
  - `patient_payment_methods`
    - `id` (uuid, primary key)
    - `patient_id` (uuid, foreign key to user_patients.id)
    - `brand` (text) - Card brand: Visa, Mastercard, American Express, Other
    - `last4` (text) - Last 4 digits of card number
    - `holder_name` (text) - Name on the card
    - `expiry` (text) - Expiry date in MM/YY format
    - `is_default` (boolean) - Whether this is the default payment method
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Patients can only SELECT, INSERT, UPDATE, DELETE their own cards
  - No public access
*/

CREATE TABLE IF NOT EXISTS patient_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES user_patients(id) ON DELETE CASCADE,
  brand text NOT NULL DEFAULT 'Other',
  last4 text NOT NULL,
  holder_name text NOT NULL DEFAULT '',
  expiry text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_payment_methods_patient_id
  ON patient_payment_methods(patient_id);

ALTER TABLE patient_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own payment methods"
  ON patient_payment_methods FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM user_patients WHERE id = patient_id
    )
  );

CREATE POLICY "Patients can insert own payment methods"
  ON patient_payment_methods FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (
      SELECT id FROM user_patients WHERE id = patient_id
    )
  );

CREATE POLICY "Patients can update own payment methods"
  ON patient_payment_methods FOR UPDATE
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM user_patients WHERE id = patient_id
    )
  )
  WITH CHECK (
    patient_id IN (
      SELECT id FROM user_patients WHERE id = patient_id
    )
  );

CREATE POLICY "Patients can delete own payment methods"
  ON patient_payment_methods FOR DELETE
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM user_patients WHERE id = patient_id
    )
  );

CREATE POLICY "Service role has full access to payment methods"
  ON patient_payment_methods FOR SELECT
  TO service_role
  USING (true);
