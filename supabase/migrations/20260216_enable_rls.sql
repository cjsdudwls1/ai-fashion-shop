-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow public read access (SELECT)
CREATE POLICY "Public Read (SELECT)" 
ON products 
FOR SELECT 
USING (true);

-- Deny all other operations for anonymous/authenticated users (implicit default)
-- Allow Service Role to bypass RLS (implicit default for superuser/service_role)

-- If you want to explicitly allow authenticated admins via UI:
-- CREATE POLICY "Admin Full Access" 
-- ON products 
-- FOR ALL 
-- USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
-- But our current implementation uses Service Role in API Route, so this is optional.
