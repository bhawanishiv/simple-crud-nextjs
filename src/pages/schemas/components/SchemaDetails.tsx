import React, { useState } from 'react';
import cx from 'classnames';
import {
  IDynamicSchema,
  IDynamicSchemaField,
} from '@/interfaces/DynamicSchema';

import useSwr from 'swr';

import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';

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

  const { isLoading, data, mutate } = useSwr(`${schema.name}`, () =>
    getSchemaFields(schema.name)
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

  const renderSchemaDetails = () => {
    if (!data) {
      return (
        <div>
          <Typography>No schema definitions found</Typography>
        </div>
      );
    }

    const { count, fields } = data;

    return (
      <div className="w-full">
        {fields.map((field: IDynamicSchemaField) => {
          return (
            <div key={field.id} className="my-2 w-full">
              <div
                className="border rounded-xl py-2 px-6 w-full"
                onClick={handleFieldEditClick(field)}
              >
                <Chip label={field.name} />
                <div className="flex items-center gap-2">
                  <Typography>{field.title}</Typography>
                  <Typography color="primary">{field.type}</Typography>
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
          <CircularProgress />
        </div>
      );

    return (
      <div className="w-full">
        <AddOrUpdateSchemaField
          schemaId={schema.id}
          schemaName={schema.name}
          field={typeof currentField === 'object' ? currentField : undefined}
          open={Boolean(currentField)}
          onClose={handleAddOrUpdateFieldClose}
          onSuccess={handleAddOrUpdateFieldSuccess}
        />
        <div>
          <Button onClick={handleAddFieldClick}>Add a Field</Button>
        </div>
        {renderSchemaDetails()}
      </div>
    );
  };

  return renderSchemaDetailsContainer();
};

export default SchemaDetails;
