import React from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-50 overflow-hidden font-sans selection:bg-medical-blue/30 selection:text-medical-blue">
      <Sidebar role="patient" />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-medical-blue/10 to-transparent -z-10 pointer-events-none blur-3xl"></div>
          {children}
        </main>
      </div>
    </div>
  );
}
