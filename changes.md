I need to customize this webapp more. I had an earlier app that looke like this (implement changes):

MAIN page.tsx:

import dynamic from 'next/dynamic';
import Header from "@/components/sections/Header";
import Hero from "@/components/sections/Hero";
import Footer from "@/components/sections/Footer";

const MainTrading = dynamic(() => import("@/components/sections/MainTrading"), { ssr: false });
const Web3ProviderWrapper = dynamic(() => import("@/components/Web3ProviderWrapper"), { ssr: false });

export default function Home() {
  return (
    <Web3ProviderWrapper>
      <div className="flex flex-col min-h-screen">
        <Header />
        <Hero />
        <MainTrading />
        <Footer />
      </div>
    </Web3ProviderWrapper>
  );
}

MAIN MainTrading.tsx:

'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import ClientCowSwapWidget from '@/components/cowswap/ClientCowSwapWidget';

const JupiterTerminal = dynamic(() => import('@/components/jupiter/JupiterTerminal'), { ssr: false });
const ZeroXSwap = dynamic(() => import('../zerox/ZeroXSwap'), { ssr: false });

export default function MainTrading() {
  const [activeWidget, setActiveWidget] = useState<'ethereum' | 'solana' | 'zerox'>('solana');

  const fadeInAnimation = {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 },
    transition: { duration: 0.5 }
  };

  return (
    <section className="bg-background p-4 flex-grow">
      <div className="max-w-2xl mx-auto h-full min-h-[500px]">
        {/* Widget selection buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          <Button
            size="lg"
            variant={activeWidget === 'ethereum' ? 'default' : 'outline'}
            className="w-full sm:w-48 h-16 text-xl"
            onClick={() => setActiveWidget('ethereum')}
          >
            Ethereum (CoW)
          </Button>
          <Button
            size="lg"
            variant={activeWidget === 'solana' ? 'default' : 'outline'}
            className="w-full sm:w-48 h-16 text-xl"
            onClick={() => setActiveWidget('solana')}
          >
            Solana
          </Button>
          <Button
            size="lg"
            variant={activeWidget === 'zerox' ? 'default' : 'outline'}
            className="w-full sm:w-48 h-16 text-xl"
            onClick={() => setActiveWidget('zerox')}
          >
            0x Swap
          </Button>
        </div>
        
        {/* Widget display with animation */}
        <AnimatePresence mode="wait">
          {activeWidget === 'ethereum' && (
            <motion.div key="ethereum" {...fadeInAnimation}>
              <ClientCowSwapWidget />
            </motion.div>
          )}
          {activeWidget === 'solana' && (
            <motion.div key="solana" {...fadeInAnimation}>
              <JupiterTerminal />
            </motion.div>
          )}
          {activeWidget === 'zerox' && (
            <motion.div key="zerox" {...fadeInAnimation}>
              <ZeroXSwap />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

Hero.tsx:

export default function Hero() {
  return (
    <section className="flex items-center justify-center bg-background text-foreground h-64">
      <h1 className="text-6xl font-bold text-center">AI-powered technical analysis</h1>
    </section>
  );
}

Header.tsx:

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import dynamic from 'next/dynamic';
import ClientOnly from '../ClientOnly';

const ConnectKitButton = dynamic(
  () => import('@/components/ConnectKitButtonWrapper'),
  { ssr: false }
);

export default function Header() {
  return (
    <header className="flex justify-between items-center p-4 pt-6 px-6 sm:px-12 bg-background">
      <div className="flex items-center space-x-4">
        <Image src="/images/logo.svg" alt="Uruloki Logo" width={30} height={30} />
        <span className="text-xl font-bold">URULOKI</span>
        <ClientOnly>
          <ConnectKitButton />
        </ClientOnly>
      </div>
      <nav className="flex items-center space-x-4">
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

export default function Footer() {
  return (
    <footer className="flex justify-between items-center p-4 bg-background text-foreground">
      <div>Made with ❤️ by the Tsuka Community</div>
      <div className="flex space-x-4">
        <a href="#" className="hover:text-primary">Twitter</a>
        <a href="#" className="hover:text-primary">Discord</a>
        <a href="#" className="hover:text-primary">Telegram</a>
      </div>
    </footer>
  );
}

Here is the jupiter folder inside components:

JupiterTerminal.tsx:

'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    Jupiter: any;
  }
}

const JupiterTerminal = () => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadJupiterScript = async () => {
      if (!terminalRef.current) return;

      if (typeof window.Jupiter === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://terminal.jup.ag/main-v2.js';
        script.async = true;

        script.onload = initJupiter;
        document.body.appendChild(script);
      } else {
        initJupiter();
      }
    };

    const initJupiter = () => {
      if (window.Jupiter && typeof window.Jupiter.init === 'function') {
        window.Jupiter.init({
          displayMode: "integrated",
          integratedTargetId: "integrated-terminal",
          endpoint: "https://solana-mainnet.g.alchemy.com/v2/UYwlmuTe3UoLrrxhalMuZRHn-iDWA-RM",
          containerStyles: {
            width: '100%',
            maxWidth: '400px', // Add this line to set a maximum width
            height: '600px',
            border: '1px solid #2d2d2d',
            borderRadius: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            margin: '0 auto', // Add this line to center the widget
          },
        });
      }
    };

    loadJupiterScript();

    return () => {
      if (window.Jupiter && typeof window.Jupiter.close === 'function') {
        window.Jupiter.close();
      }
    };
  }, []);

  return (
    <div 
      id="integrated-terminal" 
      ref={terminalRef} 
      className="w-full max-w-[400px] h-[600px] mx-auto" // Update this line
    />
  );
};

export default JupiterTerminal;

JupiterTerminal.module.css:

.jupiterTerminal :global(.jupiter-terminal-root) > div:first-child {
  display: none !important;
}

layout.tsx:

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Uruloki | Dex aggregator",
  description: "Uruloki is a dex aggregator that allows you to trade at the best prices on Ethereum and Solana",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* ... other head elements ... */}
        <script src="https://widget.cow.fi/script.js" data-preload />
        <script src="https://terminal.jup.ag/main-v2.js" data-preload />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

global.css:

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
    --radius: 0.5rem;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-family: Arial, Helvetica, sans-serif;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

components/ui/

dropdown-menu.tsx:

"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import {
  CheckIcon,
  ChevronRightIcon,
  DotFilledIcon,
} from "@radix-ui/react-icons"

import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Trigger
    ref={ref}
    className={cn(
      "focus:outline-none data-[state=open]:bg-transparent",
      className
    )}
    {...props}
  />
))
DropdownMenuTrigger.displayName = DropdownMenuPrimitive.Trigger.displayName

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRightIcon className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <CheckIcon className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <DotFilledIcon className="h-4 w-4 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}

button.tsx:

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

