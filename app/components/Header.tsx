'use client';

import React from "react"; // Ensure React is imported
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./dropdown-menu";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import Marquee from "./MarqueeAnimation";

export default function Header() {
  return (
    <header className="flex flex-wrap items-center justify-between p-4 pt-6 px-6 sm:px-12 bg-transparent">
      <div className="flex items-center space-x-4 mb-2 sm:mb-0 transition-transform duration-300 ease-in-out hover:scale-105">
        <Image src="/logo.svg" alt="Uruloki Logo" width={30} height={30} />
        <span className="text-xl font-bold">URULOKI</span>
      </div>
      
      <div className="w-full sm:w-auto sm:flex-1 mx-4 max-w-full sm:max-w-[50%] lg:max-w-[60%] order-3 sm:order-2">
        <Marquee speed={60} direction="left">
          <span className="text-black font-semibold text-sm sm:text-base px-4">
            Your one-stop AI-powered trading platform 🤖 Burn $TSUKA with every trade 🔥
          </span>
        </Marquee>
      </div>

      <nav className="flex items-center space-x-4 order-2 sm:order-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center focus:outline-none">
            Learn more
            <ChevronDownIcon className="ml-1 h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>About Us</DropdownMenuItem>
            <DropdownMenuItem>Why $Tsuka?</DropdownMenuItem>
            <DropdownMenuItem>How It Works?</DropdownMenuItem>
            <DropdownMenuItem>FAQ</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </header>
  );
}