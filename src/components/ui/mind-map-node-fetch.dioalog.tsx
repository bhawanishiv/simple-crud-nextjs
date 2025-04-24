import React, { useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import InputAdornment from '@mui/material/InputAdornment';
import EastOutlinedIcon from '@mui/icons-material/EastOutlined';
import StopOutlinedIcon from '@mui/icons-material/StopOutlined';
import CustomIconButton from './custom-icon-button';

type TFormValues = {
  text: string;
};

export interface MindMapNodeFetchDialogProps {
  open?: boolean;
  isSubmitting?: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onSubmit: SubmitHandler<TFormValues>;
}

export default function MindMapNodeFetchDialog({
  open,
  isSubmitting,
  onSubmit,
  onCancel,
  onClose,
}: MindMapNodeFetchDialogProps) {
  const { formState, control, reset, handleSubmit } = useForm<TFormValues>({
    defaultValues: {
      text: '',
    },
  });

  const renderAction = () => {
    if (isSubmitting)
      return (
        <CustomIconButton
          onClick={() => {
            onCancel?.();
            onClose?.();
          }}
          color="error"
          type="submit"
        >
          <StopOutlinedIcon />
        </CustomIconButton>
      );

    return (
      <CustomIconButton
        disabled={!formState.isValid}
        color="primary"
        type="submit"
      >
        <EastOutlinedIcon />
      </CustomIconButton>
    );
  };

  useEffect(() => {
    if (!open) {
      reset({ text: '' });
    }
  }, [open]);

  return (
    <>
      <Dialog
        open={!!open}
        onClose={onClose}
        classes={{ paper: 'rounded-2xl' }}
        fullWidth
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="text"
            control={control}
            rules={{ required: 'This field is required' }}
            render={({ field }) => {
              return (
                <TextField
                  fullWidth
                  variant="outlined"
                  autoFocus={open}
                  disabled={isSubmitting}
                  placeholder={'Please add more details for this node'}
                  {...field}
                  slotProps={{
                    input: {
                      classes: {
                        input: 'py-8',
                        root: 'rounded-2xl',
                        notchedOutline: 'rounded-2xl',
                      },
                      endAdornment: (
                        <InputAdornment position="end">
                          {renderAction()}
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              );
              // <input
              //   className="py-3 pl-4 pr-12 bg-transparent outline-none w-full"
              //   placeholder="e.g. A vacation planning to london"
              //   {...register('text')}
              // />
              // <div className="absolute right-0 top-1/2 transform -translate-y-1/2 px-1  ">
              //   {renderAction()}
              // </div>
            }}
          />
        </form>
      </Dialog>
    </>
  );
}
