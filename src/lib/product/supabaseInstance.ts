/**
 * 공유 Supabase 클라이언트 인스턴스
 * lib/product/ 하위 모듈들이 공유하는 인스턴스.
 * 기존 productStore.ts에서 사용하던 것과 동일한 설정.
 */
import { createBrowserClient } from '../supabase/client';

export const supabase = createBrowserClient();
