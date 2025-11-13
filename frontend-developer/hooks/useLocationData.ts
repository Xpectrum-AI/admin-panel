import { useState, useEffect, useCallback } from 'react';
import { locationService, Country, State } from '@/service/locationService';

export interface LocationData {
  countries: Country[];
  states: State[];
  cities: string[];
  loading: boolean;
  error: string | null;
}

export interface LocationSelection {
  country: string;
  state: string;
  city: string;
}

export const useLocationData = () => {
  const [locationData, setLocationData] = useState<LocationData>({
    countries: [],
    states: [],
    cities: [],
    loading: false,
    error: null,
  });

  const [selection, setSelection] = useState<LocationSelection>({
    country: '',
    state: '',
    city: '',
  });

  // Fetch countries on component mount
  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = useCallback(async () => {
    setLocationData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const countries = await locationService.getCountries();
      setLocationData(prev => ({
        ...prev,
        countries,
        loading: false,
      }));
    } catch (error: any) {
      setLocationData(prev => ({
        ...prev,
        error: error.message || 'Failed to fetch countries',
        loading: false,
      }));
    }
  }, []);

  const handleCountryChange = useCallback(async (country: string) => {

    
    setSelection(prev => ({
      country,
      state: '',
      city: '',
    }));

    setLocationData(prev => ({
      ...prev,
      states: [],
      cities: [],
      loading: true,
      error: null,
    }));

    if (!country) {
      setLocationData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Try to get states first

      const states = await locationService.getStates(country);
      
      
      setLocationData(prev => ({
        ...prev,
        states,
        loading: false,
      }));
    } catch (error: any) {
      
      
      // If states fail, try to get cities directly
      try {
        const cities = await locationService.getCitiesByCountry(country);

        
        setLocationData(prev => ({
          ...prev,
          states: [],
          cities,
          loading: false,
        }));
      } catch (cityError: any) {
        setLocationData(prev => ({
          ...prev,
          error: `Location data not available for ${country}. Please try another country.`,
          loading: false,
        }));
      }
    }
  }, []);

  const handleStateChange = useCallback(async (state: string, country?: string) => {
    const targetCountry = country || selection.country;

    
    setSelection(prev => ({
      ...prev,
      state,
      city: '',
    }));

    setLocationData(prev => ({
      ...prev,
      cities: [],
      loading: true,
      error: null,
    }));

    if (!state || !targetCountry) {
      setLocationData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {

      const cities = await locationService.getCities(targetCountry, state);
      
      
      setLocationData(prev => ({
        ...prev,
        cities,
        loading: false,
      }));
    } catch (error: any) {
      setLocationData(prev => ({
        ...prev,
        error: `Cities not available for ${state}, ${targetCountry}. Please try another state.`,
        loading: false,
      }));
    }
  }, [selection.country]);



  const handleCityChange = useCallback((city: string) => {
    setSelection(prev => ({
      ...prev,
      city,
    }));
  }, []);

  const resetLocation = useCallback(() => {
    setSelection({
      country: '',
      state: '',
      city: '',
    });
    setLocationData(prev => ({
      ...prev,
      states: [],
      cities: [],
    }));
  }, []);

  const setInitialLocation = useCallback((country: string, state: string, city: string) => {
    setSelection({ country, state, city });
    // You might want to fetch the corresponding states and cities here
    // This would require additional logic to handle the initial load
  }, []);

  return {
    locationData,
    selection,
    handleCountryChange,
    handleStateChange,
    handleCityChange,
    resetLocation,
    setInitialLocation,
    fetchCountries,
  };
};
