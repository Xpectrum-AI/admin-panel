import React, { useState } from 'react';
import { X, Check, ChevronDown, Loader2 } from 'lucide-react';
import { Listbox } from '@headlessui/react';
import { OrgMember } from './types';

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userId: string, newRole: string) => Promise<void>;
  loading: boolean;
  member: OrgMember | null;
}

const roles = ['Admin', 'Member'];

export default function ChangeRoleModal({ isOpen, onClose, onSubmit, loading, member }: ChangeRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !selectedRole) return;
    
    await onSubmit(member.userId, selectedRole);
    setSelectedRole('');
  };

  const handleClose = () => {
    setSelectedRole('');
    onClose();
  };

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 bg-opacity-50 backdrop-fade-in"
        onClick={handleClose}
      ></div>
      {/* Modal */}
      <div
        className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 modal-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Change User Role</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            {member.pictureUrl ? (
              <img 
                src={member.pictureUrl} 
                alt={`${member.firstName} ${member.lastName}`}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {member.firstName?.[0]}{member.lastName?.[0]}
                </span>
              </div>
            )}
            <div>
              <div className="font-medium text-gray-900">
                {member.firstName} {member.lastName}
              </div>
              <div className="text-sm text-gray-500">{member.email}</div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Current role: <span className="font-medium">{member.roleInOrg}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Role
            </label>
            <Listbox value={selectedRole} onChange={setSelectedRole}>
              <div className="relative">
                <Listbox.Button className="w-full px-4 py-2 border border-gray-200 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition flex items-center justify-between">
                  <span>{selectedRole || 'Select a role'}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg py-1 text-base focus:outline-none">
                  {roles.map((role: string) => (
                    <Listbox.Option
                      key={role}
                      value={role}
                      className={({ active }: { active: boolean }) =>
                        `cursor-pointer select-none relative py-2 pl-10 pr-4 ${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-900'
                        }`
                      }
                    >
                      {({ selected }: { selected: boolean }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                            {role}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-900">
                              <Check className="h-4 w-4" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>
          
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedRole}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{loading ? 'Changing...' : 'Change Role'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 