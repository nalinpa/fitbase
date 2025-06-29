import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { cloudFunctionsService } from '../services/cloudFunctionsService';

export interface UserPreferences {
  weightUnit: 'kg' | 'lbs';
  timezone: string;
  displayName: string;
}

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>({
    weightUnit: 'kg',
    timezone: 'UTC',
    displayName: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const profile: UserPreferences = await cloudFunctionsService.getUserProfile();
      if(profile){
        setPreferences({
          weightUnit: profile.weightUnit || 'kg',
          timezone: profile.timezone || 'UTC',
          displayName: profile.displayName || user?.displayName || user?.email?.split('@')[0] || ''
        });
    }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      // Set defaults if fetch fails
      setPreferences({
        weightUnit: 'kg',
        timezone: 'UTC',
        displayName: user?.displayName || user?.email?.split('@')[0] || ''
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format weight based on user preference
  const formatWeight = (weight: string | number): string => {
    if (!weight || weight === '0') return '0';
    
    const numWeight = typeof weight === 'string' ? parseFloat(weight) : weight;
    if (isNaN(numWeight)) return '0';
    
    return `${numWeight} ${preferences.weightUnit}`;
  };

  // Helper function to format date/time based on user timezone
  const formatDateTime = (date: Date | any, options?: Intl.DateTimeFormatOptions): string => {
    try {
      let dateObj: Date;
      
      if (date && typeof date === 'object' && date._seconds) {
        // Firestore timestamp
        dateObj = new Date(date._seconds * 1000);
      } else if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else {
        return 'Invalid date';
      }

      return dateObj.toLocaleString('en-US', {
        timeZone: preferences.timezone,
        ...options
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Helper function to get weight unit label
  const getWeightUnitLabel = (): string => {
    return preferences.weightUnit === 'kg' ? 'kg' : 'lbs';
  };

  const getUserName = (): string => {
    return preferences.displayName || user?.displayName || user?.email?.split('@')[0] || '';
  };

  // Helper function to convert weight between units (for display purposes)
  const convertWeight = (weight: string | number, fromUnit: 'kg' | 'lbs', toUnit: 'kg' | 'lbs'): number => {
    const numWeight = typeof weight === 'string' ? parseFloat(weight) : weight;
    if (isNaN(numWeight)) return 0;

    if (fromUnit === toUnit) return numWeight;

    if (fromUnit === 'kg' && toUnit === 'lbs') {
      return Math.round(numWeight * 2.20462 * 100) / 100; // Round to 2 decimal places
    } else if (fromUnit === 'lbs' && toUnit === 'kg') {
      return Math.round(numWeight / 2.20462 * 100) / 100; // Round to 2 decimal places
    }

    return numWeight;
  };

  return {
    preferences,
    loading,
    formatWeight,
    formatDateTime,
    getWeightUnitLabel,
    convertWeight,
    refreshPreferences: fetchPreferences,
    getUserName
  };
}