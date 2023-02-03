import React, { useState } from 'react';
import cx from 'classnames';
import {
  IDynamicSchema,
  IDynamicSchemaField,
} from '@/interfaces/DynamicSchema';

import useSwr from 'swr';

import moment from 'moment';

import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';

import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import AddOrUpdateSchemaField from './AddOrUpdateSchemaField';

type SchemaDetailsProps = {
  schema: IDynamicSchema;
};

const getSchemaFields = async (schemaId: string) => {
  const res = await fetch(`/api/schemas/${schemaId}/fields`);
  const data = await res.json();
  return data;
};

const SchemaDetails: React.FC<SchemaDetailsProps> = (props) => {
  const { schema } = props;

  const { isLoading, isValidating, data, mutate } = useSwr(
    `${schema.name}`,
    () => getSchemaFields(schema.name)
  );

  const [currentField, setCurrentField] = useState<boolean | any>(null);

  const handleAddFieldClick = () => {
    setCurrentField(true);
  };

  const handleFieldEditClick = (field: IDynamicSchemaField) => (e: any) => {
    setCurrentField(field);
  };

  const handleAddOrUpdateFieldClose = (e: any) => {
    setCurrentField(null);
  };

  const handleAddOrUpdateFieldSuccess = (data: IDynamicSchemaField) => {
    mutate();
    setCurrentField(null);
  };

  const renderNoDef = () => {
    return (
      <div>
        <Typography>No schema definitions found</Typography>
      </div>
    );
  };
  const renderSchemaDetails = () => {
    if (!data) {
      return renderNoDef();
    }

    const { count, fields } = data;

    return (
      <div className="w-full">
        {fields.map((field: IDynamicSchemaField) => {
          return (
            <div key={field.id} className="my-2 w-full">
              <div className="border rounded-xl py-2 px-6 w-full">
                <div className="flex items-center gap-2">
                  <Chip label={field.name} />
                  <Chip
                    size="small"
                    color="primary"
                    variant="outlined"
                    label={field.type}
                  />

                  <IconButton onClick={handleFieldEditClick(field)}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Typography>
                    {field.title}
                    {field.required && (
                      <Typography color="red" component={'span'}>
                        {' *'}
                      </Typography>
                    )}
                  </Typography>
                  {field.type === 'related' && (
                    <>
                      <Typography className="text-sm">
                        {field.relationType}
                      </Typography>
                      <Typography className="text-sm" color="primary">
                        {field.relatedSchema}
                      </Typography>
                    </>
                  )}
                </div>
                <div>
                  <Typography className="text-xs" color="gray">
                    {moment(field.updatedAt).format('LLL')}
                  </Typography>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSchemaDetailsContainer = () => {
    if (isLoading)
      return (
        <div>
          <CircularProgress size={16} />
        </div>
      );

    return (
      <div className="w-full">
        <AddOrUpdateSchemaField
          schemaId={schema.id}
          field={typeof currentField === 'object' ? currentField : undefined}
          open={Boolean(currentField)}
          onClose={handleAddOrUpdateFieldClose}
          onSuccess={handleAddOrUpdateFieldSuccess}
        />
        <div className="flex items-center gap-2">
          <div>
            <Button onClick={handleAddFieldClick}>Add a Field</Button>
          </div>

          {isValidating && <CircularProgress size={16} />}
        </div>
        {renderSchemaDetails()}
      </div>
    );
  };

  return renderSchemaDetailsContainer();
};

export default SchemaDetails;
