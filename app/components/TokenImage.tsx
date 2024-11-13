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
  
  // Default token image URL (make sure this exists in your public folder)
  const defaultTokenImage = '/default-token-image.svg';

  return (
    <Image
      src={error || !src ? defaultTokenImage : src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setError(true)}
      unoptimized // Add this if you're having issues with image optimization
    />
  );
};

export default TokenImage;
