import Image from 'next/image';
import { useState } from 'react';

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

  // Convert thumb URLs to larger size images
  const getHighResUrl = (url: string) => {
    if (!url) return defaultTokenImage;
    // Replace /thumb/ with /large/ in CoinGecko URLs for higher resolution
    return url.replace('/thumb/', '/large/');
  };

  return (
    <div 
      style={{ width: width, height: height }} 
      className={`relative overflow-hidden ${className}`}
    >
      <Image
        src={error ? defaultTokenImage : getHighResUrl(src || '')}
        alt={alt}
        fill
        sizes={`${Math.max(width, height)}px`}
        className="object-contain rounded-full"
        quality={100}
        onError={() => setError(true)}
        priority={true}
      />
    </div>
  );
};

export default TokenImage;
