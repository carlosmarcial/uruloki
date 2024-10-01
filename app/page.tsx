'use client';

import { useState } from 'react';
import Header from "./components/Header";
import ModelPreloader from "./components/ModelPreloader";
import dynamic from 'next/dynamic';

const MainTrading = dynamic(() => import("./components/MainTrading"), { ssr: false });

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0D0D0D]"> {/* Updated to a very dark gray */}
      <ModelPreloader />
      <Header />
      <MainTrading />
    </div>
  );
}
