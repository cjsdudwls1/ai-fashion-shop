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
  videoStatus: 'pending' | 'generating' | 'completed' | 'failed';
  videoErrorReason?: string; // New field for error message
  price?: number;
  createdAt: Date;
  deletedAt?: Date | null; // For soft delete
}

export interface ProductInput {
  name: string;
  price: number; // Added price field
  imageBase64: string; // Primary for AI
  galleryImages?: { base64: string; color?: string; isPrimary: boolean }[]; // New
  fabric: string;
  gender: Gender;
  category?: string;
  narrationText?: string;
  colorsText: string;
  sizesText: string;
}

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  is_setup_finished: boolean;
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
