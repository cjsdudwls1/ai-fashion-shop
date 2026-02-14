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
  imageUrl: string;
  fabric: string;
  gender: Gender;
  category?: string; // New field
  colors: ColorStock[];
  sizes: SizeStock[];
  videoUrl: string | null;
  audioUrl: string | null;       // TTS 나레이션 오디오 (Base64 Data URL)
  videoStatus: 'pending' | 'generating' | 'completed' | 'failed';
  videoErrorReason?: string; // New field for error message
  createdAt: Date;
  deletedAt?: Date | null; // For soft delete
}

export interface ProductInput {
  name: string;
  imageBase64: string;
  fabric: string;
  gender: Gender;
  category?: string; // New field
  narrationText?: string; // New field
  colorsText: string;
  sizesText: string;
}
