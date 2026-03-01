-- 주문 테이블에 입금자명 컬럼 추가
ALTER TABLE orders ADD COLUMN IF NOT EXISTS depositor_name TEXT;
