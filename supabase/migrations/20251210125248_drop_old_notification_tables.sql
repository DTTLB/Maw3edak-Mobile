/*
  # Drop Old Notification Tables

  1. Changes
    - Drops the old `notifications` table (if it exists)
    - Drops the old `notification_reads` table (if it exists)
    - These tables are no longer used - all notifications now go through `patient_notifications`

  2. Security
    - Safe to drop as all edge functions now read from `patient_notifications` only
*/

-- Drop old notifications table if it exists
DROP TABLE IF EXISTS notifications CASCADE;

-- Drop old notification_reads table if it exists  
DROP TABLE IF EXISTS notification_reads CASCADE;
