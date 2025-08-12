'use client';

import { useLocationData } from '@/hooks/useLocationData';
import { useEffect, useRef } from 'react';

interface LocationDropdownsProps {
  selectedCountry: string;
  selectedState: string;
  selectedCity: string;
  onCountryChange: (country: string) => void;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  showLabels?: boolean;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function LocationDropdowns({
  selectedCountry,
  selectedState,
  selectedCity,
  onCountryChange,
  onStateChange,
  onCityChange,
  showLabels = true,
  className = '',
  disabled = false,
  required = false,
}: LocationDropdownsProps) {
  const {
    locationData,
    handleCountryChange,
    handleStateChange,
    handleCityChange,
  } = useLocationData();

  // Use refs to track previous values and prevent unnecessary updates
  const prevCountryRef = useRef(selectedCountry);
  const prevStateRef = useRef(selectedState);

  // Sync external state with internal state - only when values actually change
  useEffect(() => {
    if (selectedCountry && selectedCountry !== prevCountryRef.current) {
      prevCountryRef.current = selectedCountry;
      // Only trigger if the country is not already loaded in the internal state
      const currentCountry = locationData.countries.find(c => c.country === selectedCountry);
      if (!currentCountry) {
        handleCountryChange(selectedCountry);
      }
    }
  }, [selectedCountry, handleCountryChange, locationData.countries]);

  useEffect(() => {
    if (selectedState && selectedState !== prevStateRef.current) {
      prevStateRef.current = selectedState;
      // Only trigger if the state is not already loaded in the internal state
      const currentState = locationData.states.find(s => s.name === selectedState);
      if (!currentState) {
        handleStateChange(selectedState);
      }
    }
  }, [selectedState, handleStateChange, locationData.states]);

  const handleCountrySelect = (country: string) => {
    handleCountryChange(country);
    onCountryChange(country);
    onStateChange('');
    onCityChange('');
  };

  const handleStateSelect = (state: string) => {
    handleStateChange(state);
    onStateChange(state);
    onCityChange('');
  };

  const handleCitySelect = (city: string) => {
    handleCityChange(city);
    onCityChange(city);
  };

  const dropdownStyle = `w-full px-4 py-3 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none ${
    disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-gray-400'
  }`;

  const labelStyle = "text-sm font-semibold text-gray-700 mb-2 block";

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Country Dropdown */}
      <div className="space-y-2">
        {showLabels && (
          <label className={labelStyle}>
            Country {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            value={selectedCountry}
            onChange={(e) => handleCountrySelect(e.target.value)}
            disabled={disabled}
            className={dropdownStyle}
            required={required}
          >
            <option value="" className="text-gray-500">Select Country</option>
            {locationData.countries.map((country) => (
              <option key={country.country} value={country.country} className="text-gray-900">
                {country.country}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* State Dropdown */}
      <div className="space-y-2">
        {showLabels && (
          <label className={labelStyle}>
            State {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            value={selectedState}
            onChange={(e) => handleStateSelect(e.target.value)}
            disabled={disabled || !selectedCountry || locationData.states.length === 0}
            className={`${dropdownStyle} ${
              !selectedCountry || locationData.states.length === 0 ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
            }`}
            required={required}
          >
            <option value="" className="text-gray-500">
              {!selectedCountry ? 'Select Country First' : locationData.states.length === 0 ? 'No States Available' : 'Select State'}
            </option>
            {locationData.states.map((state) => (
              <option key={state.name} value={state.name} className="text-gray-900">
                {state.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* City Dropdown */}
      <div className="space-y-2">
        {showLabels && (
          <label className={labelStyle}>
            City {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            value={selectedCity}
            onChange={(e) => handleCitySelect(e.target.value)}
            disabled={disabled || !selectedCountry || (!selectedState && locationData.states.length > 0) || locationData.cities.length === 0}
            className={`${dropdownStyle} ${
              !selectedCountry || (!selectedState && locationData.states.length > 0) || locationData.cities.length === 0 ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
            }`}
            required={required}
          >
            <option value="" className="text-gray-500">
              {!selectedCountry ? 'Select Country First' : 
               !selectedState && locationData.states.length > 0 ? 'Select State First' :
               locationData.cities.length === 0 ? 'No Cities Available' : 'Select City'}
            </option>
            {locationData.cities.map((city) => (
              <option key={city} value={city} className="text-gray-900">
                {city}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Error message */}
      {locationData.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-600 font-medium">{locationData.error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
