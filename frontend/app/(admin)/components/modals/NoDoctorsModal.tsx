"use client";

import { Stethoscope, Plus, X } from 'lucide-react';

interface NoDoctorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDoctor: () => void;
}

export default function NoDoctorsModal({ isOpen, onClose, onAddDoctor }: NoDoctorsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">No Doctors Found</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="text-center space-y-4 flex flex-col items-center justify-center h-full">
          <div className="mx-auto h-25 w-25 text-gray-300 mb-4 flex items-center justify-center bg-gray-200 rounded-full">
              <Stethoscope className="h-15 w-15 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center text-xl">
            Get Started with Doctors
          </h3>
          <p className="text-gray-600 mb-6 text-sm">
            You haven't added any doctors yet. Add your first doctor to start managing their profiles and calendars.
          </p>
          
          <button
            onClick={() => {
              onAddDoctor();
              onClose();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Your First Doctor
          </button>
        </div>
      </div>
    </div>
  );
} 