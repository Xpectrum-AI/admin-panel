import { useState } from 'react';
import { removeUserFromOrg } from '@/service/orgService';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { Building2, Plus, X } from 'lucide-react';

interface OrgChoiceModalProps {
  orgs: any[];
  onOrgChosen: () => void;
  userId?: string;
  handleChooseOrg?: (chosenOrgId: string) => Promise<void>;
}

export default function OrgChoiceModal({ orgs, onOrgChosen, userId, handleChooseOrg }: OrgChoiceModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const { showError, showSuccess } = useErrorHandler();

  const handleOrgSelection = async () => {
    if (!userId) {
      showError('User not found. Please log in again.');
      return;
    }

    if (!selectedOrgId) {
      showError('Please select an organization.');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      if (handleChooseOrg) {
        await handleChooseOrg(selectedOrgId);
      } else {
        // Fallback to internal logic if no handleChooseOrg provided
        const orgsToRemove = orgs.filter((org: any) => (org.orgId || org.id) !== selectedOrgId);
        await Promise.all(orgsToRemove.map((org: any) =>
          removeUserFromOrg(org.orgId || org.id, userId)
        ));
        showSuccess('Workspace selected successfully!');
      }
      onOrgChosen();
      window.location.reload();
    } catch (err: any) {
      showError(err?.message || 'Failed to update workspace selection. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateNewOrg = () => {
    showError('Create new organization functionality not implemented yet.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 bg-opacity-40">
      <div 
        className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        tabIndex={-1}
        style={{ pointerEvents: 'auto' }}
      >
        {/* Header */}
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            Organization Selection
          </h2>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Icon and Description */}
          <div className="text-center">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground text-sm text-gray-500">
              You are currently a member of the following organizations. Please select the organization you want to use.
            </p>
          </div>

          {/* Organizations List */}
          <div className="space-y-4">
            <h4 className="font-medium">Available Organizations</h4>
            <div className="grid gap-2">
              {orgs.map((org: any, index: number) => (
                <div key={org.orgId || org.id} className="flex items-center space-x-2">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selectedOrgId === (org.orgId || org.id)}
                    data-state={selectedOrgId === (org.orgId || org.id) ? "checked" : "unchecked"}
                    value={org.orgId || org.id}
                    className={`aspect-square h-4 w-4 rounded-full border ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                      selectedOrgId === (org.orgId || org.id)
                        ? 'border-gray-500 bg-gray-300'
                        : 'border-primary text-primary'
                    }`}
                    onClick={() => setSelectedOrgId(org.orgId || org.id)}
                    disabled={isProcessing}
                  />
                  <label 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                    onClick={() => setSelectedOrgId(org.orgId || org.id)}
                  >
                    <div className={`rounded-lg border p-3 transition-all duration-200 ${
                      selectedOrgId === (org.orgId || org.id) 
                        ? 'border-gray-500 bg-gray-100 shadow-md' 
                        : 'border-gray-200 bg-card text-card-foreground hover:border-gray-300'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className={`font-medium ${
                            selectedOrgId === (org.orgId || org.id) ? 'text-gray-900' : ''
                          }`}>
                            {org.orgName || org.name}
                          </h5>
                          <p className={`text-sm ${
                            selectedOrgId === (org.orgId || org.id) ? 'text-gray-700' : 'text-gray-500'
                          }`}>
                            {org.metadata?.description || org.description || 'Organization'} • {org.memberCount || '0'} members
                          </p>
                        </div>
                        {selectedOrgId === (org.orgId || org.id) && (
                          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>

            {/* Create New Organization
            <div className="border-t border-gray-200 pt-4">
              <button
                className="justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input border-gray-200  bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full flex items-center gap-2"
                onClick={handleCreateNewOrg}
                disabled={isProcessing}
              >
                <Plus className="h-4 w-4" />
                Create New Organization
              </button>
            </div> */}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={onOrgChosen}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleOrgSelection}
                disabled={!selectedOrgId || isProcessing}
                className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 ${
                  selectedOrgId && !isProcessing
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Select Organization'}
              </button>
            </div>
        </div>
      </div>
    </div>
    </div>
  );
} 