import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../apiClient';
import { IPropertyType } from '@/models';

interface UsePropertyTypesOptions {
  autoFetch?: boolean;
}

export function usePropertyTypes(options: UsePropertyTypesOptions = {}) {
  const { autoFetch = true } = options;
  
  const [propertyTypes, setPropertyTypes] = useState<IPropertyType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchPropertyTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getPropertyTypes();
      
      if (response.success && response.data) {
        setPropertyTypes(response.data);
      } else {
        setError(response.error || 'Failed to fetch property types');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const getPropertyTypeById = useCallback((id: string) => {
    return propertyTypes.find(type => type._id === id);
  }, [propertyTypes]);

  const getPropertyTypeByLabel = useCallback((label: string) => {
    return propertyTypes.find(type => type.label.toLowerCase() === label.toLowerCase());
  }, [propertyTypes]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && !hasFetched.current) {
      hasFetched.current = true;
      fetchPropertyTypes();
    }
  }, [autoFetch]); // Remove fetchPropertyTypes from dependencies

  return {
    propertyTypes,
    loading,
    error,
    fetchPropertyTypes,
    getPropertyTypeById,
    getPropertyTypeByLabel,
    clearError: () => setError(null),
  };
} 