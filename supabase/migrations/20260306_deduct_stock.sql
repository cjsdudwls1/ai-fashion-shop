-- supabase/migrations/20260306_deduct_stock.sql
CREATE OR REPLACE FUNCTION deduct_stock(
  p_items jsonb  -- [{ "product_id": "...", "color": "...", "size": "...", "quantity": 1 }, ...]
)
RETURNS jsonb  -- { "success": true } 또는 { "success": false, "error": "..." }
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item jsonb;
  v_colors jsonb;
  v_sizes jsonb;
  v_idx int;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- FOR UPDATE로 행 잠금 (Pessimistic Locking)
    SELECT colors, sizes INTO v_colors, v_sizes
    FROM products
    WHERE id = (item->>'product_id')::uuid
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION '상품을 찾을 수 없습니다: %', item->>'product_id';
    END IF;

    -- 색상 재고 차감
    IF item->>'color' IS NOT NULL THEN
      -- jsonb 배열에서 해당 색상 인덱스 찾기
      SELECT idx INTO v_idx FROM (
        SELECT ordinality - 1 AS idx
        FROM jsonb_array_elements(v_colors) WITH ORDINALITY AS elem
        WHERE elem.value->>'color' = item->>'color'
      ) sub LIMIT 1;

      IF v_idx IS NOT NULL THEN
        v_colors = jsonb_set(
          v_colors,
          ARRAY[v_idx::text, 'quantity'],
          to_jsonb(GREATEST(0, (v_colors->v_idx->>'quantity')::int - (item->>'quantity')::int))
        );
      END IF;
    END IF;

    -- 사이즈 재고 차감 (동일 패턴)
    IF item->>'size' IS NOT NULL THEN
      SELECT idx INTO v_idx FROM (
        SELECT ordinality - 1 AS idx
        FROM jsonb_array_elements(v_sizes) WITH ORDINALITY AS elem
        WHERE elem.value->>'size' = item->>'size'
      ) sub LIMIT 1;

      IF v_idx IS NOT NULL THEN
        v_sizes = jsonb_set(
          v_sizes,
          ARRAY[v_idx::text, 'quantity'],
          to_jsonb(GREATEST(0, (v_sizes->v_idx->>'quantity')::int - (item->>'quantity')::int))
        );
      END IF;
    END IF;

    -- 업데이트 실행
    UPDATE products
    SET colors = v_colors, sizes = v_sizes
    WHERE id = (item->>'product_id')::uuid;
  END LOOP;

  RETURN '{"success": true}'::jsonb;

EXCEPTION
  WHEN OTHERS THEN
    -- 예외 발생 시 전체 트랜잭션 자동 롤백
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
