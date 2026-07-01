/*
  # Fix device_tokens platform constraint
  
  1. Changes
    - Remove restrictive CHECK constraint on platform column
    - Allow 'web', 'ios', 'android', and any future platforms
  
  2. Reason
    - Current constraint only allows 'ios' and 'android'
    - This prevents saving tokens when testing on web or other platforms
    - Edge functions fail silently when constraint is violated
*/

-- Drop the existing check constraint
ALTER TABLE device_tokens 
DROP CONSTRAINT IF EXISTS device_tokens_platform_check;

-- Add a more flexible check constraint that allows common platforms
ALTER TABLE device_tokens 
ADD CONSTRAINT device_tokens_platform_check 
CHECK (platform IN ('ios', 'android', 'web'));
