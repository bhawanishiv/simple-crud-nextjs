import React, { useEffect } from 'react';
import _ from 'lodash';

import { SubmitHandler, useForm } from 'react-hook-form';

import Drawer from '@mui/material/Drawer';
import LoadingButton from '@mui/lab/LoadingButton';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';

import { IDynamicSchema } from '@/interfaces/DynamicSchema';
import api from '@/services/api';

type AddOrUpdateSchemaProps = {
  schema: IDynamicSchema;
  open: boolean;
  onClose: (e: any) => void;
  onSuccess: (data: IDynamicSchema) => void | Promise<void>;
};

const AddOrUpdateSchema: React.FC<AddOrUpdateSchemaProps> = (props) => {
  const { schema, open, onClose, onSuccess } = props;

  const { formState, register, setError, watch, reset, handleSubmit } = useForm(
    {
      mode: 'all',
    }
  );

  const { errors, isSubmitting } = formState;

  const schemaName = schema
    ? schema.name
    : _.capitalize(_.camelCase(watch('title')));

  const handleAddOrUpdateField: SubmitHandler<any> = async (values) => {
    try {
      const payload = {
        ...values,
      };

      if (schema) {
        payload.id = schema.id;
      } else {
        payload.name = schemaName;
      }

      const res = await api.request(
        `/api/schemas/`,
        schema ? 'PATCH' : 'POST',
        payload
      );
      if (!res.ok) {
        // setError("")
        return;
      }

      const data = await res.json();
      await onSuccess(data);
    } catch (e) {
      //
    }
  };

  const handleClose = (e: any) => {
    typeof onClose === 'function' && onClose(e);
  };

  const renderAddOrUpdateSchemaField = () => {
    return (
      <Drawer anchor="right" open={open} onClose={handleClose}>
        <form className="p-6" onSubmit={handleSubmit(handleAddOrUpdateField)}>
          <div className="flex flex-col flex-1">
            <div>
              <Chip label={schemaName || 'schema name'} />
            </div>
            <div className="py-2">
              <TextField
                variant="filled"
                label="Schema title"
                placeholder="e.g. User (singular)"
                {...register('title', {
                  required: 'Please provide the schema title',
                  maxLength: {
                    value: 200,
                    message: 'Schema title is too big',
                  },
                })}
                helperText={
                  errors.title ? (errors.title.message as React.ReactNode) : ''
                }
                error={Boolean(errors.title)}
              />
            </div>
          </div>
          <div className="flex items-center py-2">
            <LoadingButton
              variant="outlined"
              type="submit"
              loading={isSubmitting}
              disableElevation
              fullWidth
            >
              Save
            </LoadingButton>
          </div>
        </form>
      </Drawer>
    );
  };

  useEffect(() => {
    if (open && schema) {
      reset({
        title: schema.title,
        name: schema.name,
      });
    } else {
      reset({
        title: '',
        name: '',
      });
    }
  }, [schema, reset, open]);

  return renderAddOrUpdateSchemaField();
};

export default AddOrUpdateSchema;
