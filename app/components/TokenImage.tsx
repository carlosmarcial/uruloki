import Image from 'next/image';
import { useState, useEffect } from 'react';

interface TokenImageProps {
  src?: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

const TokenImage: React.FC<TokenImageProps> = ({ src, alt, width, height, className }) => {
  const [error, setError] = useState(false);
  
  // Default token image URL
  const defaultTokenImage = '/default-token-image.svg';

  // Process and normalize image URLs
  const processImageUrl = (url: string): string => {
    if (!url) return defaultTokenImage;

    try {
      // Handle CoinGecko URLs
      if (url.includes('coingecko')) {
        return url.replace('/thumb/', '/large/');
      }

      // Handle IPFS URLs
      if (url.includes('ipfs://')) {
        const ipfsHash = url.replace('ipfs://', '');
        // Use a reliable IPFS gateway
        return `https://ipfs.io/ipfs/${ipfsHash}`;
      }

      // If the URL is already using an IPFS gateway but fails, try an alternative
      if (url.includes('ipfs') || url.includes('pinata') || url.includes('nftstorage')) {
        const ipfsHash = url.split('/ipfs/')[1];
        if (ipfsHash) {
          return `https://ipfs.io/ipfs/${ipfsHash}`;
        }
      }

      return url;
    } catch (e) {
      console.error('Error processing image URL:', e);
      return defaultTokenImage;
    }
  };

  // Create a blob URL from the image for cross-origin images
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const handleImageError = async () => {
    const imageUrl = processImageUrl(src || '');
    
    if (!error) {
      try {
        // Try to fetch the image and create a blob URL
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (e) {
        console.error('Error fetching image:', e);
        setError(true);
      }
    } else {
      setError(true);
    }
  };

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  return (
    <div 
      style={{ width: width, height: height }} 
      className={`relative overflow-hidden ${className}`}
    >
      <Image
        src={error ? defaultTokenImage : (blobUrl || processImageUrl(src || ''))}
        alt={alt}
        fill
        sizes={`${Math.max(width, height)}px`}
        className="object-contain rounded-full"
        quality={100}
        onError={handleImageError}
        priority={true}
        unoptimized={!!blobUrl} // Skip optimization for blob URLs
      />
    </div>
  );
};

export default TokenImage;
