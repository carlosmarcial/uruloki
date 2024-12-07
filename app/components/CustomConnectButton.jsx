'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

const CustomConnectButton = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button 
                    onClick={openConnectModal} 
                    className="bg-[#77be44] hover:bg-[#69aa3b] text-white font-bold py-3 px-6 rounded-sm text-base"
                    style={{ minWidth: '152px' }}
                  >
                    Select Wallet
                  </button>
                );
              }

              return (
                <button 
                  onClick={openAccountModal}
                  className="bg-[#77be44] hover:bg-[#69aa3b] text-white font-bold py-3 px-6 rounded-sm text-base"
                  style={{ minWidth: '152px' }}
                >
                  {account.displayName}
                </button>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default CustomConnectButton; 