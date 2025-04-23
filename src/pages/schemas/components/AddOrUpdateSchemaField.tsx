import React, { useEffect, useState } from 'react';
import _ from 'lodash';

import { SubmitHandler, Controller, useForm } from 'react-hook-form';

import Autocomplete from '@mui/material/Autocomplete';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';

import { IDynamicSchemaField } from '@/interfaces/DynamicSchema';
import api from '@/services/api';

import RelatedIcon, { relationshipItems } from './relatedicons';

const fieldTypes = [
  { label: 'Text', value: 'text' },
  { label: 'Multi-line Text', value: 'multi-text' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Date', value: 'date' },
  { label: 'List', value: 'list' },
  { label: 'Relationship', value: 'related' },
];

type AddOrUpdateSchemaFieldProps = {
  schemaId: string;
  field?: IDynamicSchemaField;
  open: boolean;
  onClose: (e: any) => void;
  onSuccess: (data: IDynamicSchemaField) => void | Promise<void>;
};

const AddOrUpdateSchemaField: React.FC<AddOrUpdateSchemaFieldProps> = (
  props,
) => {
  const { schemaId, field, open, onClose, onSuccess } = props;

  const { formState, control, register, setError, watch, reset, handleSubmit } =
    useForm({
      mode: 'all',
    });

  const [relationType, setRelationType] = useState<string>('hasOne');
  const [schemaSearch, setSchemaSearch] = useState('');
  const [schemasOptions, setSchemasOptions] = useState<
    { title: string; id: string }[]
  >([]);

  const relationFieldType = relationshipItems.find(
    (r) => r.type === relationType,
  );

  const { errors, isSubmitting } = formState;

  const fieldName = field ? field.name : _.camelCase(watch('title'));
  const relatedSchema = watch('relatedSchema');

  const fieldType = watch('type');

  const handleSchemasInputChange = (e: any, value: string) => {
    setSchemaSearch(value);
    _.debounce(async () => {
      const res = await api.request(
        `/api/schemas?query=${value}&limit=10&skip=0`,
      );
      const data = await res.json();
      if (data) setSchemasOptions(data.schemas);
    }, 250)();
  };

  const parseOptions = (optionsStr: string) => {
    return optionsStr.trim().split('\n');
  };

  const validListOptions = (optionsStr: string) => {
    try {
      if (!optionsStr.trim()) throw new Error(`No options provided`);
      const options = parseOptions(optionsStr);

      const optionsObj: Record<string, number> = {};
      for (const option of options) {
        const optionStr = option.trim().toLowerCase();
        if (optionsObj[optionStr])
          throw new Error(`Duplicate option: "${optionStr}" added`);

        optionsObj[optionStr] = 1;
      }
      return options;
    } catch (e: any) {
      setError('options', { type: 'custom', message: e.message });
    }
  };

  const validListOptionsForm = _.debounce(validListOptions, 250);

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

      if (fieldType === 'related') {
        payload.relatedSchema = relatedSchema;
        payload.relationType = relationType;
        if (!payload.default) {
          payload.default = null;
        }
      }

      if (fieldType === 'list') {
        const options = validListOptions(values.options);
        payload.options = options;
      } else {
        delete payload.options;
      }

      const res = await api.request(
        `/api/schemas/${schemaId}/fields`,
        field ? 'PATCH' : 'POST',
        payload,
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
    if (typeof onClose === 'function') onClose(e);
  };

  const handleRelationTypeChange = (relation: any) => (e: any) => {
    const { type } = relation;
    setRelationType(type);
  };

  const renderDefaultFieldOption = () => {
    if (fieldType === 'related') return null;
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
    if (!relationFieldType || !schemasOptions.length) return null;

    const rSchema = schemasOptions.find((s) => s.id === relatedSchema);

    return (
      <div className="py-2">
        <div className="flex items-center gap-2">
          <Typography component={'span'}>{fieldName}</Typography>
          <Typography component={'span'} color="primary">
            {relationFieldType.label}
          </Typography>
          <Typography component={'span'}>{rSchema?.title}</Typography>
        </div>
      </div>
    );
  };

  const renderRelationFieldOption = () => {
    if (fieldType !== 'related') return null;

    return (
      <>
        <div className="py-2">
          <ButtonGroup disabled={Boolean(field)}>
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

        {renderRelationDescription()}

        <div className="py-2">
          <Controller
            control={control}
            name="relatedSchema"
            rules={{
              required: 'Please provided the related schema name',
            }}
            render={({ field: { value, onChange, ref } }) => {
              return (
                <Autocomplete
                  disabled={Boolean(field)}
                  defaultValue={
                    field && typeof field === 'object'
                      ? field.relatedSchema
                      : undefined
                  }
                  options={schemasOptions}
                  getOptionLabel={(item) => item.title || item}
                  inputValue={schemaSearch}
                  onInputChange={handleSchemasInputChange}
                  value={value}
                  onChange={(event, newValue) => {
                    if (newValue && typeof newValue === 'object') {
                      onChange(newValue.name);
                    } else {
                      onChange(newValue);
                    }
                  }}
                  renderInput={(params) => {
                    return (
                      <TextField
                        {...params}
                        variant="filled"
                        label="Related to"
                        helperText={
                          errors.relatedSchema
                            ? (errors.relatedSchema.message as React.ReactNode)
                            : ''
                        }
                        error={Boolean(errors.relatedSchema)}
                      />
                    );
                  }}
                />
              );
            }}
          />
        </div>
      </>
    );
  };

  const renderListTypeFieldOptions = () => {
    if (fieldType !== 'list') return null;

    return (
      <div className="py-2">
        <TextField
          id="field-type"
          label="Options"
          multiline
          minRows={3}
          maxRows={10}
          variant="filled"
          {...register('options', {
            required: 'Please profile list items',
            validate: (v) => (validListOptionsForm(v) ? true : undefined),
          })}
          fullWidth
          helperText={
            errors.options
              ? (errors.options.message as React.ReactNode)
              : 'Add items per line'
          }
          error={Boolean(errors.options)}
        />
      </div>
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
        {renderListTypeFieldOptions()}
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
            <Button
              variant="outlined"
              type="submit"
              loading={isSubmitting}
              disableElevation
              fullWidth
            >
              Save
            </Button>
          </div>
        </form>
      </Drawer>
    );
  };

  useEffect(() => {
    if (open && field) {
      const params: { [key: string]: any } = {
        title: field.title,
        type: field.type,
        default: field.default,
        required: field.required,
        unique: field.unique,
      };
      if (field.type === 'list' && field.options) {
        params.options = field.options.join('\n');
      }
      reset(params);
      if (field.type === 'related' && field.relationType) {
        setRelationType(field.relationType);
      }
    } else {
      reset({
        title: '',
        type: 'text',
        default: undefined,
        required: undefined,
        unique: undefined,
        options: undefined,
      });
    }
  }, [field, reset, open]);

  return renderAddOrUpdateSchemaField();
};

export default AddOrUpdateSchemaField;
