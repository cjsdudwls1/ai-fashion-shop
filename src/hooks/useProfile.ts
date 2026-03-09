'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Order } from '@/types/order';

export interface UseProfileReturn {
    loading: boolean;
    activeTab: 'info' | 'orders';
    setActiveTab: (tab: 'info' | 'orders') => void;
    user: any;
    profile: any;
    address: any;
    // 편집
    isEditing: boolean;
    setIsEditing: (v: boolean) => void;
    editName: string;
    setEditName: (v: string) => void;
    editPhone: string;
    setEditPhone: (v: string) => void;
    editZonecode: string;
    setEditZonecode: (v: string) => void;
    editRoadAddress: string;
    setEditRoadAddress: (v: string) => void;
    editDetailAddress: string;
    setEditDetailAddress: (v: string) => void;
    openPostcode: boolean;
    setOpenPostcode: (v: boolean) => void;
    handleUpdateProfile: (e: React.FormEvent) => Promise<void>;
    handleCompletePostcode: (data: any) => void;
    // 주문
    orders: Order[];
    // 비밀번호
    isChangingPassword: boolean;
    setIsChangingPassword: (v: boolean) => void;
    currentPassword: string;
    setCurrentPassword: (v: string) => void;
    newPassword: string;
    setNewPassword: (v: string) => void;
    confirmPassword: string;
    setConfirmPassword: (v: string) => void;
    passwordMessage: string;
    passwordIsError: boolean;
    passwordLoading: boolean;
    showCurrentPw: boolean;
    setShowCurrentPw: (v: boolean) => void;
    showNewPw: boolean;
    setShowNewPw: (v: boolean) => void;
    handleChangePassword: (e: React.FormEvent) => Promise<void>;
    resetPasswordForm: () => void;
}

export function useProfile(): UseProfileReturn {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'orders'>('info');

    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [address, setAddress] = useState<any>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editZonecode, setEditZonecode] = useState('');
    const [editRoadAddress, setEditRoadAddress] = useState('');
    const [editDetailAddress, setEditDetailAddress] = useState('');
    const [openPostcode, setOpenPostcode] = useState(false);

    const [orders, setOrders] = useState<Order[]>([]);

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [passwordIsError, setPasswordIsError] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);

    const fetchOrders = async (userId: string) => {
        const { data: ordersData, error } = await supabase
            .from('orders')
            .select(`*, order_items ( id, product_id, product_title, quantity, price_at_purchase, item_option )`)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) { console.error('Error fetching orders:', error); return; }

        const allProductIds = new Set<string>();
        (ordersData || []).forEach(order => {
            order.order_items?.forEach((item: any) => {
                if (item.product_id) allProductIds.add(item.product_id);
            });
        });

        let imageMap: Record<string, string> = {};
        if (allProductIds.size > 0) {
            try {
                const res = await fetch(`/api/products/images?ids=${Array.from(allProductIds).join(',')}`);
                if (res.ok) imageMap = await res.json();
            } catch (e) { console.error('Image fetch error:', e); }
        }

        const enrichedOrders = (ordersData || []).map(order => ({
            ...order,
            order_items: order.order_items?.map((item: any) => ({ ...item, product_image: imageMap[item.product_id] || null })),
        }));
        setOrders(enrichedOrders);
    };

    const fetchUserData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }
            setUser(user);

            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(profileData);

            const { data: addressData } = await supabase.from('addresses').select('*').eq('user_id', user.id).eq('is_default', true).maybeSingle();
            setAddress(addressData);

            if (profileData) { setEditName(profileData.full_name || ''); setEditPhone(profileData.phone_number || ''); }
            if (addressData) { setEditZonecode(addressData.zonecode || ''); setEditRoadAddress(addressData.road_address || ''); setEditDetailAddress(addressData.detail_address || ''); }

            fetchOrders(user.id);
        } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
    }, [router]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('tab') === 'orders') setActiveTab('orders');
        }
        fetchUserData();
    }, [fetchUserData]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            setLoading(true);
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: user.id, full_name: editName, phone_number: editPhone, updated_at: new Date().toISOString()
            });
            if (profileError) throw profileError;

            if (address && address.id) {
                const { error: addrError } = await supabase.from('addresses').update({
                    zonecode: editZonecode, road_address: editRoadAddress, detail_address: editDetailAddress,
                    recipient_name: editName, recipient_phone: editPhone, updated_at: new Date().toISOString()
                }).eq('id', address.id);
                if (addrError) throw addrError;
            } else {
                const { error: insertError } = await supabase.from('addresses').insert({
                    user_id: user.id, zonecode: editZonecode, road_address: editRoadAddress,
                    detail_address: editDetailAddress, recipient_name: editName, recipient_phone: editPhone,
                    is_default: true, address_name: '기본'
                });
                if (insertError) throw insertError;
            }

            alert('정보가 수정되었습니다.');
            setIsEditing(false);
            fetchUserData();
        } catch (error: any) { alert('다시 시도해주세요: ' + error.message); } finally { setLoading(false); }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage('');
        setPasswordIsError(false);

        if (newPassword.length < 6) { setPasswordMessage('새 비밀번호는 6자 이상이어야 합니다.'); setPasswordIsError(true); return; }
        if (newPassword !== confirmPassword) { setPasswordMessage('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.'); setPasswordIsError(true); return; }

        setPasswordLoading(true);
        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            const email = currentUser?.email || '';
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
            if (signInError) { setPasswordMessage('현재 비밀번호가 일치하지 않습니다.'); setPasswordIsError(true); return; }

            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
            if (updateError) throw updateError;

            setPasswordMessage('비밀번호가 성공적으로 변경되었습니다.');
            setPasswordIsError(false);
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
            setTimeout(() => { setIsChangingPassword(false); setPasswordMessage(''); }, 2000);
        } catch (err: any) {
            setPasswordMessage('비밀번호 변경 중 오류가 발생했습니다. 다시 시도해주세요.');
            setPasswordIsError(true);
        } finally { setPasswordLoading(false); }
    };

    const handleCompletePostcode = (data: any) => {
        let fullAddress = data.address;
        let extraAddress = '';
        if (data.addressType === 'R') {
            if (data.bname !== '') extraAddress += data.bname;
            if (data.buildingName !== '') extraAddress += (extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName);
            fullAddress += (extraAddress !== '' ? ` (${extraAddress})` : '');
        }
        setEditZonecode(data.zonecode);
        setEditRoadAddress(fullAddress);
        setOpenPostcode(false);
    };

    const resetPasswordForm = () => {
        setIsChangingPassword(false);
        setPasswordMessage('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    return {
        loading, activeTab, setActiveTab,
        user, profile, address,
        isEditing, setIsEditing,
        editName, setEditName, editPhone, setEditPhone,
        editZonecode, setEditZonecode, editRoadAddress, setEditRoadAddress,
        editDetailAddress, setEditDetailAddress,
        openPostcode, setOpenPostcode,
        handleUpdateProfile, handleCompletePostcode,
        orders,
        isChangingPassword, setIsChangingPassword,
        currentPassword, setCurrentPassword,
        newPassword, setNewPassword,
        confirmPassword, setConfirmPassword,
        passwordMessage, passwordIsError, passwordLoading,
        showCurrentPw, setShowCurrentPw,
        showNewPw, setShowNewPw,
        handleChangePassword, resetPasswordForm,
    };
}
