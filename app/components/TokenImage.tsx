import React from 'react';

interface TokenImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | null | undefined;
  fallbackSrc?: string;
}

const TokenImage: React.FC<TokenImageProps> = ({ 
  src, 
  fallbackSrc = '/path/to/default-token-image.png', 
  alt,
  width = 24,
  height = 24,
  className = 'rounded-full',
  ...props 
}) => {
  const [imgSrc, setImgSrc] = React.useState(src || fallbackSrc);

  const handleError = () => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  };

  if (!src) {
    return null;
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={handleError}
      width={width}
      height={height}
      className={className}
      {...props}
    />
  );
};

export default TokenImage;
