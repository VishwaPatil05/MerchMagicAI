
export interface ProductType {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface GenerationState {
  isGenerating: boolean;
  error: string | null;
  currentImage: string | null;
  history: string[];
}

export interface LogoData {
  base64: string;
  mimeType: string;
  name: string;
}
