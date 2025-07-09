// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Property creation/update types
export interface CreatePropertyData {
  title: string;
  type: string; // PropertyType ObjectId
  price: number;
  description: string;
  images?: string[];
}

export interface UpdatePropertyData extends Partial<CreatePropertyData> {
  id: string;
}

// Query parameters
export interface PropertyQueryParams {
  page?: number;
  limit?: number;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'price' | 'created_at' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// Property statistics
export interface PropertyStats {
  total: number;
  byType: Record<string, number>;
  averagePrice: number;
  priceRange: { min: number; max: number };
}

// Upload response
export interface UploadResponse {
  urls: string[];
} 