import { useState, useCallback, useEffect } from 'react';
import { useOrganizationId } from '../../utils/phoneNumberUtils';

export function useTrunks() {
  const getOrganizationId = useOrganizationId();
  const [trunks, setTrunks] = useState<any[]>([]);
  const [loadingTrunks, setLoadingTrunks] = useState(false);
  const [deletingTrunk, setDeletingTrunk] = useState<string | null>(null);
  const [trunkError, setTrunkError] = useState<string | null>(null);
  const [trunkSuccess, setTrunkSuccess] = useState<string | null>(null);
  const [creatingTrunk, setCreatingTrunk] = useState(false);

  const loadTrunks = useCallback(async () => {
    setLoadingTrunks(true);
    try {
      const orgId = getOrganizationId();
      
      if (!orgId) {
        setTrunks([]);
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_LIVE_API_URL;
      const apiKey = process.env.NEXT_PUBLIC_LIVE_API_KEY || '';
      const response = await fetch(`${baseUrl}/outbound/trunks/organization/${orgId}`, {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      if (result.success && result.trunks) {
        setTrunks(Array.isArray(result.trunks) ? result.trunks : []);
      } else if (result.success && result.data) {
        setTrunks(Array.isArray(result.data) ? result.data : []);
      } else {
        setTrunks([]);
      }
    } catch (err: unknown) {
      setTrunks([]);
    } finally {
      setLoadingTrunks(false);
    }
  }, [getOrganizationId]);

  const handleDeleteTrunk = useCallback(async (trunkId: string) => {
    setDeletingTrunk(trunkId);
    setTrunkError(null);
    setTrunkSuccess(null);

    try {
      const orgId = getOrganizationId();
      const baseUrl = process.env.NEXT_PUBLIC_LIVE_API_URL;
      const apiKey = process.env.NEXT_PUBLIC_LIVE_API_KEY || '';
      
      const response = await fetch(`${baseUrl}/outbound/trunks/${trunkId}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      setTrunkSuccess('Trunk deleted successfully');
      await loadTrunks();
    } catch (error: any) {
      setTrunkError('Failed to delete trunk: ' + error.message);
    } finally {
      setDeletingTrunk(null);
    }
  }, [getOrganizationId, loadTrunks]);

  const handleCreateTrunk = useCallback(async (phoneNumber: string, transport: string = 'udp') => {
    setCreatingTrunk(true);
    setTrunkError(null);
    setTrunkSuccess(null);

    try {
      const orgId = getOrganizationId();
      
      if (!orgId) {
        setTrunkError('Organization ID not found');
        return;
      }

      if (!phoneNumber) {
        setTrunkError('Phone number is required');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_LIVE_API_URL;
      const apiKey = process.env.NEXT_PUBLIC_LIVE_API_KEY || '';
      // Ensure phone number is in E.164 format (add + if missing)
      let formattedPhoneNumber = phoneNumber;
      if (formattedPhoneNumber && !formattedPhoneNumber.startsWith('+')) {
        formattedPhoneNumber = '+' + formattedPhoneNumber;
      }
      
      const trunkData = {
        organization_id: orgId,
        phone_number: formattedPhoneNumber,
        transport: transport
      };
      const response = await fetch(`${baseUrl}/outbound/trunks/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify(trunkData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      if (result.success) {
        setTrunkSuccess('Trunk created successfully!');
        await loadTrunks();
      } else {
        setTrunkError(result.message || 'Failed to create trunk');
      }
    } catch (error: any) {
      setTrunkError('Failed to create trunk: ' + error.message);
    } finally {
      setCreatingTrunk(false);
    }
  }, [getOrganizationId, loadTrunks]);

  useEffect(() => {
    loadTrunks();
  }, [loadTrunks]);

  return {
    trunks,
    setTrunks,
    loadingTrunks,
    deletingTrunk,
    trunkError,
    trunkSuccess,
    creatingTrunk,
    loadTrunks,
    handleDeleteTrunk,
    handleCreateTrunk
  };
}

