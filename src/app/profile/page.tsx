"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import DaumPostcode from 'react-daum-postcode';

// Interfaces
interface OrderItem {
    id: string;
    product_title: string;
    quantity: number;
    price_at_purchase: number;
    item_option: any; // JSONB
}

interface Order {
    id: string;
    created_at: string; // Add created_at
    status: string;
    total_amount: number;
    shipping_name: string;
    shipping_address: string;
    order_items?: OrderItem[];
}

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'orders'>('info');

    // User Data
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [address, setAddress] = useState<any>(null);

    // Edit Form State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editZonecode, setEditZonecode] = useState('');
    const [editRoadAddress, setEditRoadAddress] = useState('');
    const [editDetailAddress, setEditDetailAddress] = useState('');
    const [openPostcode, setOpenPostcode] = useState(false);

    // Orders Data
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUser(user);

            // Fetch Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            setProfile(profile);

            // Fetch Address (Default)
            const { data: address } = await supabase
                .from('addresses')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_default', true)
                .maybeSingle(); // Use maybeSingle to avoid error if no address
            setAddress(address);

            // Initialize Edit State
            if (profile) {
                setEditName(profile.full_name || '');
                setEditPhone(profile.phone_number || '');
            }
            if (address) {
                setEditZonecode(address.zonecode || '');
                setEditRoadAddress(address.road_address || '');
                setEditDetailAddress(address.detail_address || '');
            }

            // Fetch Orders
            fetchOrders(user.id);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async (userId: string) => {
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                    *,
                    order_items (
                        id,
                        product_title,
                        quantity,
                        price_at_purchase,
                        item_option
                    )
                `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
        } else {
            setOrders(orders || []);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            setLoading(true);

            // 1. Update Profile (Upsert)
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: editName,
                    phone_number: editPhone,
                    updated_at: new Date().toISOString()
                });

            if (profileError) throw profileError;

            // 2. Update Address (Upsert logic)
            // If we have an existing address ID, update it. Otherwise insert new.
            // Simplified logic: If address exists, update. Else insert.
            if (address && address.id) {
                const { error: addrError } = await supabase
                    .from('addresses')
                    .update({
                        zonecode: editZonecode,
                        road_address: editRoadAddress,
                        detail_address: editDetailAddress,
                        recipient_name: editName,
                        recipient_phone: editPhone,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', address.id);
                if (addrError) throw addrError;
            } else {
                const { error: insertError } = await supabase
                    .from('addresses')
                    .insert({
                        user_id: user.id,
                        zonecode: editZonecode,
                        road_address: editRoadAddress,
                        detail_address: editDetailAddress,
                        recipient_name: editName,
                        recipient_phone: editPhone,
                        is_default: true,
                        address_name: '기본'
                    });
                if (insertError) throw insertError;
            }

            alert('정보가 수정되었습니다.');
            setIsEditing(false);
            fetchUserData(); // Refresh

        } catch (error: any) {
            alert('다시 시도해주세요: ' + error.message);
        } finally {
            setLoading(false);
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
        <div className="min-h-screen pt-24 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="container-main pt-8 pb-16">
            <h1 className="text-2xl font-bold mb-8">마이페이지</h1>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8">
                <button
                    onClick={() => setActiveTab('info')}
                    className={`pb-4 px-6 font-medium text-sm transition-colors relative ${activeTab === 'info'
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    회원 정보
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`pb-4 px-6 font-medium text-sm transition-colors relative ${activeTab === 'orders'
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    주문 내역
                </button>
            </div>

            {/* Content */}
            <div className="max-w-3xl">
                {activeTab === 'info' ? (
                    <div className="glass-card p-6 md:p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold">내 정보 관리</h2>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                    수정하기
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
                                        <div className="p-2 bg-gray-50 rounded border border-gray-200 text-gray-500">
                                            {profile?.username || user?.email?.split('@')[0] || '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                                        <input
                                            type="tel"
                                            value={editPhone}
                                            onChange={(e) => setEditPhone(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-6">
                                    <h3 className="text-md font-medium mb-4">배송지 정보</h3>
                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={editZonecode}
                                                readOnly
                                                placeholder="우편번호"
                                                className="w-32 p-2 bg-gray-50 border border-gray-300 rounded"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setOpenPostcode(true)}
                                                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                                            >
                                                주소 검색
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={editRoadAddress}
                                            readOnly
                                            placeholder="도로명 주소"
                                            className="w-full p-2 bg-gray-50 border border-gray-300 rounded"
                                        />
                                        <input
                                            type="text"
                                            value={editDetailAddress}
                                            onChange={(e) => setEditDetailAddress(e.target.value)}
                                            placeholder="상세 주소 입력"
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                    >
                                        저장하기
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">아이디</p>
                                        <p className="font-medium">{profile?.username || user?.email?.split('@')[0] || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">이름</p>
                                        <p className="font-medium">{profile?.full_name || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">전화번호</p>
                                        <p className="font-medium">{profile?.phone_number || '-'}</p>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-6">
                                    <h3 className="text-md font-medium mb-4 text-gray-900">기본 배송지</h3>
                                    {address ? (
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <p className="font-medium mb-1">
                                                [{address.zonecode}] {address.road_address}
                                            </p>
                                            <p className="text-gray-600">{address.detail_address}</p>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-sm">등록된 배송지가 없습니다.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold mb-6">주문 내역</h2>
                        {orders.length > 0 ? (
                            <div className="space-y-6">
                                {orders.map(order => (
                                    <div key={order.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                        {/* Order Header */}
                                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                            <div>
                                                <span className="font-bold text-gray-900 mr-2">
                                                    {new Date(order.created_at).toLocaleDateString()} 주문
                                                </span>
                                                <span className="text-gray-500 text-sm">({order.id.slice(0, 8)})</span>
                                            </div>
                                            <div className="text-right">
                                                <span className={`inline-block px-2 py-1 text-xs rounded-full font-bold ${order.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {order.status === 'paid' ? '결제완료' : order.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Order Items */}
                                        <div className="p-6">
                                            <div className="space-y-4">
                                                {order.order_items?.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center">
                                                        <div>
                                                            <p className="font-medium text-gray-900">{item.product_title}</p>
                                                            <div className="text-sm text-gray-500 mt-1">
                                                                {item.item_option?.color && <span className="mr-2">색상: {item.item_option.color}</span>}
                                                                {item.item_option?.size && <span>사이즈: {item.item_option.size}</span>}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-medium">{item.price_at_purchase.toLocaleString()}원</p>
                                                            <p className="text-gray-500 text-sm">{item.quantity}개</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="border-t border-gray-100 mt-6 pt-4 flex justify-between items-center">
                                                <div className="text-sm text-gray-500">
                                                    배송지: {order.shipping_name} | {order.shipping_address}
                                                </div>
                                                <div className="text-lg font-bold text-indigo-600">
                                                    총 결제금액: {order.total_amount.toLocaleString()}원
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <p className="mb-2">아직 주문 내역이 없습니다.</p>
                                <button
                                    onClick={() => router.push('/products')}
                                    className="text-indigo-600 font-medium hover:underline"
                                >
                                    쇼핑하러 가기
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Postcode Modal */}
            {openPostcode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white w-full max-w-lg rounded-lg shadow-lg relative overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-medium">주소 검색</h3>
                            <button onClick={() => setOpenPostcode(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <div className="h-[400px]">
                            <DaumPostcode onComplete={handleCompletePostcode} style={{ height: '100%' }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
