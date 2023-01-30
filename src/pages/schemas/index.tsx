import React, { useState } from 'react';
import { useRouter } from 'next/router';

import cx from 'classnames';
import _ from 'lodash';

import useSwr from 'swr';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';

import { IDynamicSchema } from '@/interfaces/DynamicSchema';

import SchemaDetails from './components/SchemaDetails';
import AddOrUpdateSchema from './components/AddOrUpdateSchema';

const getSchemas = async (skip: number = 0, limit: number = 10) => {
  const res = await fetch(`/api/schemas?limit=${limit}&skip=${skip}`);
  const data = await res.json();
  return data;
};

type SchemasPageProps = {};

const SchemasPage: React.FC<SchemasPageProps> = (props) => {
  const {} = props;

  const router = useRouter();

  const { isLoading, data, mutate } = useSwr('schemas', () => getSchemas());

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
    if (isLoading) return <CircularProgress />;
    if (!data) return <div>Not found</div>;
    const { count, schemas } = data;
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
              <Typography>Schemas</Typography>
              <div>
                <Button onClick={handleAddSchema}>Add a Schema</Button>
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
                        aria-label="delete"
                        onClick={handleGoToSchemaPage(schema)}
                      >
                        <ArrowForwardOutlinedIcon />
                      </IconButton>
                    }
                  >
                    <ListItemButton
                      className=""
                      onClick={handleSchemaDetailsClick(schema, index)}
                    >
                      <ListItemText
                        primaryTypographyProps={{
                          color:
                            index === currentSchema ? 'primary' : undefined,
                        }}
                        primary={schema.title}
                        secondary={schema.updatedAt}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </div>
          <div className="w-4/5 p-3">
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
