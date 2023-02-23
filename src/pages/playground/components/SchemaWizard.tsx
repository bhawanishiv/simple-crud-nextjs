import React, { useEffect, useState } from 'react';
import z, { ZodError } from 'zod';
import JSONInput from 'react-json-editor-ajrm';
//@ts-ignore
import locale from 'react-json-editor-ajrm/locale/en';
import _ from 'lodash';

import LoadingButton from '@mui/lab/LoadingButton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';

import CloseIcon from '@mui/icons-material/Close';

import { FieldTypeEnum, RelatedTypeEnum } from '@/interfaces/DynamicSchema';

import api from '@/services/api';

const SchemaWizardSchema = z.object({
  schema: z.object({
    title: z.string().trim(),
    name: z
      .string()
      .trim()
      .transform((v) => _.capitalize(_.camelCase(v))),
  }),
  fields: z.array(
    z.object({
      title: z.string().trim(),
      name: z.string().trim().optional().transform(_.camelCase),
      type: FieldTypeEnum,
      unique: z.boolean().optional(),
      required: z.boolean().optional(),
      relatedSchema: z.string().trim().optional(),
      relationType: RelatedTypeEnum.optional(),
      options: z.array(z.string().trim()).optional(),
      default: z
        .union([
          z.string().trim(),
          z.null(),
          z.boolean(),
          z.number(),
          z.array(z.string().trim()),
        ])
        .optional(),
    })
  ),
});

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
  const [loading, setLoading] = useState(false);

  const submitSchemaForm = async () => {
    try {
      //
      setLoading(true);
      SchemaWizardSchema.parse(finalValue);

      const res = await api.request(
        '/api/schemas/playground',
        'POST',
        finalValue
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data?.message);

      if (!data) throw new Error();
      await onSuccess(data);
    } catch (e: any) {
      if (e instanceof ZodError) {
        setErrorMessage(e.errors[0].message);
      } else setErrorMessage(e.message || 'Something is wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (e: any) => {
    if (loading) return;
    onClose(e);
  };

  const handleInputChange = (params: any) => {
    setErrorMessage(params.error ? 'Something is wrong' : '');
    setFinalValue(params.jsObject);
    try {
      SchemaWizardSchema.parse(params.jsObject);
    } catch (e: any) {
      if (e instanceof ZodError) {
        setErrorMessage(e.errors[0].message);
      } else setErrorMessage(e.message || 'Something is wrong');
    }
  };

  const renderSchemaWizard = () => {
    return (
      <form>
        <Dialog onClose={handleClose} open={open} fullWidth maxWidth="xl">
          <DialogTitle>
            Schema wizard
            {onClose ? (
              <IconButton
                disabled={loading}
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
              loading={loading}
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
        setLoading(false);
      }
    } catch (e) {}
  }, [open, text]);

  return renderSchemaWizard();
};

export default SchemaWizard;
