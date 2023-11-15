import React, { useState } from 'react';
import { useRouter } from 'next/router';

import { cn } from '@/lib/utils';
import _ from 'lodash';
import moment from 'moment';

import useSwr from 'swr';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import { IDynamicSchema } from '@/interfaces/DynamicSchema';

import SchemaDetails from './components/SchemaDetails';
import AddOrUpdateSchema from './components/AddOrUpdateSchema';

const getSchemas = async (skip: number = 0, limit: number = 10) => {
  const res = await fetch(`/api/schemas?limit=${limit}&skip=${skip}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data;
};

type SchemasPageProps = {};

const SchemasPage: React.FC<SchemasPageProps> = (props) => {
  const {} = props;

  const router = useRouter();

  const { isLoading, isValidating, data, mutate } = useSwr('schemas', () =>
    getSchemas()
  );

  const [currentSchema, setCurrentSchema] = useState(0);
  const [addOrUpdateSchemaOpen, setAddOrUpdateSchema] = useState<any | boolean>(
    null
  );

  const handleAddSchema = () => {
    setAddOrUpdateSchema(true);
  };

  const handleAddOrUpdateSchemaClose = () => {
    setAddOrUpdateSchema(null);
  };
  const handleAddOrUpdateSchemaSuccess = (schema: IDynamicSchema) => {
    mutate();
    setAddOrUpdateSchema(null);
  };

  const handleSchemaDetailsClick =
    (schema: IDynamicSchema, index: number) => (e: any) => {
      setCurrentSchema(index);
    };

  const handleGoToSchemaPage = (schema: IDynamicSchema) => (e: any) => {
    e.preventDefault();
    router.push(`/schemas/${_.lowerCase(schema.name)}`);
  };

  const renderSchemasPage = () => {
    if (isLoading)
      return (
        <div className="flex flex-col items-center justify-center h-screen w-screen">
          <CircularProgress size={16} />
        </div>
      );

    const { count, schemas = [] } = data || {};

    return (
      <div>
        <AddOrUpdateSchema
          schema={
            typeof addOrUpdateSchemaOpen === 'object'
              ? addOrUpdateSchemaOpen
              : undefined
          }
          open={Boolean(addOrUpdateSchemaOpen)}
          onClose={handleAddOrUpdateSchemaClose}
          onSuccess={handleAddOrUpdateSchemaSuccess}
        />
        <div className="flex ">
          <div className="w-1/5 p-3">
            <div className="flex  items-center justify-between">
              <div className="flex items-center gap-2">
                <Typography>Schemas</Typography>
                <div>{isValidating && <CircularProgress size={16} />}</div>
              </div>
              <div>
                <Button className="whitespace-nowrap" onClick={handleAddSchema}>
                  Add a Schema
                </Button>
              </div>
            </div>
            <List>
              {schemas.map((schema: any, index: number) => {
                return (
                  <ListItem
                    key={schema.id}
                    selected={index === currentSchema}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={handleSchemaDetailsClick(schema, index)}
                      >
                        <EditOutlinedIcon />
                      </IconButton>
                    }
                  >
                    <ListItemButton
                      className=""
                      onClick={handleGoToSchemaPage(schema)}
                    >
                      <ListItemText
                        primaryTypographyProps={{
                          color:
                            index === currentSchema ? 'primary' : undefined,
                        }}
                        primary={schema.title}
                        secondary={moment(schema.updatedAt).format('LLL')}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </div>
          <div className="w-4/5 px-3">
            {schemas[currentSchema] && (
              <SchemaDetails schema={schemas[currentSchema]} />
            )}
          </div>
        </div>
      </div>
    );
  };

  return renderSchemasPage();
};

export default SchemasPage;
