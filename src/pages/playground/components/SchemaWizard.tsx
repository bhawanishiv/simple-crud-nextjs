import React, { useEffect, useState } from 'react';

import JSONInput from 'react-json-editor-ajrm';
//@ts-ignore
import locale from 'react-json-editor-ajrm/locale/en';

import LoadingButton from '@mui/lab/LoadingButton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';

import CloseIcon from '@mui/icons-material/Close';

import api from '@/services/api';

type SchemaWizardProps = {
  text?: string;
  open: boolean;
  onClose: (e: any) => void;
  onSuccess: (data: any) => void | Promise<void>;
};

const SchemaWizard: React.FC<SchemaWizardProps> = (props) => {
  const { text, open, onClose, onSuccess } = props;

  const [initialValue, setInitialValue] = useState({});
  const [finalValue, setFinalValue] = useState(initialValue);
  const [errorMessage, setErrorMessage] = useState('');

  const submitSchemaForm = async () => {
    try {
      //
      console.log(`finalValue->`, finalValue);
      const res = await api.request(
        '/api/schemas/playground',
        'POST',
        finalValue
      );
      console.log(`res->`, res);
      const data = await res.json();
      console.log(`data->`, data);
      if (!res.ok) throw new Error(data?.message);

      if (!data) throw new Error();
      await onSuccess(data);
    } catch (e: any) {
      //
      console.log(`e->`, e);
      setErrorMessage(e?.message || 'Something went wrong');
    }
  };

  const handleClose = (e: any) => {
    onClose(e);
  };

  const handleInputChange = (params: any) => {
    console.log(params);
    setErrorMessage(params.error ? 'Something is wrong' : '');
    setFinalValue(params.jsObject);
  };

  const renderSchemaWizard = () => {
    return (
      <form>
        <Dialog onClose={handleClose} open={open} fullWidth maxWidth="xl">
          <DialogTitle>
            Schema wizard
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
          </DialogTitle>
          <DialogContent>
            <Typography className="text-sm pb-2" color="red">
              {errorMessage}
            </Typography>
            <JSONInput
              style={{ body: { fontSize: '16px' } }}
              width="100%"
              id="a_unique_id"
              placeholder={initialValue}
              // colors      = { darktheme }
              locale={locale}
              height="550px"
              onChange={handleInputChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <LoadingButton
              onClick={submitSchemaForm}
              autoFocus
              disabled={Boolean(errorMessage)}
            >
              Execute
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </form>
    );
  };

  useEffect(() => {
    try {
      if (open && text) {
        const parsed = JSON.parse(text);
        setInitialValue(parsed);
        setFinalValue(parsed);
      } else {
        setInitialValue({});
        setFinalValue({});
        setErrorMessage('');
      }
    } catch (e) {}
  }, [open, text]);

  return renderSchemaWizard();
};

export default SchemaWizard;
