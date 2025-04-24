import React from 'react';

import { cn } from '@/lib/utils';

type DialogProps = {
  open: boolean;

  children?: React.ReactNode;
  onClose?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

const Dialog: React.FC<DialogProps> = (props) => {
  const { open, onClose, children } = props;

  const renderDialog = () => {
    return (
      <dialog open={open} className={cn('dialog', open && 'open')}>
        <div className="dialog__content">
          <div className="actions__container">
            <div />
            <button className="app__button-text" onClick={onClose}>
              Close
            </button>
          </div>
          {children}
        </div>
      </dialog>
    );
  };

  return renderDialog();
};

export default Dialog;
