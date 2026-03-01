-- ============================================================
-- Phase 1: profiles 테이블에 role 컬럼 추가 및 RLS 정책 적용
-- ============================================================

-- 1. profiles 테이블에 role 컬럼 추가
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- ============================================================
-- 2. products 테이블 RLS 정책 (관리자 전체 권한)
-- ============================================================

DROP POLICY IF EXISTS "Admin Full Access on products" ON products;

CREATE POLICY "Admin Full Access on products"
  ON products
  FOR ALL
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================
-- 3. profiles 테이블 RLS 정책 (관리자 전체 프로필 조회)
-- ============================================================

DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;

CREATE POLICY "Admin can view all profiles"
  ON profiles
  FOR SELECT
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================
-- 4. addresses 테이블 RLS 정책 (관리자 전체 조회)
-- ============================================================

DROP POLICY IF EXISTS "Admin can view all addresses" ON addresses;

CREATE POLICY "Admin can view all addresses"
  ON addresses
  FOR SELECT
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
