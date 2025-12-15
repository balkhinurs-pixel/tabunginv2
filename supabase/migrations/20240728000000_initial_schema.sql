
-- Create the students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nis TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    whatsapp_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create the transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    amount NUMERIC(10, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Pemasukan', 'Pengeluaran')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the activation_codes table
CREATE TABLE activation_codes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_used BOOLEAN DEFAULT FALSE,
    used_by UUID REFERENCES auth.users(id),
    used_at TIMESTAMPTZ
);

-- Create profiles table to link with auth.users
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    email TEXT,
    plan TEXT NOT NULL DEFAULT 'TRIAL',
    role TEXT NOT NULL DEFAULT 'USER' -- Add role column
);

-- Function to handle new user sign-ups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (new.id, new.email);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Function to activate a pro account
CREATE OR REPLACE FUNCTION activate_account(p_code TEXT, p_user_id UUID)
RETURNS TABLE (
    id UUID,
    plan TEXT
) AS $$
DECLARE
    v_code_id BIGINT;
BEGIN
    -- Find the code and lock it
    SELECT ac.id INTO v_code_id
    FROM activation_codes ac
    WHERE ac.code = p_code AND NOT ac.is_used
    FOR UPDATE;

    IF v_code_id IS NULL THEN
        RAISE EXCEPTION 'Invalid or already used activation code';
    END IF;

    -- Update the activation code
    UPDATE activation_codes
    SET is_used = TRUE, used_by = p_user_id, used_at = NOW()
    WHERE id = v_code_id;

    -- Update the user's profile
    UPDATE profiles
    SET plan = 'PRO'
    WHERE profiles.id = p_user_id;

    -- Return the updated profile
    RETURN QUERY
    SELECT profiles.id, profiles.plan FROM profiles WHERE profiles.id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS for all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for students
CREATE POLICY "Allow users to manage their own students"
ON students
FOR ALL
USING (auth.uid() = user_id);

-- Policies for transactions
CREATE POLICY "Allow users to manage transactions for their students"
ON transactions
FOR ALL
USING (auth.uid() = user_id);

-- Policies for profiles
CREATE POLICY "Allow users to view their own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id);

-- Policies for activation_codes (for now, admin-only via Supabase Studio)
-- A more robust policy will be added later for admin users.
