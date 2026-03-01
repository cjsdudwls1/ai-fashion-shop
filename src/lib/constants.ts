/**
 * 프로젝트 공통 상수 모음
 * 카테고리, 색상, 사이즈 등 여러 컴포넌트에서 공유하는 상수를 정의합니다.
 */

// 카테고리 한글 매핑 (영문 키 → 한글 레이블)
export const CATEGORY_MAP: Record<string, string> = {
    'all': '전체',
    'short-sleeve': '반팔',
    'long-sleeve': '긴팔',
    'sleeveless': '민소매',
    'shirt': '셔츠/블라우스',
    'knit': '니트/스웨터',
    'hoodie': '후드/맨투맨',
    'pants': '긴바지',
    'shorts': '반바지',
    'skirt': '치마',
    'denim': '데님/청바지',
    'slacks': '슬랙스',
    'jacket': '재킷/점퍼',
    'coat': '코트',
    'padding': '패딩',
    'cardigan': '가디건',
    'onepiece': '원피스',
    'set': '세트/투피스',
    'underwear': '속옷/언더웨어',
    'etc': '기타/액세서리',
};

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
