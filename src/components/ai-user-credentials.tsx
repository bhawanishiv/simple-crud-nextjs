'use client';

import React, { useEffect } from 'react';
import {
  useForm,
  Controller,
  SubmitHandler,
  SubmitErrorHandler,
} from 'react-hook-form';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import Menu from '@mui/material/Menu';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { useAiCredentials } from '@/hooks/use-ai-credentials';

const SUPPORTED_PROVIDERS = [
  'openai',
  'azure',
  'anthropic',
  'google',
  'google vertex',
];

const MODELS = [
  'gpt-4.1',
  'gpt-4o',
  'gpt-o4-mini',
  'gpt-o3',
  'gpt-o3-mini',
  'gpt-4',
  'gpt-3.5-turbo',
  'claude-3-7-sonnet-latest',
  'claude-3-5-sonnet-latest',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
  'gemini-1.5',
  'gemini-2.0-flash',
  'vertex:gemini-1.5',
  'vertex:gemini-2.0-flash',
];

type TFormFieldOptions = {
  required?: boolean;
  placeholder?: string;
};

type TFormValues = {
  model: string;
  apiKey: string;
  resourceName?: string;
  baseURL?: string;
  apiVersion: string;
  clientEmail?: string;
  privateKey?: string;
};

// export interface AiUserCredentialsProps {}

export default function AiUserCredentials() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [apiKeyVisible, setApiKeyVisible] = React.useState(false);
  const [isCredentialsAvailable, setIsCredentialsAvailable] =
    React.useState(false);

  const credentials = useAiCredentials();

  const {
    control,
    handleSubmit,
    watch,
    reset,
    trigger,
    formState: { errors },
  } = useForm<TFormValues>({
    defaultValues: {
      model: '',
      apiKey: '',
      apiVersion: '',
      resourceName: '',
      baseURL: '',
      clientEmail: '',
      privateKey: '',
    },
  });

  const handleOpen = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const toggleApiKeyVisibility = () => {
    setApiKeyVisible(!apiKeyVisible);
  };

  const onSubmit: SubmitHandler<TFormValues> = (data) => {
    console.log('Form Data:', data);

    const { model, baseURL, resourceName, ...rest } = data;
    if (model.startsWith('azure')) {
      if (!baseURL && !resourceName) {
        alert('Either "Base URL" or "Resource name" must be provided');
        return;
      }
    }

    const filteredData = Object.fromEntries(
      Object.entries({ model, baseURL, resourceName, ...rest }).filter(
        ([_, value]) => value !== undefined && value !== '',
      ),
    );

    console.log(`filteredData->`, filteredData);
    setApiKeyVisible(false);
    credentials.setValues(filteredData);
    setIsCredentialsAvailable(true);
    handleClose();
  };

  const onSubmitError: SubmitErrorHandler<TFormValues> = (errors) => {
    setIsCredentialsAvailable(false);
  };

  const model = watch('model') || '';

  const isOpen = Boolean(anchorEl);

  const renderApiKeyField = (options?: TFormFieldOptions) => {
    const { required = false, placeholder } = options || {};
    return (
      <Controller
        key="apiKey"
        name="apiKey"
        control={control}
        rules={{
          ...(required ? { required: 'Please provide the API Key' } : {}),
        }}
        render={({ field }) => (
          <div className="py-2">
            <InputLabel
              htmlFor={`${field.name}El`}
              required={required}
              className="text-sm"
            >
              API Key
            </InputLabel>
            <TextField
              {...field}
              id={`${field.name}El`}
              fullWidth
              variant="outlined"
              autoComplete="off"
              placeholder={placeholder || 'e.g. sk-1234567890'}
              type={apiKeyVisible ? 'text' : 'password'}
              error={!!errors.apiKey}
              helperText={errors.apiKey?.message}
              slotProps={{
                htmlInput: {
                  autoComplete: 'new-password',
                },
                input: {
                  className: 'py-1.5',
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={toggleApiKeyVisibility}>
                        {apiKeyVisible ? (
                          <VisibilityOutlinedIcon />
                        ) : (
                          <VisibilityOffOutlinedIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </div>
        )}
      />
    );
  };

  const renderApiVersionField = (options?: TFormFieldOptions) => {
    const { required = false, placeholder } = options || {};
    return (
      <Controller
        key="apiVersion"
        name="apiVersion"
        control={control}
        rules={{
          ...(required ? { required: 'Please provide the API version' } : {}),
        }}
        render={({ field }) => (
          <div className="py-2">
            <InputLabel
              htmlFor={`${field.name}El`}
              required={required}
              className="text-sm"
            >
              API Version
            </InputLabel>

            <TextField
              id={`${field.name}El`}
              fullWidth
              autoComplete="off"
              placeholder={placeholder || 'e.g. 2024-10-01-preview'}
              variant="outlined"
              {...field}
              error={!!errors[field.name]}
              helperText={errors[field.name]?.message}
              slotProps={{
                input: {
                  className: 'py-1.5',
                },
              }}
            />
          </div>
        )}
      />
    );
  };

  const renderBaseURLField = (options?: TFormFieldOptions) => {
    const { required = false, placeholder } = options || {};
    return (
      <Controller
        key="baseURL"
        name="baseURL"
        control={control}
        rules={{
          ...(required ? { required: 'Please provide the Base URL' } : {}),
        }}
        render={({ field }) => (
          <div className="py-2">
            <InputLabel
              htmlFor={`${field.name}El`}
              required={required}
              className="text-sm"
            >
              Base URL
            </InputLabel>

            <TextField
              id={`${field.name}El`}
              fullWidth
              autoComplete="off"
              placeholder={placeholder || 'e.g. https://api.example.com'}
              variant="outlined"
              {...field}
              error={!!errors[field.name]}
              helperText={errors[field.name]?.message}
              slotProps={{
                input: {
                  className: 'py-1.5',
                },
              }}
            />
          </div>
        )}
      />
    );
  };

  const renderResourceNameField = (options?: TFormFieldOptions) => {
    const { required = false, placeholder } = options || {};
    return (
      <Controller
        key="resourceName"
        name="resourceName"
        control={control}
        rules={{
          ...(required ? { required: 'Please provide the Resource name' } : {}),
        }}
        render={({ field }) => (
          <div className="py-2">
            <InputLabel
              htmlFor={`${field.name}El`}
              required={required}
              className="text-sm"
            >
              Resource name
            </InputLabel>

            <TextField
              id={`${field.name}El`}
              fullWidth
              autoComplete="off"
              placeholder={placeholder || 'Enter your resource name'}
              variant="outlined"
              {...field}
              error={!!errors[field.name]}
              helperText={errors[field.name]?.message}
              slotProps={{
                input: {
                  className: 'py-1.5',
                },
              }}
            />
          </div>
        )}
      />
    );
  };

  const renderClientEmailField = (options?: TFormFieldOptions) => {
    const { required = false, placeholder } = options || {};
    return (
      <Controller
        key="clientEmail"
        name="clientEmail"
        control={control}
        rules={{
          ...(required ? { required: 'Please provide the Client email' } : {}),
        }}
        render={({ field }) => (
          <div className="py-2">
            <InputLabel
              htmlFor={`${field.name}El`}
              required={required}
              className="text-sm"
            >
              Client Email
            </InputLabel>

            <TextField
              id={`${field.name}El`}
              fullWidth
              autoComplete="off"
              placeholder={placeholder || 'Enter your Client email'}
              variant="outlined"
              {...field}
              error={!!errors[field.name]}
              helperText={errors[field.name]?.message}
              slotProps={{
                input: {
                  className: 'py-1.5',
                },
              }}
            />
          </div>
        )}
      />
    );
  };

  const renderPrivateKeyField = (options?: TFormFieldOptions) => {
    const { required = false, placeholder } = options || {};
    return (
      <Controller
        key="privateKey"
        name="privateKey"
        control={control}
        rules={{
          ...(required ? { required: 'Please provide the Private key' } : {}),
        }}
        render={({ field }) => (
          <div className="py-2">
            <InputLabel
              htmlFor={`${field.name}El`}
              required={required}
              className="text-sm"
            >
              Private Key
            </InputLabel>

            <TextField
              id={`${field.name}El`}
              fullWidth
              autoComplete="off"
              placeholder={placeholder || 'Enter your Private key'}
              variant="outlined"
              {...field}
              error={!!errors[field.name]}
              helperText={errors[field.name]?.message}
              slotProps={{
                input: {
                  className: 'py-1.5',
                },
              }}
            />
          </div>
        )}
      />
    );
  };

  const renderProviderBasedFields = () => {
    if (model.startsWith('azure')) {
      return (
        <>
          {renderApiKeyField({ required: true })}
          {renderBaseURLField()}
          {renderResourceNameField()}
          <Typography className="text-xs" color="textSecondary">
            {`Either "Base URL" or "Resource name" must be provided`}
          </Typography>
          {renderApiVersionField()}
        </>
      );
    } else if (model.startsWith('claude')) {
      return (
        <>
          {renderApiKeyField({ required: true })}
          {renderBaseURLField()}
        </>
      );
    } else if (model.startsWith('vertex:')) {
      return (
        <>
          {renderClientEmailField({ required: true })}
          {renderPrivateKeyField({ required: true })}
        </>
      );
    } else if (model.startsWith('gemini')) {
      return (
        <>
          {renderApiKeyField({ required: true })}
          {renderBaseURLField()}
        </>
      );
    }

    return <>{renderApiKeyField({ required: true })}</>;
  };

  useEffect(() => {
    if (isOpen) {
      reset({
        model: credentials.values.model || '',
        apiKey: credentials.values.apiKey || '',
        resourceName: credentials.values.resourceName || '',
        baseURL: credentials.values.baseURL || '',
        apiVersion: credentials.values.apiVersion || '',
        clientEmail: credentials.values.clientEmail || '',
        privateKey: credentials.values.privateKey || '',
      });
      trigger();
    } else {
      setApiKeyVisible(false);
    }
  }, [isOpen]);

  return (
    <div>
      <div className="fixed bottom-2 right-3  z-10">
        <IconButton onClick={handleOpen}>
          {/* <Badge variant="dot" color="primary" invisible={invisible}> */}
          <SettingsOutlinedIcon
            color={isCredentialsAvailable ? 'primary' : 'inherit'}
          />
          {/* </Badge> */}
        </IconButton>
      </div>

      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <form
          onSubmit={handleSubmit(onSubmit, onSubmitError)}
          className="p-4 w-md"
        >
          <div className="pb-4">
            <Typography variant="h6" className="font-semilight">
              You can use your own LLM provider
            </Typography>
            <Typography
              variant="body2"
              className="text-xs"
              color="textSecondary"
            >
              The credentials provided here are not saved in our system. They
              are used solely to directly call APIs of LLM providers selected
              here.
            </Typography>
            <div className="pt-2">
              <Typography className="text-sm" color="textSecondary">
                Supported providers:
              </Typography>
              <Typography className="text-sm" component="span">
                {SUPPORTED_PROVIDERS.join(', ')}
              </Typography>
            </div>
          </div>
          <Controller
            name="model"
            control={control}
            rules={{ required: 'Model Name is required' }}
            render={({ field }) => (
              <div className="py-2">
                <InputLabel
                  required
                  htmlFor={`${field.name}El`}
                  className="text-sm"
                >
                  Model Name
                </InputLabel>

                <Autocomplete
                  {...field}
                  disablePortal
                  fullWidth
                  id={`${field.name}El`}
                  options={MODELS}
                  freeSolo
                  onChange={(event, value) => {
                    field.onChange(value);
                  }}
                  onInputChange={(event, value) => {
                    field.onChange(value);
                  }}
                  className="w-full"
                  renderInput={(params) => {
                    return (
                      <TextField
                        placeholder="e.g. gpt-4.1, vertex:gemini-1.5, azure:gpt-4o, claude-3"
                        variant="outlined"
                        {...params}
                        slotProps={{
                          htmlInput: {
                            ...params.inputProps,
                            autoComplete: 'new-password',
                          },
                        }}
                      />
                    );
                  }}
                />
              </div>
            )}
          />
          {renderProviderBasedFields()}
          <div className="flex justify-end pt-3 space-x-2">
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" disableElevation>
              Save
            </Button>
          </div>
        </form>
      </Menu>
    </div>
  );
}
