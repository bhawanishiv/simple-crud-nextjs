'use client';

import React, { useState, ReactNode } from 'react';
import AiCredentialsContext from './ai-credentials.context';

type TValues = { [key: string]: string | undefined };

const AiCredentialsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [values, _setValues] = useState<TValues>({ model: '' });

  const updateValues = (newValues: TValues) => {
    _setValues((prevValues) => ({
      ...prevValues,
      ...newValues,
    }));
  };

  const setValues = (newValues: TValues) => {
    _setValues(newValues);
  };

  return (
    <AiCredentialsContext.Provider value={{ values, updateValues, setValues }}>
      {children}
    </AiCredentialsContext.Provider>
  );
};

export default AiCredentialsProvider;
