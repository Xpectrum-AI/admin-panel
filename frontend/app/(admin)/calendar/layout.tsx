"use client"

import React from 'react';
import {ArrowLeft} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CalendarLayout({ children }: { children: React.ReactNode }) {

  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="flex items-center px-8 py-6 border-b border-gray-200 mb-10">
          <button
            onClick={() => router.push("/dashboard")}
            className="group mr-3"
            aria-label="Back"
          >
            <span className="inline-flex items-center justify-center rounded-lg transition bg-transparent group-hover:bg-gray-100 h-9 w-9">
              <ArrowLeft className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
            </span>
          </button>
          <h1 className="text-2xl md:text-2xl font-bold text-gray-900">Calendar Service</h1>
        </div>
      <main className="pt-6">{children}</main>
    </div>
  );
} 