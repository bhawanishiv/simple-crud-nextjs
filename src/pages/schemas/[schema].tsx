import React, { useState } from 'react';
import { useRouter } from 'next/router';
import _ from 'lodash';

import useSwr from 'swr';

import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';

import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

import api from '@/services/api';
import {
  IDynamicSchema,
  IDynamicSchemaField,
} from '@/interfaces/DynamicSchema';

import AddOrUpdateSchemaField from './components/AddOrUpdateSchemaField';
import AddOrUpdateSchemaItem from './components/AddOrUpdateSchemaItem';
import DeleteItemDialog from './components/DeleteItemDialog';

import DataChat from '@/components/DataChat';

const LIMIT = 100;

const getSchemaItems = async ([url, schema, page, params]: any[]) => {
  const res = await api.request(`${url}/${schema}/details`, 'POST', {
    skip: LIMIT * page,
    limit: LIMIT,
    ...params,
  });
  const data = await res.json();

  return data;
};

const getReferencedItems = async (data: any) => {
  if (!data) return null;

  const { fields, items } = data;

  let ids: Record<string, string[]> = {};

  for (const item of items) {
    for (const field of fields.filter(
      (f: IDynamicSchemaField) => f.type === 'related',
    )) {
      if (!ids[field.relatedSchema]) ids[field.relatedSchema] = [];

      if (item[field.name]) {
        if (field.relationType === 'hasOne') {
          ids[field.relatedSchema].push(item[field.name]);
        } else {
          ids = {
            ...ids,
            [field.relatedSchema]: [
              ...ids[field.relatedSchema],
              ...item[field.name],
            ],
          };
        }
      }
    }
  }

  const promises = [];
  for (const schema in ids) {
    promises.push(
      api.request(`/api/schemas/${schema}/details`, 'POST', {
        limit: ids[schema].length || 10,
        skip: 0,
        ids: ids[schema],
      }),
    );
  }

  const results = await Promise.all(promises);

  const responses: { [key: string]: any } = {};

  const schemas = Object.keys(ids);

  for (let i = 0; i < schemas.length; i++) {
    const res = await results[i].json();
    const itemsObj: { [key: string]: any } = {};
    if (res) {
      for (const resItem of res.items) {
        itemsObj[resItem.id] = resItem;
      }
    }
    responses[schemas[i]] = {
      itemsObj,
      ...res,
    };
  }

  return responses;
};

const SchemaPage = () => {
  const router = useRouter();

  const [pageIndex, setPageIndex] = useState(0);
  const [queryParams, setQueryParams] = useState<any>({});
  // const { isLoading, data: definitions } = useSwr(
  //   `/api/schemas/${router.query.schema}/definitions`,
  //   getSchemaAndFields
  // );
  const { data, error, isValidating, mutate } = useSwr(
    ['/api/schemas', router.query.schema, pageIndex, queryParams],
    getSchemaItems,
  );

  // const { data, error, mutate, size, setSize, isValidating } = useSWRInfinite(
  //   (index) => (router.query.schema ? `${index}` : null),
  //   (index) => getSchemaItems(router.query.schema as string, +index)
  // );

  const isLoadingInitialData = !data && !error;

  const [addOrUpdateItem, setAddOrUpdateItem] = useState<any | boolean>(false);
  const [deleteItem, setDeleteItem] = useState<any | boolean>(false);
  const [currentField, setCurrentField] = useState<boolean | any>(null);

  const {
    data: relatedDocs,
    mutate: mutateRefItems,
    isLoading,
    isValidating: isRefItemValidating,
  } = useSwr(
    isLoadingInitialData ? null : 'getReferencedItems',
    async () => await getReferencedItems(data ? data[0] : null),
  );

  // const items = data ? [].concat(...data) : [];

  // const isLoadingMore =
  //   isLoadingInitialData ||
  //   (size > 0 && data && typeof data[size - 1] === 'undefined');
  // const isEmpty = data?.[0]?.length === 0;
  // const isReachingEnd =
  //   isEmpty || (data && data[data.length - 1]?.length < PAGE_SIZE);
  // const isRefreshing = isValidating && data && data.length === size;

  const handleSearch = async (params: any) => {
    const payload = {
      ...params,
      limit: params.limit || LIMIT,
      skip: params.skip || 0,
    };
    setPageIndex(0);
    setQueryParams(payload);

    // console.log(`params->`, params);
    // console.log(`payload->`, payload);
    // const res = await api.request(
    //   `/api/schemas/${router.query.schema}/details`,
    //   'POST',
    //   payload
    // );
    // const data = await res.json();
    // console.log(`data->`, data);
    mutate();
  };

  const handleAddFieldClick = () => {
    setCurrentField(true);
  };

  const handleAddOrUpdateFieldClose = (e: any) => {
    setCurrentField(null);
  };

  const handleAddOrUpdateFieldSuccess = (data: IDynamicSchemaField) => {
    mutate();
    setCurrentField(null);
  };

  const handleDeleteItem = (schema: IDynamicSchema, item: any) => () => {
    setDeleteItem({ item, schemaId: schema.id });
  };

  const handleDeleteItemSuccess = () => {
    mutate();
    setDeleteItem(false);
  };

  const handleDeleteItemClose = () => {
    setDeleteItem(false);
  };

  const handleAddItem = () => {
    setAddOrUpdateItem(true);
  };

  const handleUpdateItem = (item: any) => (e: any) => {
    setAddOrUpdateItem(item);
  };

  const handleAddOrUpdateItemClose = () => {
    setAddOrUpdateItem(false);
  };

  const handleAddOrUpdateSuccess = () => {
    mutate().then(mutateRefItems);
    setAddOrUpdateItem(false);
  };

  const handleDataChatComplete = () => {
    mutate().then(mutateRefItems);
  };

  const getRefFieldsLabel = (item: any) => {
    return Object.keys(item).filter(
      (f) =>
        f !== 'id' &&
        f !== '_id' &&
        f !== 'updatedAt' &&
        f !== 'createdAt' &&
        f !== '__v' &&
        typeof item[f] !== 'object',
    );
  };

  const renderReferencedItem = (field: IDynamicSchemaField, item: any) => {
    if (!relatedDocs || !field.relatedSchema) return null;
    const itemsObj = relatedDocs[field.relatedSchema];
    if (!itemsObj || !item[field.name]) return null;

    if (field.relationType === 'hasMany') {
      if (!item[field.name].length) return null;
      return item[field.name]
        .filter((i: any) => itemsObj.itemsObj[i])
        .map((i: any) => {
          const _item = itemsObj.itemsObj[i];
          const _fields = getRefFieldsLabel(_item);
          return _item[_fields[0]];
        })
        .join(', ');
    }

    const _item = itemsObj.itemsObj[item[field.name]];
    if (!_item) return null;
    const _fields = getRefFieldsLabel(_item);
    return _item[_fields[0]];
  };

  const renderSchemaPage = () => {
    if (isLoadingInitialData || isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-screen w-screen">
          <div>
            <CircularProgress size={16} />
          </div>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="flex flex-col items-center justify-center h-screen w-screen">
          <div>
            <Typography>Not found</Typography>
          </div>
        </div>
      );
    }

    const { schema, fields, items, count } = data;
    return (
      <div>
        <AddOrUpdateSchemaItem
          schemaName={schema.name}
          schemaId={schema.id}
          fields={fields}
          item={
            typeof addOrUpdateItem === 'object' ? addOrUpdateItem : undefined
          }
          open={addOrUpdateItem}
          onClose={handleAddOrUpdateItemClose}
          onSuccess={handleAddOrUpdateSuccess}
        />
        <div className="p-6">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Typography>{schema.title}</Typography>
                <Chip label={schema.name} />
                <div>
                  {(isValidating || isRefItemValidating) && (
                    <CircularProgress size={16} />
                  )}
                </div>
              </div>
              <DataChat
                schema={schema}
                fields={fields}
                onSearch={handleSearch}
                onComplete={handleDataChatComplete}
                onUpdateSuccess={handleAddOrUpdateSuccess}
              />
              <div className="flex items-center gap-2">
                <div>
                  <Button className="whitespace-nowrap" onClick={handleAddItem}>
                    Add a {_.lowerCase(schema.title)}
                  </Button>
                </div>
                <div>
                  <Button
                    className="whitespace-nowrap"
                    onClick={handleAddFieldClick}
                  >
                    Add a field
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div>
            <TableContainer>
              <Table
                sx={{ minWidth: 650 }}
                size="small"
                aria-label="a dense table"
              >
                <TableHead>
                  <TableRow>
                    {fields.map((field: IDynamicSchemaField) => {
                      return (
                        <TableCell key={field.id}>
                          {field.title}
                          {field.type === 'related' ? ' (ref)' : ''}
                          {field.required && (
                            <Typography component="span" color="red">
                              *
                            </Typography>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item: any) => (
                    <TableRow
                      key={item.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      {fields.map((field: IDynamicSchemaField) => {
                        return (
                          <TableCell key={field.id}>
                            {field.type === 'related'
                              ? renderReferencedItem(field, item)
                              : item?.[field.name]}
                          </TableCell>
                        );
                      })}
                      <TableCell className="flex items-center gap-2">
                        <IconButton onClick={handleUpdateItem(item)}>
                          <EditOutlinedIcon />
                        </IconButton>

                        <IconButton onClick={handleDeleteItem(schema, item)}>
                          <DeleteOutlineOutlinedIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </div>
        <DeleteItemDialog
          schemaId={
            typeof deleteItem === 'object' ? deleteItem.schemaId : undefined
          }
          open={Boolean(deleteItem)}
          item={typeof deleteItem === 'object' ? deleteItem.item : undefined}
          onDeleteSuccess={handleDeleteItemSuccess}
          onClose={handleDeleteItemClose}
        />
        <AddOrUpdateSchemaField
          schemaId={schema.id}
          field={typeof currentField === 'object' ? currentField : undefined}
          open={Boolean(currentField)}
          onClose={handleAddOrUpdateFieldClose}
          onSuccess={handleAddOrUpdateFieldSuccess}
        />
      </div>
    );
  };

  return renderSchemaPage();
};

export default SchemaPage;
