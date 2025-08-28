
-- Create students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nis TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    "class" TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- "Pemasukan" or "Pengeluaran"
    amount BIGINT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
-- These policies allow anyone to read/write data. 
-- For production, you should implement proper authentication and authorization.
-- Example: restrict access to authenticated users only.

-- Policy for students table
CREATE POLICY "Allow public read access to students" ON students FOR SELECT USING (true);
CREATE POLICY "Allow public write access to students" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to students" ON students FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access to students" ON students FOR DELETE USING (true);

-- Policy for transactions table
CREATE POLICY "Allow public read access to transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow public write access to transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to transactions" ON transactions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access to transactions" ON transactions FOR DELETE USING (true);

-- Create Indexes for performance
CREATE INDEX idx_students_nis ON students(nis);
CREATE INDEX idx_transactions_student_id ON transactions(student_id);
