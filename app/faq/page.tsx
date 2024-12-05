'use client';

import Header from '@/app/components/Header';
import WebGLBackground from '@/app/components/WebGLBackground';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion";

export default function FAQPage() {
  return (
    <>
      <WebGLBackground delay={0} />
      <div className="relative min-h-screen">
        <Header />
        
        <main className="container mx-auto px-4 py-12 max-w-3xl relative z-10">
          <h1 className="text-4xl font-bold mb-8 text-[#77be44]">Frequently Asked Questions</h1>
          
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-gray-900/80 backdrop-blur-sm rounded-lg border-gray-800">
              <AccordionTrigger className="px-4 text-white hover:no-underline hover:text-[#77be44]">
                Is Uruloki safe to use?
              </AccordionTrigger>
              <AccordionContent className="px-4 text-gray-300">
                Yes, Uruloki is built on top of industry-leading, extensively audited protocols. Our Ethereum integration is powered by 0x (<a href="https://0x.org/" target="_blank" rel="noopener noreferrer" className="text-[#77be44] hover:underline">0x.org</a>), and our Solana integration is provided by Jupiter (<a href="https://station.jup.ag/docs/apis/swap-api" target="_blank" rel="noopener noreferrer" className="text-[#77be44] hover:underline">Jupiter API</a>). Both institutions and their respective integrations have undergone comprehensive security audits, ensuring the highest standards of safety for our users.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-gray-900/80 backdrop-blur-sm rounded-lg border-gray-800">
              <AccordionTrigger className="px-4 text-white hover:no-underline hover:text-[#77be44]">
                How is AI integrated?
              </AccordionTrigger>
              <AccordionContent className="px-4 text-gray-300">
                Our AI integration leverages real-time DEX data from the GeckoTerminal API, which is then processed through OpenAI using our specialized prompt source. This combination enables us to provide sophisticated technical analysis powered by AI, specifically tailored for decentralized exchanges and tokens. This integration ensures our users receive the most accurate and up-to-date trading insights.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-gray-900/80 backdrop-blur-sm rounded-lg border-gray-800">
              <AccordionTrigger className="px-4 text-white hover:no-underline hover:text-[#77be44]">
                What chains and tokens are supported?
              </AccordionTrigger>
              <AccordionContent className="px-4 text-gray-300">
                Uruloki currently supports trading on Ethereum and Solana networks. On Ethereum, we support ETH and all major ERC-20 tokens. On Solana, we support SOL and SPL tokens. Our platform is continuously expanding to include more tokens and provide the best trading experience.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-gray-900/80 backdrop-blur-sm rounded-lg border-gray-800">
              <AccordionTrigger className="px-4 text-white hover:no-underline hover:text-[#77be44]">
                How does the $TSUKA burning mechanism work?
              </AccordionTrigger>
              <AccordionContent className="px-4 text-gray-300">
                With every trade executed on our platform, a portion of the fees is used to buy and burn $TSUKA tokens, after covering operational costs for maintaining and improving our services. This deflationary mechanism helps reduce the total supply of $TSUKA over time, potentially increasing its value while supporting the ecosystem's growth and development.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-gray-900/80 backdrop-blur-sm rounded-lg border-gray-800">
              <AccordionTrigger className="px-4 text-white hover:no-underline hover:text-[#77be44]">
                Where can I get in touch with the Uruloki team and the TSUKA project?
              </AccordionTrigger>
              <AccordionContent className="px-4 text-gray-300">
                <p className="mb-4">Stay connected with Uruloki:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Follow us on <a href="https://x.com/urulokiApp/" target="_blank" rel="noopener noreferrer" className="text-[#77be44] hover:underline">X (Twitter)</a></li>
                  <li>Join our community on <a href="https://t.me/UrulokiApp" target="_blank" rel="noopener noreferrer" className="text-[#77be44] hover:underline">Telegram</a></li>
                </ul>
                <p className="mb-4">Connect with the TSUKA community:</p>
                <ul className="list-disc pl-6">
                  <li>Follow TSUKA on <a href="https://x.com/tsukaphilosophy" target="_blank" rel="noopener noreferrer" className="text-[#77be44] hover:underline">X (Twitter)</a></li>
                  <li>Join the TSUKA Telegram <a href="https://t.me/DejitaruTsukaSanghaOfficial" target="_blank" rel="noopener noreferrer" className="text-[#77be44] hover:underline">community</a></li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </main>
      </div>
    </>
  );
} 