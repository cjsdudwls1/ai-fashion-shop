// 역할 타입 정의
export type UserRole = 'user' | 'admin';

// 상품 타입 정의

export interface ColorStock {
  color: string;
  quantity: number;
}

export interface SizeStock {
  size: string;
  quantity: number;
}

export type Gender = 'female' | 'male' | 'unisex';

export interface Product {
  id: string;
  name: string;
  fabric: string;
  gender: Gender;
  category?: string; // New field
  colors: ColorStock[];
  sizes: SizeStock[];
  imageUrl: string; // Primary Image
  galleryImages: { url: string; color?: string; isPrimary?: boolean }[]; // New Gallery field
  videoUrl: string | null;
  audioUrl: string | null;       // TTS 나레이션 오디오 (Base64 Data URL)
  videoStatus: 'pending' | 'generating' | 'completed' | 'failed' | 'tryon_polling' | 'video_polling';
  klingTaskId?: string | null;
  tryOnImageUrl?: string | null;
  videoErrorReason?: string; // New field for error message
  price?: number;
  createdAt: Date;
  deletedAt?: Date | null; // For soft delete
  mediaGenerationType?: 'video' | 'image' | 'none'; // 미디어 생성 타입
  narrationText?: string | null; // AI 영상 모델 대사
  videoModel?: string | null; // AI 영상 생성 모델
}

export interface ProductInput {
  name: string;
  price: number;
  imageUrl?: string;
  galleryImages?: { base64?: string; url?: string; color?: string; isPrimary?: boolean }[];
  fabric: string;
  gender: Gender;
  category?: string;
  narrationText?: string;
  colorsText: string;
  sizesText: string;
  mediaGenerationType?: 'video' | 'image' | 'none';
  videoModel?: string;
}

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  is_setup_finished: boolean;
  role: UserRole;
  updated_at?: string;
}

export interface Address {
  id: string;
  user_id: string;
  address_name: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  zonecode: string | null;
  road_address: string;
  detail_address: string | null;
  is_default: boolean;
  created_at?: string;
}
