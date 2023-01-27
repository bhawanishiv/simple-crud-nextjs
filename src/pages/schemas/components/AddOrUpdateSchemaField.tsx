import React, { useEffect, useMemo } from 'react';
import _ from 'lodash';
import cx from 'classnames';

import { SubmitHandler, useForm } from 'react-hook-form';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';

import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';

import { IDynamicSchemaField } from '@/interfaces/DynamicSchema';
import api from '@/services/api';

const fieldTypes = [
  { label: 'Text', value: 'text' },
  { label: 'Multi-line Text', value: 'multi-text' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Date', value: 'date' },
  { label: 'List', value: 'list' },
];

type AddOrUpdateSchemaFieldProps = {
  schemaId: string;
  field?: IDynamicSchemaField;
  open: boolean;
  onClose: (e: any) => void;
  onSuccess: (data: IDynamicSchemaField) => void | Promise<void>;
};

const AddOrUpdateSchemaField: React.FC<AddOrUpdateSchemaFieldProps> = (
  props
) => {
  const { schemaId, field, open, onClose, onSuccess } = props;

  const { formState, register, setError, watch, reset, handleSubmit } = useForm(
    {
      mode: 'all',
    }
  );

  const { errors, isSubmitting } = formState;

  const fieldName = field ? field.name : _.camelCase(watch('title'));

  const handleAddOrUpdateField: SubmitHandler<any> = async (values) => {
    try {
      const payload = {
        ...values,
      };

      if (field) {
        payload.id = field.id;
      } else {
        payload.name = fieldName;
      }

      const res = await api.request(
        `/api/schemas/${schemaId}/fields`,
        field ? 'PATCH' : 'POST',
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
              <Chip label={fieldName || 'field name'} />
            </div>
            <div className="py-2">
              <TextField
                variant="filled"
                label="Field title"
                placeholder="e.g. First Name"
                {...register('title', {
                  required: 'Please provide the field title',
                  maxLength: {
                    value: 200,
                    message: 'Field title is too big',
                  },
                })}
                helperText={
                  errors.title ? (errors.title.message as React.ReactNode) : ''
                }
                error={Boolean(errors.title)}
              />
            </div>
            <div className="py-2">
              <TextField
                id="field-type"
                label="Field type"
                variant="filled"
                select
                SelectProps={{ defaultValue: field ? field.type : 'text' }}
                disabled={Boolean(field)}
                {...register('type', {
                  required: 'Please select the field type',
                })}
                fullWidth
                helperText={
                  errors.type ? (errors.type.message as React.ReactNode) : ''
                }
                error={Boolean(errors.type)}
              >
                {fieldTypes.map((fieldType) => {
                  return (
                    <MenuItem key={fieldType.value} value={fieldType.value}>
                      {fieldType.label}
                    </MenuItem>
                  );
                })}
              </TextField>
            </div>
            <div className="py-2">
              <TextField
                label="Default value"
                variant="filled"
                {...register('default', {})}
                helperText={
                  errors.default
                    ? (errors.default.message as React.ReactNode)
                    : ''
                }
                error={Boolean(errors.default)}
              />
            </div>
            <div className="">
              <FormControlLabel
                {...register('required')}
                control={<Checkbox defaultChecked={field && field.required} />}
                disabled={Boolean(field)}
                label="Required"
              />
              <FormControlLabel
                {...register('unique')}
                disabled={Boolean(field)}
                control={<Checkbox defaultChecked={field && field.unique} />}
                label="Unique"
              />
            </div>
          </div>
          <div className="flex items-center py-2">
            <Button variant="outlined" type="submit" disableElevation fullWidth>
              Save
            </Button>
          </div>
        </form>
      </Drawer>
    );
  };

  useEffect(() => {
    if (open && field) {
      reset({
        title: field.title,
        type: field.type,
        default: field.default,
        required: field.required,
        unique: field.unique,
      });
    } else {
      reset({
        title: '',
        type: 'text',
        default: undefined,
        required: undefined,
        unique: undefined,
      });
    }
  }, [field, open]);

  return renderAddOrUpdateSchemaField();
};

export default AddOrUpdateSchemaField;
