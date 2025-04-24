import React, { useState } from 'react';
import {
  IDynamicSchema,
  IDynamicSchemaField,
} from '@/interfaces/DynamicSchema';

import useSwr from 'swr';
import dayjs from 'dayjs';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';

import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import SchemaChat from '@/components/SchemaChat';

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
    schema ? `${schema.name}` : null,
    () => getSchemaFields(schema.name),
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

  const handleUpdateByGPT = () => {
    mutate();
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
      <Grid sx={{ my: 1 }} container rowSpacing={1} columnSpacing={1}>
        {fields.map((field: IDynamicSchemaField) => {
          return (
            <Grid key={field.id} size={6}>
              <Card variant="outlined" className="rounded-xl">
                <CardContent>
                  {/* <div className="border rounded-xl py-2 px-6 w-full"> */}
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
                      {dayjs(field.updatedAt).format('LLL')}
                    </Typography>
                  </div>
                  {/* </div> */}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const renderSchemaDetailsContainer = () => {
    if (isLoading) {
      return (
        <div className="p-4">
          <div>
            <CircularProgress size={16} />
          </div>
        </div>
      );
    }
    // onSubmit
    return (
      <>
        <AddOrUpdateSchemaField
          schemaId={schema.id}
          field={typeof currentField === 'object' ? currentField : undefined}
          open={Boolean(currentField)}
          onClose={handleAddOrUpdateFieldClose}
          onSuccess={handleAddOrUpdateFieldSuccess}
        />
        <div className="w-full py-2">
          <div className="flex items-center justify-between gap-2">
            <SchemaChat
              schema={schema}
              fields={data?.fields || []}
              onUpdate={handleUpdateByGPT}
            />
            <div className="flex items-center gap-2">
              <div>
                <Button
                  className="whitespace-nowrap"
                  onClick={handleAddFieldClick}
                >
                  Add a Field
                </Button>
              </div>
            </div>
          </div>
          <div className="h-[.75rem]">
            {isValidating && <CircularProgress size={16} />}
          </div>
          {renderSchemaDetails()}
        </div>
      </>
    );
  };

  return renderSchemaDetailsContainer();
};

export default SchemaDetails;
