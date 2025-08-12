// Location service for fetching countries, states, and cities
const API_BASE_URL = 'https://countriesnow.space/api/v0.1';

export interface Country {
  country: string;
  cities: string[];
}

export interface State {
  name: string;
}

export interface LocationResponse {
  error: boolean;
  msg: string;
  data: any;
}

export const locationService = {
  // Fetch all countries
  async getCountries(): Promise<Country[]> {
    try {
      console.log('Fetching countries from:', `${API_BASE_URL}/countries`);
      const response = await fetch(`${API_BASE_URL}/countries`);
      const result: LocationResponse = await response.json();
      
      console.log('Countries API response:', result);
      
      if (result.error) {
        throw new Error(result.msg || 'Failed to fetch countries');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw new Error('Failed to fetch countries');
    }
  },

  // Fetch states for a specific country
  async getStates(country: string): Promise<State[]> {
    try {
      console.log('Fetching states for country:', country);
      const response = await fetch(`${API_BASE_URL}/countries/states`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ country }),
      });
      
      const result: LocationResponse = await response.json();
      
      console.log('States API response for', country, ':', result);
      
      if (result.error) {
        throw new Error(result.msg || 'Failed to fetch states');
      }
      
      return result.data?.states || [];
    } catch (error) {
      console.error('Error fetching states for', country, ':', error);
      throw new Error('Failed to fetch states');
    }
  },

  // Fetch cities for a specific state in a country
  async getCities(country: string, state: string): Promise<string[]> {
    try {
      console.log('Fetching cities for country:', country, 'state:', state);
      const response = await fetch(`${API_BASE_URL}/countries/state/cities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ country, state }),
      });
      
      const result: LocationResponse = await response.json();
      
      console.log('Cities API response for', country, state, ':', result);
      
      if (result.error) {
        throw new Error(result.msg || 'Failed to fetch cities');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Error fetching cities for', country, state, ':', error);
      throw new Error('Failed to fetch cities');
    }
  },

  // Get cities directly for a country (without state)
  async getCitiesByCountry(country: string): Promise<string[]> {
    try {
      console.log('Fetching cities by country:', country);
      const countries = await this.getCountries();
      const countryData = countries.find(c => c.country === country);
      console.log('Found country data for', country, ':', countryData);
      return countryData?.cities || [];
    } catch (error) {
      console.error('Error fetching cities by country:', error);
      throw new Error('Failed to fetch cities');
    }
  }
};
