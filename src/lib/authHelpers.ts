// src/lib/authHelpers.ts
export const nameToEmail = (inputName: string): string => {
    const name = inputName.trim();

    // 이메일 형식이면 그대로 사용
    if (name.includes('@')) {
        return name;
    }

    // UTF-8 바이트 → hex 인코딩
    const encoder = new TextEncoder();
    const bytes = encoder.encode(name);
    let hex = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    
    // 길이 제한 (이메일 로컬파트 64자 이내)
    if (hex.length > 50) {
        // 긴 이름은 해시로 축약
        let h1 = 0x811c9dc5;
        let h2 = 0;
        for (let i = 0; i < name.length; i++) {
            const c = name.charCodeAt(i);
            h1 ^= c;
            h1 = Math.imul(h1, 0x01000193) >>> 0;
            h2 = (h2 * 31 + c) >>> 0;
        }
        hex = `${h1.toString(36)}${h2.toString(36)}${name.length.toString(36)}`;
    }
    return `u_${hex}@aifashion-store.com`;
};