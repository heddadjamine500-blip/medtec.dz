"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Pill, Bell, Activity, ArrowRight, FileText, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PatientDashboard() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-6xl mx-auto space-y-8">
      
      {/* Welcome Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Hello, Alice 👋</h1>
          <p className="text-neutral-400 mt-2 text-lg">Your health overview is looking great today.</p>
        </div>
        <Button className="bg-medical-blue hover:bg-medical-blue/90 text-white rounded-full px-6 py-6 shadow-lg shadow-medical-blue/20">
          <Calendar className="w-5 h-5 mr-2" /> Book Appointment
        </Button>
      </motion.div>

      {/* Quick Summary Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard 
          icon={<Calendar className="w-5 h-5 text-blue-500" />} 
          title="Upcoming Appointment" 
          value="Cardiology Checkup" 
          subtext="Tomorrow, 10:00 AM" 
          color="bg-blue-500/10 border-blue-500/20"
        />
        <DashboardCard 
          icon={<Pill className="w-5 h-5 text-emerald-500" />} 
          title="Active Prescriptions" 
          value="2 Medications" 
          subtext="Next refill in 5 days" 
          color="bg-emerald-500/10 border-emerald-500/20"
        />
        <DashboardCard 
          icon={<Bell className="w-5 h-5 text-amber-500" />} 
          title="Notifications" 
          value="3 Unread" 
          subtext="Lab results available" 
          color="bg-amber-500/10 border-amber-500/20"
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Health Overview */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-neutral-800/50 pb-4">
              <CardTitle className="text-xl text-white flex items-center"><Activity className="mr-2 text-medical-blue" /> Health Metrics</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricBox label="Heart Rate" val="72" unit="bpm" status="Normal" />
                <MetricBox label="Blood Pressure" val="120/80" unit="mmHg" status="Normal" />
                <MetricBox label="Weight" val="68" unit="kg" status="-1.2kg" />
                <MetricBox label="Sleep" val="7.5" unit="hrs" status="Optimal" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-neutral-800/50 pb-4 flex justify-between items-center flex-row">
              <CardTitle className="text-xl text-white flex items-center"><FileText className="mr-2 text-medical-blue" /> Recent Activity</CardTitle>
              <Button variant="ghost" className="text-neutral-400 hover:text-white rounded-full">View All <ArrowRight className="ml-2 w-4 h-4" /></Button>
            </CardHeader>
            <CardContent className="p-0">
               <ActivityRow title="Cholesterol Lab Test" date="Oct 12, 2026" type="Result Added" />
               <ActivityRow title="Dr. Sarah Connor" date="Oct 05, 2026" type="General Checkup" />
               <ActivityRow title="Amoxicillin 500mg" date="Sep 28, 2026" type="Prescription Renewed" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Sidebar Widget */}
        <motion.div variants={itemVariants} className="space-y-6">
           <div className="p-6 rounded-3xl bg-gradient-to-br from-medical-blue/20 to-purple-500/10 border border-white/5 relative overflow-hidden backdrop-blur-3xl group">
             <div className="absolute top-[-50%] right-[-50%] w-64 h-64 bg-medical-blue/30 blur-3xl rounded-full group-hover:bg-medical-blue/40 transition-colors"></div>
             <h3 className="text-lg font-bold text-white mb-2">Upgrade to Premium Care</h3>
             <p className="text-sm text-neutral-300 mb-6">Get 24/7 priority access to specialists and personalized health plans.</p>
             <Button className="w-full bg-white text-medical-blue hover:bg-neutral-100 rounded-xl font-bold">Explore Plans</Button>
           </div>
        </motion.div>
      </div>

    </motion.div>
  );
}

// Subcomponents

function DashboardCard({ icon, title, value, subtext, color }: any) {
  return (
    <Card className={`bg-neutral-900/40 border ${color} backdrop-blur-md rounded-3xl hover:bg-neutral-800/40 transition-colors cursor-pointer group`}>
      <CardContent className="p-6 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-6">
          <div className="p-3 bg-neutral-950/50 rounded-2xl group-hover:scale-110 transition-transform">{icon}</div>
          <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
          <p className="text-xs text-neutral-500">{subtext}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricBox({ label, val, unit, status }: any) {
  return (
    <div className="p-4 bg-neutral-950/50 rounded-2xl border border-neutral-800/50 hover:border-neutral-700 transition-colors cursor-pointer">
      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">{label}</p>
      <p className="text-3xl font-black text-white mb-1">{val} <span className="text-sm font-medium text-neutral-500 tracking-normal">{unit}</span></p>
      <p className="text-xs text-emerald-400 font-medium">{status}</p>
    </div>
  );
}

function ActivityRow({ title, date, type }: any) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/30 transition-colors cursor-pointer group">
      <div>
        <p className="font-bold text-white group-hover:text-medical-blue transition-colors">{title}</p>
        <p className="text-sm text-neutral-500">{type}</p>
      </div>
      <p className="text-sm font-medium text-neutral-400">{date}</p>
    </div>
  );
}
