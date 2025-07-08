import React from 'react';
import Header from '../dashboard/Header';

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="pt-6">{children}</main>
    </div>
  );
} 