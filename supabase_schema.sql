
-- This is your database schema.
-- Use this to create your tables in the Supabase SQL Editor.
-- See: https://supabase.com/docs/guides/database/tables#creating-tables-with-the-sql-editor

-- Create a custom type for transaction types
create type transaction_type as enum ('Pemasukan', 'Pengeluaran');

-- Create the students table
create table students (
  id uuid default gen_random_uuid() primary key,
  nis text not null unique,
  name text not null,
  class text not null,
  created_at timestamptz default now()
);

-- Create the transactions table
create table transactions (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) on delete cascade not null,
  type transaction_type not null,
  amount numeric not null check (amount > 0),
  description text,
  created_at timestamptz default now()
);

-- Create the activation codes table
create table activation_codes (
  id bigserial primary key,
  code text not null unique,
  created_at timestamptz default now(),
  is_used boolean default false,
  used_by uuid references auth.users(id),
  used_at timestamptz
);


-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security
-- Note: These policies are examples and should be adjusted to your needs.

-- For 'students' table
-- 1. Enable RLS
alter table students enable row level security;
-- 2. Create policies
-- Allow authenticated users to read all student data
create policy "Allow authenticated users to read students" on students for select to authenticated using (true);
-- Allow authenticated users to insert new students
create policy "Allow authenticated users to insert students" on students for insert to authenticated with check (true);
-- Allow authenticated users to update students
create policy "Allow authenticated users to update students" on students for update to authenticated using (true) with check (true);
-- Allow authenticated users to delete students
create policy "Allow authenticated users to delete students" on students for delete to authenticated using (true);


-- For 'transactions' table
-- 1. Enable RLS
alter table transactions enable row level security;
-- 2. Create policies
-- Allow authenticated users to read all transaction data
create policy "Allow authenticated users to read transactions" on transactions for select to authenticated using (true);
-- Allow authenticated users to insert new transactions
create policy "Allow authenticated users to insert transactions" on transactions for insert to authenticated with check (true);
-- Allow authenticated users to update transactions
create policy "Allow authenticated users to update transactions" on transactions for update to authenticated using (true) with check (true);
-- Allow authenticated users to delete transactions
create policy "Allow authenticated users to delete transactions" on transactions for delete to authenticated using (true);

-- For 'activation_codes' table
-- 1. Enable RLS
alter table activation_codes enable row level security;
-- 2. Create policies
-- Allow admin users to manage codes (example: check for an admin role in user metadata)
-- This requires you to set up custom claims/roles in Supabase Auth.
-- create policy "Allow admin to manage codes" on activation_codes
-- for all to authenticated
-- using ( (auth.jwt() ->> 'user_role')::text = 'admin' )
-- with check ( (auth.jwt() ->> 'user_role')::text = 'admin' );

-- For simplicity in this demo, allow any authenticated user to manage.
-- WARNING: In a real production app, you MUST secure this table.
create policy "Allow auth users to manage codes for now" on activation_codes
for all to authenticated
using (true)
with check (true);
