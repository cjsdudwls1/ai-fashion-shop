// 텍스트 입력을 색상/사이즈 재고 배열로 파싱하는 유틸리티
// 관리자 페이지에서 입력받은 텍스트를 구조화된 데이터로 변환한다.
// 입력 형식: "색상명:수량" 또는 "사이즈명:수량" (줄바꿈 구분)

import { ColorStock, SizeStock } from './types';

export function parseColorStock(text: string): ColorStock[] {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
        const [color, quantity] = line.split(':').map(s => s.trim());
        return {
            color: color || '',
            quantity: parseInt(quantity) || 0
        };
    }).filter(item => item.color);
}

export function parseSizeStock(text: string): SizeStock[] {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
        const [size, quantity] = line.split(':').map(s => s.trim());
        return {
            size: size || '',
            quantity: parseInt(quantity) || 0
        };
    }).filter(item => item.size);
}
