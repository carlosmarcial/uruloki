import React, { useMemo } from 'react';

interface ButtonProps {
  data: any; // Replace 'any' with a more specific type if possible
}

const Button: React.FC<ButtonProps> = ({ data }) => {
  const processedData = useMemo(() => {
    // Perform any heavy calculations here
    return "Processed " + data; // Replace with actual processing logic
  }, [data]);

  return (
    <button>{processedData}</button>
  );
}

export default Button;
