import { IProperty, IPropertyType } from '@/models';
import {
  ApiResponse,
  PaginatedResponse,
  CreatePropertyData,
  UpdatePropertyData,
  PropertyQueryParams,
  PropertyStats,
  UploadResponse,
} from '@/types';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Property CRUD Operations

  /**
   * Create a new property
   */
  async createProperty(propertyData: CreatePropertyData): Promise<ApiResponse<IProperty>> {
    
    return this.request<IProperty>('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  }

  /**
   * Get all properties with pagination and filters
   */
  async getProperties(params: PropertyQueryParams = {}): Promise<PaginatedResponse<IProperty[]>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const endpoint = `/properties${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    try {
      const response = await this.request(endpoint) as PaginatedResponse<IProperty[]>;
      if (!response.success) {
        return {
          success: false,
          data: undefined,
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          error: response.error,
        };
      }
      console.log(response);
      const pagination = {
        page: response.pagination.page || 1,
        limit: response.pagination.limit || 10,
        total: response.pagination.total || 0,
        totalPages: response.pagination.totalPages || 0,
      }
      return {
        success: true,
        data: response.data || [],
        pagination,
      };
    } catch (error) {
      return {
        success: false,
        data: undefined,
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Get a single property by ID
   */
  async getProperty(id: string): Promise<ApiResponse<IProperty>> {
    return this.request<IProperty>(`/properties/${id}`);
  }

  /**
   * Update a property
   */
  async updateProperty(propertyData: UpdatePropertyData): Promise<ApiResponse<IProperty>> {
    const { id, ...data } = propertyData;
    return this.request<IProperty>(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a property
   */
  async deleteProperty(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return this.request<{ deleted: boolean }>(`/properties/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get properties by type
   */
  async getPropertiesByType(typeId: string, params: Omit<PropertyQueryParams, 'type'> = {}): Promise<PaginatedResponse<IProperty[]>> {
    return this.getProperties({ ...params, type: typeId });
  }

  /**
   * Search properties by title or description
   */
  async searchProperties(searchTerm: string, params: Omit<PropertyQueryParams, 'search'> = {}): Promise<PaginatedResponse<IProperty[]>> {
    return this.getProperties({ ...params, search: searchTerm });
  }

  // PropertyType Operations

  /**
   * Get all property types
   */
  async getPropertyTypes(): Promise<ApiResponse<IPropertyType[]>> {
    return this.request<IPropertyType[]>('/property-types');
  }

  /**
   * Get a single property type by ID
   */
  async getPropertyType(id: string): Promise<ApiResponse<IPropertyType>> {
    return this.request<IPropertyType>(`/property-types/${id}`);
  }

  // Utility Methods

  /**
   * Get property statistics
   */
  async getPropertyStats(): Promise<ApiResponse<PropertyStats>> {
    return this.request<PropertyStats>('/properties/stats');
  }

  /**
   * Upload property images
   */
  async uploadPropertyImages(propertyId: string, images: File[]): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append('propertyId', propertyId);
    
    // Append each image to the form data
    images.forEach((image) => {
      formData.append('images', image);
    });

    try {
      const url = `${this.baseUrl}/properties/${propertyId}/images`;
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
