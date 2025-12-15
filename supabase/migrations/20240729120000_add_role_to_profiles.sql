-- Add a 'role' column to the 'profiles' table with a default value of 'USER'
ALTER TABLE public.profiles
ADD COLUMN role text NOT NULL DEFAULT 'USER';

-- Add a comment to the new column for clarity
COMMENT ON COLUMN public.profiles.role IS 'User role for access control (e.g., USER, ADMIN)';

-- Optional: You can set a specific user to be an admin after this migration.
-- For example, to make the user with a specific email an admin:
-- UPDATE public.profiles
-- SET role = 'ADMIN'
-- WHERE email = 'youremail@example.com';
