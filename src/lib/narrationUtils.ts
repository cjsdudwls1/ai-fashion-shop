import { Gender } from './types';

export function getNarrationOptions(
    productInfo: { name: string; fabric: string; gender: Gender; category?: string }
): string[] {
    const genderText = productInfo.gender === 'female' ? '여성' : (productInfo.gender === 'male' ? '남성' : '남녀공용');
    const CATEGORY_MAP: Record<string, string> = {
        'short-sleeve': '반팔 티셔츠',
        'long-sleeve': '긴팔 티셔츠',
        'sleeveless': '민소매',
        'shirt': '셔츠',
        'knit': '니트',
        'hoodie': '후드',
        'pants': '팬츠',
        'shorts': '쇼츠',
        'skirt': '스커트',
        'denim': '데님',
        'slacks': '슬랙스',
        'jacket': '자켓',
        'coat': '코트',
        'padding': '패딩',
        'cardigan': '가디건',
        'onepiece': '원피스',
        'set': '세트',
        'underwear': '언더웨어',
        'etc': '아이템'
    };

    const categoryText = (productInfo.category && CATEGORY_MAP[productInfo.category]) || '아이템';

    // 짧고 세련된 5초 분량의 나레이션 (약 40~60자)
    return [
        `${productInfo.name}. ${productInfo.fabric} 소재의 프리미엄 ${genderText} ${categoryText}입니다.`,
        `${productInfo.fabric} 소재로 완성한 ${productInfo.name}. 세련된 ${genderText} ${categoryText} 룩을 만나보세요.`,
        `프리미엄 ${productInfo.fabric} 소재, ${productInfo.name}. ${genderText}을 위한 특별한 ${categoryText}.`,
    ];
}
