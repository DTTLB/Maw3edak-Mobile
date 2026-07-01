/*
  # Enable RLS for app_help_content table

  1. Security
    - Enable RLS on `app_help_content` table
    - Add policy for anyone to read help content (public information)
    - This content is informational and safe to be publicly accessible
*/

ALTER TABLE app_help_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read help content"
  ON app_help_content
  FOR SELECT
  TO public
  USING (true);