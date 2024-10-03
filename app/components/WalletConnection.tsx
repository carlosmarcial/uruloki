import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

const WalletConnection: React.FC = () => {
  const { address, isConnected } = useAccount();

  return (
    <div>
      <ConnectButton />
      {isConnected ? (
        <p>Connected: {address}</p>
      ) : (
        <p>Please connect your wallet to start trading.</p>
      )}
    </div>
  );
};

export default WalletConnection;