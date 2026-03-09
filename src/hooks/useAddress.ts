import { useState } from 'react';

export interface AddressState {
    zonecode: string;
    roadAddress: string;
    detailAddress: string;
    openPostcode: boolean;
}

export interface AddressActions {
    setZonecode: (val: string) => void;
    setRoadAddress: (val: string) => void;
    setDetailAddress: (val: string) => void;
    setOpenPostcode: (val: boolean) => void;
    handleCompletePostcode: (data: any) => void;
}

export function useAddress(initialState?: Partial<AddressState>): [AddressState, AddressActions] {
    const [zonecode, setZonecode] = useState(initialState?.zonecode || '');
    const [roadAddress, setRoadAddress] = useState(initialState?.roadAddress || '');
    const [detailAddress, setDetailAddress] = useState(initialState?.detailAddress || '');
    const [openPostcode, setOpenPostcode] = useState(initialState?.openPostcode || false);

    const handleCompletePostcode = (data: any) => {
        let fullAddress = data.address;
        let extraAddress = '';

        if (data.addressType === 'R') {
            if (data.bname !== '') {
                extraAddress += data.bname;
            }
            if (data.buildingName !== '') {
                extraAddress += (extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName);
            }
            fullAddress += (extraAddress !== '' ? ` (${extraAddress})` : '');
        }

        setZonecode(data.zonecode);
        setRoadAddress(fullAddress);
        setOpenPostcode(false);
    };

    return [
        { zonecode, roadAddress, detailAddress, openPostcode },
        { setZonecode, setRoadAddress, setDetailAddress, setOpenPostcode, handleCompletePostcode }
    ];
}