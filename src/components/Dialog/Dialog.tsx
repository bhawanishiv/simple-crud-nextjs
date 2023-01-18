import React from 'react';

import cx from 'classnames';

type DialogProps = {
  open: boolean;

  children?: React.ReactNode;
  onClose?: (event: any) => void;
};

const Dialog: React.FC<DialogProps> = (props) => {
  const { open, onClose, children } = props;

  const renderDialog = () => {
    return (
      <dialog open={open} className={cx('dialog', open && 'open')}>
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
