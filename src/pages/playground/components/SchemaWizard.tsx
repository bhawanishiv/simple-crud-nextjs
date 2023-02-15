import React, { useEffect, useState } from 'react';
import _ from 'lodash';

import { SubmitHandler, Controller, useForm } from 'react-hook-form';

import LoadingButton from '@mui/lab/LoadingButton';
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

// import RelatedIcon, { relationshipItems } from './relatedicons';

const fieldTypes = [
  { label: 'Text', value: 'text' },
  { label: 'Multi-line Text', value: 'multi-text' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Date', value: 'date' },
  { label: 'List', value: 'list' },
  { label: 'Relationship', value: 'related' },
];

type SchemaWizardProps = {
  text?: string;
  open: boolean;
  onClose: (e: any) => void;
  onSuccess: (data: any) => void | Promise<void>;
};

const SchemaWizard: React.FC<SchemaWizardProps> = (props) => {
  const { text, open, onClose, onSuccess } = props;

  console.log(`text->`, text);

  const handleClose = (e: any) => {
    onClose(e);
  };

  const renderSchemaWizard = () => {
    return (
      <Drawer anchor="right" open={open} onClose={handleClose}>
        <form className="p-6">
          <div className="flex flex-col flex-1"></div>
          <div className="flex items-center py-2">
            <LoadingButton
              variant="outlined"
              type="submit"
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

  return renderSchemaWizard();
};

export default SchemaWizard;
