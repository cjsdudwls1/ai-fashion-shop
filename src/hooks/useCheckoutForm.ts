import { useState, useEffect } from 'react';
import { ShippingInfo } from '@/types/order';
import { DefaultShipping } from './useCheckoutAuth';

export function useCheckoutForm(defaultShipping: DefaultShipping | null) {
    const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
        name: '',
        phone: '',
        zonecode: '',
        roadAddress: '',
        detailAddress: '',
        memo: ''
    });
    const [depositorName, setDepositorName] = useState('');

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
    const [openPostcode, setOpenPostcode] = useState(false);

    // Apply default shipping when loaded
    useEffect(() => {
        if (defaultShipping) {
            setShippingInfo(prev => ({
                ...prev,
                name: defaultShipping.name || prev.name,
                phone: defaultShipping.phone || prev.phone,
                zonecode: defaultShipping.zonecode || prev.zonecode,
                roadAddress: defaultShipping.roadAddress || prev.roadAddress,
                detailAddress: defaultShipping.detailAddress || prev.detailAddress,
            }));
            if (defaultShipping.name) {
                setDepositorName(defaultShipping.name);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultShipping]);

    // Validation
    useEffect(() => {
        const errors: Record<string, string> = {};

        if (touchedFields.name && !shippingInfo.name.trim()) {
            errors.name = '받는 분 이름을 입력해주세요.';
        }
        if (touchedFields.phone) {
            if (!shippingInfo.phone.trim()) {
                errors.phone = '연락처를 입력해주세요.';
            } else if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(shippingInfo.phone.replace(/-/g, '').replace(/^01/, '01'))) {
                if (shippingInfo.phone.replace(/-/g, '').length < 10) {
                    errors.phone = '올바른 연락처를 입력해주세요.';
                }
            }
        }
        if (touchedFields.detailAddress && !shippingInfo.detailAddress.trim()) {
            errors.detailAddress = '상세 주소를 입력해주세요.';
        }
        if (touchedFields.depositorName && !depositorName.trim()) {
            errors.depositorName = '입금자명을 입력해주세요.';
        }

        setFieldErrors(errors);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shippingInfo, depositorName, touchedFields]);

    const handleBlur = (fieldName: string) => {
        setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    };

    const markAllTouched = () => {
        setTouchedFields({
            name: true,
            phone: true,
            detailAddress: true,
            depositorName: true,
        });
    };

    const isValid = () => {
        if (!shippingInfo.name.trim()) return false;
        if (!shippingInfo.phone.trim()) return false;
        if (!shippingInfo.roadAddress) return false;
        if (!shippingInfo.detailAddress.trim()) return false;
        if (!depositorName.trim()) return false;
        return true;
    };

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

        setShippingInfo(prev => ({
            ...prev,
            zonecode: data.zonecode,
            roadAddress: fullAddress,
        }));
        setOpenPostcode(false);
    };

    return {
        shippingInfo,
        setShippingInfo,
        depositorName,
        setDepositorName,
        fieldErrors,
        handleBlur,
        markAllTouched,
        isValid,
        openPostcode,
        setOpenPostcode,
        handleCompletePostcode,
    };
}
