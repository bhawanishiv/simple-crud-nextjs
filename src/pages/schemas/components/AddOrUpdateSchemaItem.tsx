import React, { useEffect, useState, useCallback } from 'react';
import _ from 'lodash';
import { cn } from '@/lib/utils';

import { Controller, SubmitHandler, useForm } from 'react-hook-form';

import LoadingButton from '@mui/lab/LoadingButton';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import api from '@/services/api';
import { IDynamicSchemaField } from '@/interfaces/DynamicSchema';

import AddOrUpdateRelatedItemDialog from './AddOrUpdateRelatedItemDialog';

type AddOrUpdateSchemaItemProps = {
  schemaName: string;
  schemaId: string;
  fields: IDynamicSchemaField[];
  item?: any;
  open: boolean;
  onClose: (e: any) => void;
  onSuccess: (data?: any) => void | Promise<void>;
};

const AddOrUpdateSchemaItem: React.FC<AddOrUpdateSchemaItemProps> = (props) => {
  const { schemaName, schemaId, fields, item, open, onClose, onSuccess } =
    props;

  const { formState, control, register, setError, watch, reset, handleSubmit } =
    useForm({
      mode: 'all',
    });

  const { errors, isSubmitting } = formState;

  const [relatedField, setRelatedField] = useState<IDynamicSchemaField | null>(
    null
  );

  const [localRefItems, setLocalRefItems] = useState<{ [key: string]: any }>(
    {}
  );

  const handleUpdatedRelatedField = (field: IDynamicSchemaField) => () => {
    setRelatedField(field);
  };

  const setLocalRefValues = useCallback(
    (currentItem: any) => {
      let itemsObj: { [key: string]: any } = {};

      for (let field of fields.filter((f) => f.type === 'related')) {
        itemsObj[field.name] = currentItem[field.name];
      }

      setLocalRefItems(itemsObj);
    },
    [fields]
  );

  const handleRelatedFieldUpdateSuccess = (
    field: IDynamicSchemaField,
    data: null | string | string[]
  ) => {
    // onSuccess();
    let newLocalRefItems: { [key: string]: any } = {
      ...localRefItems,
    };

    newLocalRefItems[field.name] = data;
    setLocalRefItems(newLocalRefItems);
    setRelatedField(null);
  };

  const handleRelatedDialogClose = () => {
    setRelatedField(null);
  };

  const getRefItemCount = (field: IDynamicSchemaField) => {
    if (field.relationType == 'hasOne') {
      return localRefItems[field.name] ? ' (1)' : '';
    }

    const content = localRefItems[field.name];
    if (!content || !content.length) return '';

    return ` (${content.length})`;
  };

  const handleAddOrUpdateItem: SubmitHandler<any> = async (values) => {
    try {
      let payload = {
        ...values,
      };

      if (item) {
        payload.id = item.id;
      }

      const anyPendingRefItemLeft = fields.filter((f) => {
        if (f.type === 'related' && f.required) {
          if (!localRefItems[f.name]) return true;

          if (f.relationType === 'hasMany') {
            return localRefItems[f.name].length === 0;
          }
          return false;
        }
        return false;
      });
      if (anyPendingRefItemLeft.length) {
        setError(fields[0].name, {
          type: 'custom',
          message: `${anyPendingRefItemLeft[0].title} isn't provided`,
        });
        return;
      }

      payload = {
        ...payload,
        ...localRefItems,
      };

      const res = await api.request(
        `/api/schemas/${schemaId}`,
        item ? 'PATCH' : 'POST',
        payload
      );
      const data = await res.json();

      if (!res.ok) {
        setError(fields[0].name, {
          type: 'custom',
          message: data.message || 'Something went wrong',
        });
        return;
      }

      await onSuccess(data);
    } catch (e) {
      //
    }
  };

  const handleClose = (e: any) => {
    typeof onClose === 'function' && onClose(e);
  };

  const renderDropdownFieldInput = (field: IDynamicSchemaField) => {
    if (!field.options) return null;

    const items = field.options;
    let defaultValue =
      item && typeof item[field.name] !== 'undefined'
        ? item[field.name]
        : undefined;

    if (
      typeof defaultValue === 'undefined' &&
      typeof field.default !== 'undefined'
    ) {
      defaultValue = field.default;
    }

    return (
      <TextField
        id="field-type"
        label={field.title}
        required={field.required}
        variant="filled"
        select
        SelectProps={{
          defaultValue,
        }}
        {...register(field.name, {
          required: field.required ? `Please select ${field.title}` : undefined,
        })}
        fullWidth
        helperText={
          errors[field.name]
            ? (errors[field.name]?.message as React.ReactNode)
            : ''
        }
        error={Boolean(errors[field.name])}
      >
        {items.map((item) => {
          return (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          );
        })}
      </TextField>
    );
  };

  const renderFormField = (field: IDynamicSchemaField, index: number) => {
    switch (field.type) {
      case 'number': {
        return (
          <TextField
            type="number"
            variant="filled"
            fullWidth
            required={field.required}
            label={field.title}
            placeholder={`Enter ${field.title}`}
            {...register(field.name, {
              required: field.required
                ? `Please provide ${field.title}`
                : undefined,
            })}
            helperText={
              errors[field.name]
                ? (errors[field.name]?.message as React.ReactNode)
                : ''
            }
            error={Boolean(errors[field.name])}
          />
        );
      }
      case 'date': {
        return (
          <Controller
            control={control}
            name={field.name}
            rules={{
              required: field.required
                ? `Please provide ${field.title}`
                : undefined,
            }}
            render={({ field: { value, ref, onChange } }) => {
              return (
                <DatePicker
                  label={field.title}
                  value={value}
                  onChange={(newValue) => {
                    onChange(newValue?.toISOString());
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="filled"
                      fullWidth
                      required={field.required}
                      helperText={
                        errors[field.name]
                          ? (errors[field.name]?.message as React.ReactNode)
                          : ''
                      }
                      error={Boolean(errors[field.name])}
                    />
                  )}
                />
              );
            }}
          />
        );
      }
      case 'list': {
        return renderDropdownFieldInput(field);
      }
      case 'related': {
        return (
          <div>
            <Button onClick={handleUpdatedRelatedField(field)}>
              {item ? 'Update' : 'Set'} {field.title}{' '}
              {field.required ? '*' : ''}
              {getRefItemCount(field)}
            </Button>
          </div>
        );
      }

      case 'text':
      case 'multi-text':
      default: {
        return (
          <TextField
            multiline={field.type === 'multi-text'}
            variant="filled"
            fullWidth
            required={field.required}
            label={field.title}
            placeholder={`Enter ${field.title}`}
            {...register(field.name, {
              required: field.required
                ? `Please provide ${field.title}`
                : undefined,
            })}
            helperText={
              errors[field.name]
                ? (errors[field.name]?.message as React.ReactNode)
                : ''
            }
            error={Boolean(errors[field.name])}
          />
        );
      }
    }
  };

  const renderFormFields = () => {
    return fields.map((field, i) => {
      return (
        <div key={field.id} className="py-2">
          {renderFormField(field, i)}
        </div>
      );
    });
  };

  const renderAddOrUpdateSchemaItem = () => {
    return (
      <>
        <AddOrUpdateRelatedItemDialog
          schemaId={schemaId}
          open={Boolean(relatedField)}
          currentItem={item && relatedField ? localRefItems : undefined}
          field={relatedField}
          onClose={handleRelatedDialogClose}
          onSuccess={handleRelatedFieldUpdateSuccess}
        />
        <Drawer anchor="right" open={open} onClose={handleClose}>
          <form
            noValidate
            className="p-6"
            onSubmit={handleSubmit(handleAddOrUpdateItem)}
          >
            <div className="flex flex-col flex-1">
              <div>
                <Typography>
                  {item ? 'Update ' : 'Add a '}
                  {_.lowerCase(schemaName)}
                </Typography>
              </div>
              {renderFormFields()}
            </div>
            <div className="flex items-center py-2">
              <LoadingButton
                variant="outlined"
                type="submit"
                disableElevation
                fullWidth
                loading={isSubmitting}
              >
                Save
              </LoadingButton>
            </div>
          </form>
        </Drawer>
      </>
    );
  };

  useEffect(() => {
    if (open && item) {
      const { id, ...restItem } = item;
      reset({
        ...restItem,
      });
      setLocalRefValues(restItem);
    } else {
      reset({});
      setLocalRefItems({});
    }
  }, [item, reset, setLocalRefValues, open]);

  return renderAddOrUpdateSchemaItem();
};

export default AddOrUpdateSchemaItem;
