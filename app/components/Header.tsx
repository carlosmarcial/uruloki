'use client';

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./dropdown-menu";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import Marquee from "./MarqueeAnimation";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="flex flex-wrap items-center justify-between p-4 pt-6 px-6 sm:px-12 bg-transparent">
        <Link href="/" className="flex items-center space-x-4 mb-2 sm:mb-0 transition-transform duration-300 ease-in-out hover:scale-105">
          <Image src="/logo.svg" alt="Uruloki Logo" width={30} height={30} />
          <span className="text-xl font-bold" style={{ color: '#77be44ff' }}>URULOKI</span>
        </Link>
        
        <div className="w-full sm:w-auto sm:flex-1 mx-4 max-w-full sm:max-w-[50%] lg:max-w-[60%] order-3 sm:order-2">
          <Marquee speed={60} direction="left">
            <span className="text-black font-semibold text-sm sm:text-base px-4">
              Your one-stop AI-powered trading platform 🤖 Burn $TSUKA with every trade 🔥
            </span>
          </Marquee>
        </div>

        <nav className="flex items-center space-x-4 order-2 sm:order-3">
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <div 
              onMouseEnter={() => setIsOpen(true)}
              onMouseLeave={() => setIsOpen(false)}
            >
              <DropdownMenuTrigger className="flex items-center focus:outline-none text-[#77be44] font-medium hover:text-[#77be44]/80 transition-colors">
                Learn more
                <ChevronDownIcon className="ml-1 h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900 border border-gray-800">
                <Link href="/faq">
                  <DropdownMenuItem className="text-gray-200 hover:text-white hover:bg-[#77be44] focus:bg-[#77be44] focus:text-white cursor-pointer transition-colors">
                    FAQ
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </div>
          </DropdownMenu>
        </nav>
      </header>
    </>
  );
}