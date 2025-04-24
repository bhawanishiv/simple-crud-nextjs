import React, { useState, useEffect } from 'react';

const LoadingText = ({
  children,
  isLoading,
}: {
  children: string;
  isLoading?: boolean; // Optional prop to control loading state
}) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length < 3 ? prev + '.' : ''));
      }, 500);

      return () => clearInterval(interval);
    } else {
      setDots('');
    }
  }, [isLoading]);

  return (
    <span>
      {children}
      {dots}
    </span>
  );
};

export default LoadingText;
