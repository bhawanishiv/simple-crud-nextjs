import React, { useState } from 'react';
import { useRouter } from 'next/router';
import cx from 'classnames';
import _ from 'lodash';

import useSwr from 'swr';
import useSWRInfinite from 'swr/infinite';

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

import AddOrUpdateSchemaItem from './components/AddOrUpdateSchemaItem';
import DeleteItemDialog from './components/DeleteItemDialog';

const LIMIT = 10;

const getSchemaItems = async (name: string, index: number) => {
  const res = await api.request(`/api/schemas/${name}/details`, 'POST', {
    limit: LIMIT,
    skip: LIMIT * index,
  });
  const data = await res.json();
  return data;
};

type SchemaPageProps = {};

const SchemaPage: React.FC<SchemaPageProps> = (props) => {
  const {} = props;

  const router = useRouter();

  // const { isLoading, data: definitions } = useSwr(
  //   `/api/schemas/${router.query.schema}/definitions`,
  //   getSchemaAndFields
  // );

  const { data, error, mutate, size, setSize, isValidating } = useSWRInfinite(
    (index) => (router.query.schema ? `${index}` : null),
    (index) => getSchemaItems(router.query.schema as string, +index)
  );

  const [addOrUpdateItem, setAddOrUpdateItem] = useState<any | boolean>(false);
  const [deleteItem, setDeleteItem] = useState<any | boolean>(false);

  console.log(`data->`, data);
  // const items = data ? [].concat(...data) : [];

  const isLoadingInitialData = !data && !error;

  // const isLoadingMore =
  //   isLoadingInitialData ||
  //   (size > 0 && data && typeof data[size - 1] === 'undefined');
  // const isEmpty = data?.[0]?.length === 0;
  // const isReachingEnd =
  //   isEmpty || (data && data[data.length - 1]?.length < PAGE_SIZE);
  // const isRefreshing = isValidating && data && data.length === size;

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
    mutate();
    setAddOrUpdateItem(false);
  };

  const renderSchemaPage = () => {
    if (isLoadingInitialData) {
      return (
        <div>
          <CircularProgress />
        </div>
      );
    }

    if (!data) {
      return (
        <div>
          <Typography>Not found</Typography>
        </div>
      );
    }

    const [{ schema, fields, items, count }] = data;
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
              <div>
                <Chip label={schema.name} />
                <Typography>{schema.title}</Typography>
              </div>
              <div>
                <Button onClick={handleAddItem}>
                  Add a {_.lowerCase(schema.title)}
                </Button>
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
                        <TableCell key={field.id}>{field.title}</TableCell>
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
                            {item?.[field.name]}
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
      </div>
    );
  };

  return renderSchemaPage();
};

export default SchemaPage;
