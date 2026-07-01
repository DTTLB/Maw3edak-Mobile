/*
  # Enable RLS for doctor_notifications table

  1. Security
    - Enable RLS on `doctor_notifications` table
    - Add policy for service role to insert notifications
    - Add policy for service role to select notifications (for API access)
    - Add policy for service role to update notifications (for marking as read)
    
  2. Notes
    - Service role policies allow the backend API to manage notifications
    - Frontend will authenticate and filter through API endpoints
    - RLS ensures table is locked down by default
*/

-- Enable RLS on doctor_notifications table
ALTER TABLE doctor_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can insert notifications
CREATE POLICY "Service role can insert notifications"
  ON doctor_notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Service role can select notifications
CREATE POLICY "Service role can select notifications"
  ON doctor_notifications
  FOR SELECT
  TO service_role
  USING (true);

-- Policy: Service role can update notifications
CREATE POLICY "Service role can update notifications"
  ON doctor_notifications
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Service role can delete notifications
CREATE POLICY "Service role can delete notifications"
  ON doctor_notifications
  FOR DELETE
  TO service_role
  USING (true);
