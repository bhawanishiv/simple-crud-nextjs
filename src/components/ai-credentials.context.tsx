import { createContext } from 'react';

const AiCredentialsContext = createContext<
  | {
      values: { [key: string]: string | undefined };
      updateValues: (values: { [key: string]: string | undefined }) => void;
      setValues: (values: { [key: string]: string | undefined }) => void;
    }
  | undefined
>(undefined);

export default AiCredentialsContext;
