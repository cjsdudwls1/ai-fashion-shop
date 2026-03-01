"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { getStatusInfo } from '@/lib/orderUtils';
import DaumPostcode from 'react-daum-postcode';

// Interfaces
interface OrderItem {
    id: string;
    product_id: string;
    product_title: string;
    quantity: number;
    price_at_purchase: number;
    item_option: any;
    product_image?: string; // 상품 이미지 URL
}

interface Order {
    id: string;
    created_at: string;
    status: string;
    total_amount: number;
    shipping_name: string;
    shipping_address: string;
    guest_order_code?: string;
    depositor_name?: string;
    order_items?: OrderItem[];
}

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'orders'>('info');

    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [address, setAddress] = useState<any>(null);

    // Edit Form
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editZonecode, setEditZonecode] = useState('');
    const [editRoadAddress, setEditRoadAddress] = useState('');
    const [editDetailAddress, setEditDetailAddress] = useState('');
    const [openPostcode, setOpenPostcode] = useState(false);

    const [orders, setOrders] = useState<Order[]>([]);

    // 비밀번호 변경
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [passwordIsError, setPasswordIsError] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('tab') === 'orders') setActiveTab('orders');
        }
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }
            setUser(user);

            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(profile);

            const { data: address } = await supabase.from('addresses').select('*').eq('user_id', user.id).eq('is_default', true).maybeSingle();
            setAddress(address);

            if (profile) { setEditName(profile.full_name || ''); setEditPhone(profile.phone_number || ''); }
            if (address) { setEditZonecode(address.zonecode || ''); setEditRoadAddress(address.road_address || ''); setEditDetailAddress(address.detail_address || ''); }

            fetchOrders(user.id);
        } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
    };

    const fetchOrders = async (userId: string) => {
        const { data: ordersData, error } = await supabase
            .from('orders')
            .select(`*, order_items ( id, product_id, product_title, quantity, price_at_purchase, item_option )`)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) { console.error('Error fetching orders:', error); return; }

        // 상품 이미지 조회 (API를 통해 RLS 우회)
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
            } catch (e) {
                console.error('Image fetch error:', e);
            }
        }

        // 이미지 URL 매핑
        const enrichedOrders = (ordersData || []).map(order => ({
            ...order,
            order_items: order.order_items?.map((item: any) => ({
                ...item,
                product_image: imageMap[item.product_id] || null,
            }))
        }));

        setOrders(enrichedOrders);
    };

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

        if (newPassword.length < 6) {
            setPasswordMessage('새 비밀번호는 6자 이상이어야 합니다.');
            setPasswordIsError(true);
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordMessage('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
            setPasswordIsError(true);
            return;
        }

        setPasswordLoading(true);
        try {
            // 현재 비밀번호로 재인증
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            const email = currentUser?.email || '';
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
            if (signInError) {
                setPasswordMessage('현재 비밀번호가 일치하지 않습니다.');
                setPasswordIsError(true);
                return;
            }

            // 비밀번호 변경
            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
            if (updateError) throw updateError;

            setPasswordMessage('비밀번호가 성공적으로 변경되었습니다.');
            setPasswordIsError(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                setIsChangingPassword(false);
                setPasswordMessage('');
            }, 2000);
        } catch (err: any) {
            setPasswordMessage('비밀번호 변경 중 오류가 발생했습니다. 다시 시도해주세요.');
            setPasswordIsError(true);
        } finally {
            setPasswordLoading(false);
        }
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

    if (loading) return (
        <div className="min-h-screen pt-24 flex items-center justify-center bg-[var(--bg-dark)]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 dark:border-gray-200"></div>
        </div>
    );

    // ──────────── 렌더링 ────────────
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-elevated)', paddingBottom: '80px' }}>
            <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 20px 0' }}>

                {/* 페이지 타이틀 */}
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '28px', letterSpacing: '-0.02em' }}>
                    마이페이지
                </h1>

                {/* ─── 탭 메뉴 (개선: 강한 시각적 인지) ─── */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '32px', background: 'var(--bg-card)', borderRadius: '14px', padding: '5px', border: '1px solid var(--border-color)' }}>
                    {(['info', 'orders'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                flex: 1,
                                padding: '14px 0',
                                fontSize: '16px',
                                fontWeight: activeTab === tab ? 700 : 500,
                                color: activeTab === tab ? 'var(--bg-dark)' : 'var(--text-primary)',
                                opacity: activeTab === tab ? 1 : 0.55,
                                background: activeTab === tab ? 'var(--text-primary)' : 'transparent',
                                borderRadius: '10px',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {tab === 'info' ? '회원 정보' : '주문 내역'}
                        </button>
                    ))}
                </div>

                {/* ─── 컨텐츠 ─── */}
                {activeTab === 'info' ? (
                    /* ══════════════ 내 정보 관리 ══════════════ */
                    <>
                        <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            {/* 헤더 */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid var(--border-color)' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>내 정보 관리</h2>
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        style={{
                                            padding: '10px 22px', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                                            background: 'var(--text-primary)', color: 'var(--bg-card)',
                                            border: 'none', cursor: 'pointer', transition: 'opacity 0.2s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                                    >
                                        수정하기
                                    </button>
                                )}
                            </div>

                            <div style={{ padding: '28px' }}>
                                {isEditing ? (
                                    /* ── 수정 폼 ── */
                                    <form onSubmit={handleUpdateProfile}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>아이디</label>
                                                <div style={{ padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '15px' }}>
                                                    {profile?.username || user?.email?.split('@')[0] || '-'}
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>이름</label>
                                                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required
                                                    style={{ width: '100%', padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                                                />
                                            </div>
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>전화번호</label>
                                                <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} required
                                                    style={{ width: '100%', maxWidth: '320px', padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                                                />
                                            </div>
                                        </div>

                                        {/* 배송지 */}
                                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>배송지 정보</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <input type="text" value={editZonecode} readOnly placeholder="우편번호"
                                                        style={{ width: '120px', padding: '14px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '15px', color: 'var(--text-primary)', outline: 'none' }}
                                                    />
                                                    <button type="button" onClick={() => setOpenPostcode(true)}
                                                        style={{ padding: '14px 20px', background: 'var(--text-primary)', color: 'var(--bg-card)', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                                                    >
                                                        주소 검색
                                                    </button>
                                                </div>
                                                <input type="text" value={editRoadAddress} readOnly placeholder="도로명 주소"
                                                    style={{ width: '100%', padding: '14px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '15px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                                                />
                                                <input type="text" value={editDetailAddress} onChange={e => setEditDetailAddress(e.target.value)} placeholder="상세 주소 입력"
                                                    style={{ width: '100%', padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '15px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                                                />
                                            </div>
                                        </div>

                                        {/* 버튼 그룹 */}
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '28px' }}>
                                            <button type="button" onClick={() => setIsEditing(false)}
                                                style={{ padding: '12px 28px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'transparent', color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
                                            >
                                                취소
                                            </button>
                                            <button type="submit"
                                                style={{ padding: '12px 28px', borderRadius: '12px', border: 'none', background: 'var(--text-primary)', color: 'var(--bg-card)', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
                                            >
                                                저장하기
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    /* ── 정보 보기 ── */
                                    <div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
                                            {/* 아이디 */}
                                            <div>
                                                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>아이디</p>
                                                <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                    {profile?.username || user?.email?.split('@')[0] || '-'}
                                                </p>
                                            </div>
                                            {/* 이름 */}
                                            <div>
                                                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>이름</p>
                                                {profile?.full_name ? (
                                                    <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{profile.full_name}</p>
                                                ) : (
                                                    <button onClick={() => setIsEditing(true)} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer' }}>
                                                        이름을 등록해주세요
                                                    </button>
                                                )}
                                            </div>
                                            {/* 전화번호 */}
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>전화번호</p>
                                                {profile?.phone_number ? (
                                                    <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{profile.phone_number}</p>
                                                ) : (
                                                    <button onClick={() => setIsEditing(true)} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer' }}>
                                                        전화번호를 등록해주세요
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* 배송지 */}
                                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>기본 배송지</h3>
                                            {address ? (
                                                <div style={{
                                                    background: 'var(--bg-elevated)', padding: '18px 20px', borderRadius: '14px',
                                                    border: '1px solid var(--border-color)',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '6px', background: 'var(--text-primary)', color: 'var(--bg-card)', fontSize: '11px', fontWeight: 700 }}>기본</span>
                                                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>[{address.zonecode}]</span>
                                                    </div>
                                                    <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                                                        {address.road_address}
                                                    </p>
                                                    {address.detail_address && (
                                                        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.5 }}>{address.detail_address}</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <button onClick={() => setIsEditing(true)} style={{
                                                    width: '100%', padding: '24px', borderRadius: '14px',
                                                    border: '2px dashed var(--border-color)', background: 'transparent',
                                                    color: 'var(--text-muted)', fontSize: '15px', fontWeight: 600,
                                                    cursor: 'pointer', textAlign: 'center',
                                                }}>
                                                    + 배송지를 등록해주세요
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 비밀번호 변경 섹션 */}
                        <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: isChangingPassword ? '1px solid var(--border-color)' : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="18" height="18" fill="none" stroke="var(--text-secondary)" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>비밀번호 변경</h2>
                                </div>
                                {!isChangingPassword && (
                                    <button
                                        onClick={() => { setIsChangingPassword(true); setPasswordMessage(''); }}
                                        style={{ padding: '10px 22px', borderRadius: '10px', fontSize: '14px', fontWeight: 700, background: 'var(--text-primary)', color: 'var(--bg-card)', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }}
                                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                                    >
                                        변경하기
                                    </button>
                                )}
                            </div>

                            {isChangingPassword && (
                                <form onSubmit={handleChangePassword} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {/* 현재 비밀번호 */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>현재 비밀번호</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showCurrentPw ? 'text' : 'password'}
                                                required
                                                value={currentPassword}
                                                onChange={e => setCurrentPassword(e.target.value)}
                                                placeholder="현재 비밀번호 입력"
                                                style={{ width: '100%', padding: '14px 52px 14px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '15px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                                            />
                                            <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
                                                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                {showCurrentPw ? '숨기기' : '보기'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* 새 비밀번호 */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>새 비밀번호</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showNewPw ? 'text' : 'password'}
                                                required
                                                minLength={6}
                                                value={newPassword}
                                                onChange={e => setNewPassword(e.target.value)}
                                                placeholder="새 비밀번호 (6자 이상)"
                                                style={{ width: '100%', padding: '14px 52px 14px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '15px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                                            />
                                            <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                                                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                {showNewPw ? '숨기기' : '보기'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* 새 비밀번호 확인 */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>비밀번호 확인</label>
                                        <input
                                            type="password"
                                            required
                                            minLength={6}
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="새 비밀번호 다시 입력"
                                            style={{ width: '100%', padding: '14px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '15px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                                        />
                                    </div>

                                    {/* 에러/성공 메시지 */}
                                    {passwordMessage && (
                                        <div style={{ padding: '12px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, background: passwordIsError ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', color: passwordIsError ? '#ef4444' : '#16a34a', border: `1px solid ${passwordIsError ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}` }}>
                                            {passwordMessage}
                                        </div>
                                    )}

                                    {/* 버튼 */}
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                                        <button type="button"
                                            onClick={() => { setIsChangingPassword(false); setPasswordMessage(''); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                                            style={{ padding: '12px 24px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'transparent', color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            취소
                                        </button>
                                        <button type="submit" disabled={passwordLoading}
                                            style={{ padding: '12px 28px', borderRadius: '12px', border: 'none', background: 'var(--text-primary)', color: 'var(--bg-card)', fontSize: '15px', fontWeight: 700, cursor: 'pointer', opacity: passwordLoading ? 0.6 : 1 }}
                                        >
                                            {passwordLoading ? '변경 중...' : '변경 완료'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </>
                ) : (
                    /* ══════════════ 주문 내역 ══════════════ */
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>주문 내역</h2>

                        {orders.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {orders.map(order => {
                                    const statusInfo = getStatusInfo(order.status);
                                    return (
                                        <div key={order.id} style={{
                                            background: 'var(--bg-card)', borderRadius: '20px',
                                            border: '1px solid var(--glass-border)', overflow: 'hidden',
                                            boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 6px rgba(0,0,0,0.04)',
                                        }}>
                                            {/* 주문 헤더 */}
                                            <div style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '18px 24px', borderBottom: '1px solid var(--border-color)',
                                                background: 'var(--bg-elevated)',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                        {new Date(order.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </span>
                                                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
                                                        주문번호 #{order.guest_order_code || order.id.slice(0, 8)}
                                                    </span>
                                                </div>
                                                <span className={statusInfo.color} style={{
                                                    display: 'inline-flex', alignItems: 'center',
                                                    padding: '6px 14px', borderRadius: '20px',
                                                    fontSize: '13px', fontWeight: 700,
                                                    lineHeight: '1.2',
                                                }}>
                                                    {statusInfo.label}
                                                </span>
                                            </div>

                                            {/* 주문 상품 목록 */}
                                            <div style={{ padding: '20px 24px' }}>
                                                {order.order_items?.map((item, idx) => (
                                                    <div key={idx}>
                                                        <div style={{
                                                            display: 'flex', gap: '16px', alignItems: 'flex-start',
                                                        }}>
                                                            {/* 상품 이미지 */}
                                                            <div style={{
                                                                width: '80px', height: '100px', borderRadius: '10px',
                                                                overflow: 'hidden', flexShrink: 0,
                                                                background: '#f5f5f5', border: '1px solid var(--border-color)',
                                                            }}>
                                                                {item.product_image ? (
                                                                    <img src={item.product_image} alt={item.product_title}
                                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                ) : (
                                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                        <svg width="28" height="28" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24" strokeWidth="1.5">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* 상품 정보 */}
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px', lineHeight: 1.4 }}>
                                                                    {item.product_title}
                                                                </p>
                                                                {/* 옵션 태그 */}
                                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                                                    {item.item_option?.color && (
                                                                        <span style={{
                                                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                            padding: '4px 10px', borderRadius: '6px',
                                                                            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)',
                                                                            fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)',
                                                                        }}>
                                                                            색상: {item.item_option.color}
                                                                        </span>
                                                                    )}
                                                                    {item.item_option?.size && (
                                                                        <span style={{
                                                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                            padding: '4px 10px', borderRadius: '6px',
                                                                            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)',
                                                                            fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)',
                                                                        }}>
                                                                            사이즈: {item.item_option.size}
                                                                        </span>
                                                                    )}
                                                                    <span style={{
                                                                        padding: '4px 10px', borderRadius: '6px',
                                                                        background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)',
                                                                        fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)',
                                                                    }}>
                                                                        {item.quantity}개
                                                                    </span>
                                                                </div>
                                                                <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                                                    {item.price_at_purchase.toLocaleString()}원
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {/* 상품 간 구분선 */}
                                                        {idx < (order.order_items?.length || 0) - 1 && (
                                                            <div style={{ height: '1px', background: 'var(--border-color)', margin: '12px 0' }} />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* 하단: 배송지 + 결제 총액 (카드 풋터) */}
                                            <div style={{
                                                borderTop: '1px solid var(--border-color)',
                                                padding: '18px 24px',
                                                background: 'var(--bg-elevated)',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px',
                                            }}>
                                                <div style={{ flex: 1, minWidth: '200px' }}>
                                                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        배송지
                                                    </p>
                                                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px' }}>
                                                        {order.shipping_name}
                                                    </p>
                                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                                        {order.shipping_address}
                                                    </p>
                                                </div>
                                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        총 결제금액
                                                    </p>
                                                    <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                                        {order.total_amount.toLocaleString()}원
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)',
                                borderRadius: '20px', border: '1px solid var(--border-color)',
                            }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <svg width="24" height="24" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                                <p style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                    아직 주문 내역이 없습니다.
                                </p>
                                <button
                                    onClick={() => router.push('/products')}
                                    style={{
                                        padding: '12px 28px', borderRadius: '12px', border: 'none',
                                        background: 'var(--text-primary)', color: 'var(--bg-card)',
                                        fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                                    }}
                                >
                                    쇼핑하러 가기
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 우편번호 모달 */}
                {openPostcode && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '16px' }}>
                        <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: '520px', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 24px 48px rgba(0,0,0,0.15)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-elevated)' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>주소 검색</h3>
                                <button onClick={() => setOpenPostcode(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-secondary)', fontSize: '18px' }}>✕</button>
                            </div>
                            <div style={{ height: '450px' }}>
                                <DaumPostcode onComplete={handleCompletePostcode} style={{ height: '100%' }} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
