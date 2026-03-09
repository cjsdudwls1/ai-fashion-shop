/**
 * 프로젝트 공통 상수 모음
 * 카테고리, 색상, 사이즈 등 여러 컴포넌트에서 공유하는 상수를 정의합니다.
 */

// 통합 카테고리 정의 (한글 + 영문)
// UI 표시용 한글과 AI 프롬프트용 영문을 한 곳에서 관리한다.
export const CATEGORIES: Record<string, { ko: string; en?: string }> = {
    'all': { ko: '전체' },  // UI 필터 전용 (en 없음)
    'short-sleeve': { ko: '반팔', en: 'short-sleeve T-shirt' },
    'long-sleeve': { ko: '긴팔', en: 'long-sleeve T-shirt' },
    'sleeveless': { ko: '민소매', en: 'sleeveless top' },
    'shirt': { ko: '셔츠', en: 'shirt' },
    'blouse': { ko: '블라우스', en: 'blouse' },
    'knit': { ko: '니트', en: 'knit top' },
    'sweater': { ko: '스웨터', en: 'sweater' },
    'hoodie': { ko: '후드', en: 'hoodie' },
    'sweatshirt': { ko: '맨투맨', en: 'sweatshirt' },
    'pants': { ko: '긴바지', en: 'pants' },
    'shorts': { ko: '반바지', en: 'shorts' },
    'skirt': { ko: '치마', en: 'skirt' },
    'denim': { ko: '데님', en: 'denim' },
    'jeans': { ko: '청바지', en: 'jeans' },
    'slacks': { ko: '슬랙스', en: 'slacks' },
    'jacket': { ko: '재킷', en: 'jacket' },
    'jumper': { ko: '점퍼', en: 'jumper' },
    'coat': { ko: '코트', en: 'coat' },
    'padding': { ko: '패딩', en: 'padded jacket' },
    'cardigan': { ko: '가디건', en: 'cardigan' },
    'onepiece': { ko: '원피스', en: 'one-piece dress' },
    'set': { ko: '세트', en: 'coordinated set' },
    'twopiece': { ko: '투피스', en: 'two-piece set' },
    'underwear': { ko: '속옷', en: 'underwear' },
    'innerwear': { ko: '언더웨어', en: 'innerwear' },
    'hat': { ko: '모자', en: 'hat' },
    'scarf': { ko: '스카프', en: 'scarf' },
    'belt': { ko: '벨트', en: 'belt' },
    // 주얼리 (Jewelry) — AI 프롬프트에서 비의류(non-clothing)로 분기됨
    'necklace': { ko: '목걸이', en: 'necklace' },
    'bracelet': { ko: '팔찌', en: 'bracelet' },
    'ring': { ko: '반지', en: 'ring' },
    'earring': { ko: '귀걸이', en: 'earring' },
    'watch': { ko: '시계', en: 'watch' },
    // 액세서리 (Accessories) — AI 프롬프트에서 비의류(non-clothing)로 분기됨
    'bag': { ko: '가방', en: 'bag' },
    'sunglasses': { ko: '선글라스', en: 'sunglasses' },
    'accessory': { ko: '액세서리(기타)', en: 'accessory' },
    'etc': { ko: '기타', en: 'fashion item' },
};

// 관리자 폼용 카테고리 그룹 정의
export const CATEGORY_GROUPS: { label: string; keys: string[] }[] = [
    { label: '상의 (Tops)', keys: ['short-sleeve', 'long-sleeve', 'sleeveless', 'shirt', 'blouse', 'knit', 'sweater', 'hoodie', 'sweatshirt'] },
    { label: '하의 (Bottoms)', keys: ['pants', 'shorts', 'skirt', 'denim', 'jeans', 'slacks'] },
    { label: '아우터 (Outerwear)', keys: ['jacket', 'jumper', 'coat', 'padding', 'cardigan'] },
    { label: '기타 의류 (Others)', keys: ['onepiece', 'set', 'twopiece', 'underwear', 'innerwear', 'hat', 'scarf', 'belt'] },
    { label: '주얼리 (Jewelry)', keys: ['necklace', 'bracelet', 'ring', 'earring', 'watch'] },
    { label: '액세서리 (Accessories)', keys: ['bag', 'sunglasses', 'accessory', 'etc'] },
];

// UI 표시용 한글 매핑 (하위 호환)
export const CATEGORY_MAP: Record<string, string> = Object.fromEntries(
    Object.entries(CATEGORIES).map(([k, v]) => [k, v.ko])
);

// AI 프롬프트용 영문 매핑
export function getCategoryEnglish(key: string): string {
    return CATEGORIES[key]?.en || 'fashion item';
}

// [2026-03-05] 비의류 카테고리 판별 유틸리티
// 사유: 주얼리/액세서리는 "garment(의복)" 프롬프트가 부적합하므로,
// AI 프롬프트에서 의류/비의류를 분기 처리하기 위한 유틸리티.
// hat/scarf/belt는 보완 검토 결과 "착용(wearing)" 표현이 자연스러운 아이템이므로 의류형으로 분류.
// 근거: .docs/jewelry-category-unsupported-analysis.md 해결책 B-1
const NON_CLOTHING_CATEGORIES = new Set([
    'necklace', 'bracelet', 'ring', 'earring', 'watch',
    'bag', 'sunglasses',
    'accessory', 'etc'
]);

export function isClothingCategory(key: string): boolean {
    return !NON_CLOTHING_CATEGORIES.has(key);
}

// 사전 정의된 색상 목록
export const COMMON_COLORS = [
    { name: '블랙', hex: '#000000', text: '#fff' },
    { name: '화이트', hex: '#ffffff', text: '#000', border: true },
    { name: '네이비', hex: '#1a237e', text: '#fff' },
    { name: '차콜', hex: '#37474f', text: '#fff' },
    { name: '그레이', hex: '#9e9e9e', text: '#000' },
    { name: '베이지', hex: '#f5f5dc', text: '#000', border: true },
    { name: '아이보리', hex: '#fffff0', text: '#000', border: true },
    { name: '브라운', hex: '#795548', text: '#fff' },
    { name: '레드', hex: '#d32f2f', text: '#fff' },
    { name: '블루', hex: '#2196f3', text: '#fff' },
    { name: '그린', hex: '#4caf50', text: '#fff' },
    { name: '옐로우', hex: '#ffeb3b', text: '#000' },
    { name: '핑크', hex: '#f48fb1', text: '#fff' },
    { name: '퍼플', hex: '#9c27b0', text: '#fff' },
] as const;

// 사전 정의된 사이즈 목록
export const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'FREE'] as const;

// 재고 관리 드롭다운용 파생 상수
export const INVENTORY_COLOR_OPTIONS = COMMON_COLORS.map(c => c.name);
export const INVENTORY_SIZE_OPTIONS = [...COMMON_SIZES] as string[];
