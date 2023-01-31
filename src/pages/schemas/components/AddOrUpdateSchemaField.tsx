import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import cx from 'classnames';

import { SubmitHandler, Controller, useForm } from 'react-hook-form';

import Autocomplete from '@mui/material/Autocomplete';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
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

import { IDynamicSchemaField } from '@/interfaces/DynamicSchema';
import api from '@/services/api';

import { RelatedIcon, relationshipItems } from './relatedicons';

const fieldTypes = [
  { label: 'Text', value: 'text' },
  { label: 'Multi-line Text', value: 'multi-text' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Date', value: 'date' },
  { label: 'List', value: 'list' },
  { label: 'Relationship', value: 'relationship' },
];

type AddOrUpdateSchemaFieldProps = {
  schemaId: string;
  schemaName: string;
  field?: IDynamicSchemaField;
  open: boolean;
  onClose: (e: any) => void;
  onSuccess: (data: IDynamicSchemaField) => void | Promise<void>;
};

const AddOrUpdateSchemaField: React.FC<AddOrUpdateSchemaFieldProps> = (
  props
) => {
  const { schemaId, schemaName, field, open, onClose, onSuccess } = props;

  const { formState, control, register, setError, watch, reset, handleSubmit } =
    useForm({
      mode: 'all',
    });

  const [relationType, setRelationType] = useState('hasOne');
  const [schemaSearch, setSchemaSearch] = useState('');
  const [schemasOptions, setSchemasOptions] = useState<
    { title: string; id: string }[]
  >([]);

  const relationFieldType = relationshipItems.find(
    (r) => r.type === relationType
  );

  const { errors, isSubmitting } = formState;

  const fieldName = field ? field.name : _.camelCase(watch('title'));
  const relatedFieldTo = _.camelCase(watch('relatedFieldTo'));

  const fieldType = watch('type');

  const handleSchemasInputChange = (e: any, value: string) => {
    setSchemaSearch(value);
    _.debounce(async () => {
      const res = await api.request(
        `/api/schemas?query=${value}&limit=10&skip=0`
      );
      const data = await res.json();
      if (data) setSchemasOptions(data.schemas);
    }, 250)();
  };

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

  const handleRelationTypeChange = (relation: any) => (e: any) => {
    const { type } = relation;
    setRelationType(type);
  };

  const renderDefaultFieldOption = () => {
    if (fieldType === 'relationship') return null;
    return (
      <div className="py-2">
        <TextField
          label="Default value"
          variant="filled"
          {...register('default', {})}
          helperText={
            errors.default ? (errors.default.message as React.ReactNode) : ''
          }
          error={Boolean(errors.default)}
        />
      </div>
    );
  };

  const renderRelationDescription = () => {
    if (!relationFieldType) return null;

    if (relationFieldType.twoWay) {
      return (
        <div className="py-2">
          <div className="flex items-center gap-2">
            <Typography component={'span'}>{fieldName}</Typography>
            <Typography component={'span'} color="primary">
              {relationFieldType.label}
            </Typography>
            {relationFieldType.twoWay && (
              <Typography component={'span'}>{relatedFieldTo}</Typography>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="py-2">
        <div className="flex items-center gap-2">
          <Typography component={'span'}>{schemaName}</Typography>
          <Typography component={'span'} color="primary">
            {relationFieldType.label}
          </Typography>
          <Typography component={'span'}>
            {schemasOptions?.[watch('relatedSchemaName')]?.title}
          </Typography>
        </div>
      </div>
    );
  };

  const renderRelationFieldOption = () => {
    if (fieldType !== 'relationship') return null;

    return (
      <>
        <div className="py-2">
          <ButtonGroup>
            {relationshipItems.map((relType, i) => {
              return (
                <Button
                  color={
                    relType.type === relationType ? 'secondary' : 'primary'
                  }
                  sx={{
                    fontWeight: 700,
                  }}
                  key={i}
                  onClick={handleRelationTypeChange(relType)}
                >
                  <RelatedIcon name={relType.type} />
                </Button>
              );
            })}
          </ButtonGroup>
        </div>

        <div className="py-2">
          <Controller
            control={control}
            name="relatedSchemaName"
            rules={{
              required: 'Please provided the related schema name',
            }}
            render={({ field: { value, onChange, ref } }) => {
              return (
                <Autocomplete
                  options={schemasOptions}
                  getOptionLabel={(item) => item.title}
                  inputValue={schemaSearch}
                  onInputChange={handleSchemasInputChange}
                  value={value}
                  onChange={(event, newValue) => {
                    onChange(newValue);
                  }}
                  renderInput={(params) => {
                    return (
                      <TextField
                        {...params}
                        variant="filled"
                        label="Related to"
                        helperText={
                          errors.relatedSchemaName
                            ? (errors.relatedSchemaName
                                .message as React.ReactNode)
                            : ''
                        }
                        error={Boolean(errors.relatedSchemaName)}
                      />
                    );
                  }}
                />
              );
            }}
          />
        </div>
        {relationFieldType && relationFieldType.twoWay && (
          <div className="py-2">
            <TextField
              variant="filled"
              fullWidth
              label="Related field"
              placeholder="Related to"
              {...register('relatedFieldTo', {
                required: 'Please provide the related field',
                maxLength: {
                  value: 200,
                  message: 'Field title is too big',
                },
              })}
              helperText={
                errors.relatedFieldTo
                  ? (errors.relatedFieldTo.message as React.ReactNode)
                  : ''
              }
              error={Boolean(errors.relatedFieldTo)}
            />
          </div>
        )}
        {renderRelationDescription()}
      </>
    );
  };

  const renderFieldOptions = () => {
    return (
      <>
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
        {renderDefaultFieldOption()}
        {renderRelationFieldOption()}
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
      </>
    );
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
                fullWidth
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
            {renderFieldOptions()}
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
