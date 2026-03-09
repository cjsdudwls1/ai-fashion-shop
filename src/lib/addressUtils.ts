/**
 * DaumPostcode 주소 파싱 공용 유틸리티
 * profile/page.tsx, checkout 등에서 중복되던 주소 처리 로직을 통합한다.
 */

export interface ParsedAddress {
    zonecode: string;
    fullAddress: string;
}

/**
 * DaumPostcode 결과 데이터를 파싱하여 우편번호와 전체 주소를 반환한다.
 *
 * @param data - DaumPostcode onComplete 콜백의 data 인자
 * @returns { zonecode, fullAddress }
 */
export function parsePostcodeResult(data: {
    address: string;
    addressType: string;
    bname: string;
    buildingName: string;
    zonecode: string;
}): ParsedAddress {
    let fullAddress = data.address;
    let extraAddress = '';

    if (data.addressType === 'R') {
        if (data.bname !== '') extraAddress += data.bname;
        if (data.buildingName !== '') {
            extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName;
        }
        fullAddress += extraAddress !== '' ? ` (${extraAddress})` : '';
    }

    return {
        zonecode: data.zonecode,
        fullAddress,
    };
}
