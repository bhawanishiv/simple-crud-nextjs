import React from 'react';
import cx from 'classnames';

import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';

import CloseIcon from '@mui/icons-material/Close';

import api from '@/services/api';

type DeleteItemDialogProps = {
  schemaId: string;
  open: boolean;
  item: any;
  onDeleteSuccess: (item: any) => void;
  onClose: (item?: any) => void;
};

const DeleteItemDialog: React.FC<DeleteItemDialogProps> = (props) => {
  const { item, schemaId, open, onClose, onDeleteSuccess } = props;

  const handleClose = () => {
    onClose();
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await api.request(`/api/schemas/${schemaId}`, 'DELETE', {
        id: item.id,
      });

      const data = await res.json();

      if (res.ok) {
        onDeleteSuccess(item);
      }
    } catch (e) {}
  };

  const renderDeleteItemDialog = () => {
    return (
      <Dialog onClose={handleClose} open={open}>
        <DialogTitle>Delete confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are your sure, you want to delete this item?
            {onClose ? (
              <IconButton
                aria-label="close"
                onClick={onClose}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <CloseIcon />
              </IconButton>
            ) : null}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return renderDeleteItemDialog();
};

export default DeleteItemDialog;
