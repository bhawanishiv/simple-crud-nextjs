import React, { useEffect, useMemo, useState } from 'react';
import _ from 'lodash';
import cx from 'classnames';

import { Controller, SubmitHandler, useForm } from 'react-hook-form';

import Autocomplete from '@mui/material/Autocomplete';
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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import api from '@/services/api';
import { IDynamicSchemaField } from '@/interfaces/DynamicSchema';
import { Typography } from '@mui/material';

const getRoles = () => {
  return [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'MEMBER', label: 'Member' },
  ];
};

type DropdownItems = {
  [key: string]: () => { value: string; label: string }[];
};
const DROPDOWN_ITEMS: DropdownItems = {
  role: getRoles,
};

type AddOrUpdateSchemaItemProps = {
  schemaName: string;
  schemaId: string;
  fields: IDynamicSchemaField[];
  item?: any;
  open: boolean;
  onClose: (e: any) => void;
  onSuccess: (data: any) => void | Promise<void>;
};

const AddOrUpdateSchemaItem: React.FC<AddOrUpdateSchemaItemProps> = (props) => {
  const { schemaName, schemaId, fields, item, open, onClose, onSuccess } =
    props;

  const { formState, control, register, setError, watch, reset, handleSubmit } =
    useForm({
      mode: 'all',
    });

  const { errors, isSubmitting } = formState;

  const [optionsSearch, setOptionsSearch] = useState({});
  const [optionsByRefName, setOptionsByRefName] = useState({});

  console.log(`optionsSearch->`, optionsSearch);
  console.log(`optionsByRefName->`, optionsByRefName);

  const handleSchemasInputChange =
    (field: IDynamicSchemaField) => (e: any, value: string) => {
      const newSearch = { ...optionsSearch };
      newSearch[field.name] = value;
      setOptionsSearch(newSearch);

      _.debounce(async () => {
        const res = await api.request(
          `/api/schemas/${schemaName}/details`,
          'POST',
          {
            limit: 100,
            skip: 0,
            query: value,
          }
        );
        const data = await res.json();
        if (data) {
          const newOptions = { ...optionsByRefName };
          newOptions[field.name] = data.items;
          setOptionsByRefName(newOptions);
        }
      }, 250)();
    };

  const handleAddOrUpdateItem: SubmitHandler<any> = async (values) => {
    try {
      const payload = {
        ...values,
      };

      console.log(`payload->`, payload);

      if (item) {
        payload.id = item.id;
      }

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
    if (
      !DROPDOWN_ITEMS[field.name] ||
      typeof DROPDOWN_ITEMS[field.name] !== 'function'
    )
      return null;

    const items = DROPDOWN_ITEMS[field.name]();
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
        {items.map((items) => {
          return (
            <MenuItem key={items.value} value={items.value}>
              {items.label}
            </MenuItem>
          );
        })}
      </TextField>
    );
  };

  const renderRelatedFieldInput = (field: IDynamicSchemaField) => {
    return (
      <div>
        <Controller
          control={control}
          name={field.name}
          rules={{
            required: field.required
              ? `Please provide ${field.title}`
              : undefined,
          }}
          render={({ field: { value, onChange, ref } }) => {
            return (
              <Autocomplete
                options={optionsByRefName[field.name] || []}
                getOptionLabel={(item) => JSON.stringify(item)}
                inputValue={optionsSearch[field.name] || ''}
                onInputChange={handleSchemasInputChange(field)}
                value={value}
                onChange={(event, newValue) => {
                  if (newValue && typeof newValue === 'object') {
                    onChange(newValue.id);
                  } else {
                    onChange(newValue);
                  }
                }}
                renderInput={(params) => {
                  return (
                    <TextField
                      {...params}
                      variant="filled"
                      label={field.title}
                      required={field.required}
                      helperText={
                        errors[field.name]
                          ? (errors[field.name].message as React.ReactNode)
                          : ''
                      }
                      error={Boolean(errors[field.name])}
                    />
                  );
                }}
              />
            );
          }}
        />
      </div>
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
        return renderRelatedFieldInput(field);
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
            <Button variant="outlined" type="submit" disableElevation fullWidth>
              Save
            </Button>
          </div>
        </form>
      </Drawer>
    );
  };

  useEffect(() => {
    if (open && item) {
      const { id, ...restItem } = item;
      reset({
        ...restItem,
      });
    } else {
      reset({});
    }
  }, [item, open]);

  return renderAddOrUpdateSchemaItem();
};

export default AddOrUpdateSchemaItem;
