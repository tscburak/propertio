import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../apiClient';
import { IProperty } from '@/models';
import { PropertyQueryParams, CreatePropertyData, UpdatePropertyData } from '@/types';

interface UsePropertiesOptions {
  initialParams?: PropertyQueryParams;
  autoFetch?: boolean;
}

export function useProperties(options: UsePropertiesOptions = {}) {
  const { initialParams = {}, autoFetch = true } = options;
  
  const [properties, setProperties] = useState<IProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const hasFetched = useRef(false);
  const fetchProperties = useCallback(async (params: PropertyQueryParams = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getProperties(params);
      
      if (response.success && response.data) {
        setProperties(response.data);
        setPagination(response.pagination);
        
      } else {
        setError(response.error || 'Failed to fetch properties');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const createProperty = useCallback(async (propertyData: CreatePropertyData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.createProperty(propertyData);
      
      if (response.success && response.data) {
        setProperties(prev => [response.data!, ...prev]);
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Failed to create property');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProperty = useCallback(async (propertyData: UpdatePropertyData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.updateProperty(propertyData);
      
      if (response.success && response.data) {
        setProperties(prev => 
          prev.map(prop => 
            prop._id === propertyData.id ? response.data! : prop
          )
        );
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Failed to update property');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProperty = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.deleteProperty(id);
      
      if (response.success) {
        setProperties(prev => prev.filter(prop => prop._id !== id));
        return { success: true };
      } else {
        setError(response.error || 'Failed to delete property');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const searchProperties = useCallback(async (searchTerm: string, params: Omit<PropertyQueryParams, 'search'> = {}) => {
    return fetchProperties({ ...params, search: searchTerm });
  }, [fetchProperties]);

  const getPropertiesByType = useCallback(async (typeId: string, params: Omit<PropertyQueryParams, 'type'> = {}) => {
    return fetchProperties({ ...params, type: typeId });
  }, [fetchProperties]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && !hasFetched.current) {
      hasFetched.current = true;
      fetchProperties(initialParams);
    }
  }, [autoFetch, initialParams]); // Remove fetchProperties from dependencies

  return {
    properties,
    loading,
    error,
    pagination,
    fetchProperties,
    createProperty,
    updateProperty,
    deleteProperty,
    searchProperties,
    getPropertiesByType,
    clearError: () => setError(null),
  };
} 