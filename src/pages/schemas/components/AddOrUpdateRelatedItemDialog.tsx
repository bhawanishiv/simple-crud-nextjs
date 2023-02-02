import React, { useEffect, useState } from 'react';
import cx from 'classnames';

import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';

import CloseIcon from '@mui/icons-material/Close';

import api from '@/services/api';

import {
  IDynamicSchema,
  IDynamicSchemaField,
} from '@/interfaces/DynamicSchema';

type AddOrUpdateRelatedItemDialogProps = {
  schemaId: string;
  field?: IDynamicSchemaField;
  open: boolean;
  currentItem?: any | any[];
  onClose: (item?: any) => void;
  onSuccess: (
    field: IDynamicSchemaField,
    data: null | string | string[]
  ) => void;
};

const LIMIT = 100;

const AddOrUpdateRelatedItemDialog: React.FC<
  AddOrUpdateRelatedItemDialogProps
> = (props) => {
  const { field, open, currentItem, schemaId, onClose, onSuccess } = props;

  const [count, setCount] = useState<number>(0);
  const [schema, setSchema] = useState<null | IDynamicSchema>(null);
  const [items, setItems] = useState([]);
  const [fields, setFields] = useState<IDynamicSchemaField[]>([]);
  const [selectedItems, setSelectedItems] = useState<readonly string[]>([]);

  const fetchSchemaDetails = async (field: IDynamicSchemaField) => {
    const promises = [];
    promises.push(
      api.request(`/api/schemas/${field.relatedSchema}/details`, 'POST', {
        limit: LIMIT,
        skip: 0,
      })
    );

    let ids = [];

    if (currentItem && currentItem[field.name]) {
      if (field.relationType === 'hasOne') {
        ids.push(currentItem[field.name]);
      } else {
        ids = [...currentItem[field.name]];
      }
    }

    if (ids.length) {
      promises.push(
        api.request(`/api/schemas/${field.relatedSchema}/details`, 'POST', {
          limit: ids.length || 10,
          skip: 0,
          ids,
        })
      );
    }

    const results = await Promise.all(promises);

    const [sourceItemsRes, selectedItemsRes] = results;
    const sourceRes = await sourceItemsRes.json();

    if (sourceItemsRes.ok) {
      const { fields, items, count, schema } = sourceRes;
      setSchema(schema);
      setFields(fields);
      setItems(items);
      setCount(count);
    }

    if (selectedItemsRes) {
      const selectedRes = await selectedItemsRes.json();
      const { items } = selectedRes;
      setSelectedItems(items.map((i) => i.id));
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleUpdate = async () => {
    try {
      const finalSelectedItems =
        field?.relationType === 'hasOne'
          ? selectedItems[0] || null
          : selectedItems;

      onSuccess(field, finalSelectedItems);
    } catch (e) {}
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
  };

  const handleSelectionChange = (item: any) => () => {
    const selectedIndex = selectedItems.indexOf(item.id as string);

    if (field?.relationType === 'hasOne') {
      setSelectedItems([item.id]);
    } else {
      let newSelected: readonly string[] = [];

      if (selectedIndex === -1) {
        newSelected = newSelected.concat(selectedItems, item.id as string);
      } else if (selectedIndex === 0) {
        newSelected = newSelected.concat(selectedItems.slice(1));
      } else if (selectedIndex === selectedItems.length - 1) {
        newSelected = newSelected.concat(selectedItems.slice(0, -1));
      } else if (selectedIndex > 0) {
        newSelected = newSelected.concat(
          selectedItems.slice(0, selectedIndex),
          selectedItems.slice(selectedIndex + 1)
        );
      }

      setSelectedItems(newSelected);
    }
  };

  const renderDialogContent = () => {
    if (!fields.length) return null;
    return (
      <>
        <div className="flex items-center gap-2 pb-6">
          <Typography className="text-sm">
            {field?.relationType === 'hasMany'
              ? 'Select multiple items'
              : 'Select one item'}
          </Typography>
          <div>
            <Button onClick={handleClearSelection}>Clear selection</Button>
          </div>
        </div>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
            <TableHead>
              <TableRow>
                <TableCell>Select</TableCell>
                {fields
                  .filter((f) => f.type !== 'related')
                  .map((field: IDynamicSchemaField) => {
                    return <TableCell key={field.id}>{field.title}</TableCell>;
                  })}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item: any) => {
                const selected = Boolean(
                  selectedItems.find((x: string) => x === item.id)
                );
                return (
                  <TableRow
                    key={item.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    onClick={handleSelectionChange(item)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={selected}
                        // inputProps={{
                        //   'aria-labelledby': labelId,
                        // }}
                      />
                    </TableCell>

                    {fields
                      .filter((f) => f.type !== 'related')
                      .map((field: IDynamicSchemaField) => {
                        return (
                          <TableCell key={field.id}>
                            {item?.[field.name]}
                          </TableCell>
                        );
                      })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </>
    );
  };

  const renderDialog = () => {
    if (!field || !schema) return null;
    return (
      <>
        <DialogTitle>
          <Chip label={schema.title} />
          <span className="px-2">Select {field.title}</span>
          {onClose ? (
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          ) : null}
        </DialogTitle>
        <DialogContent>{renderDialogContent()}</DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleUpdate} autoFocus>
            Save
          </Button>
        </DialogActions>
      </>
    );
  };

  const renderAddOrUpdateRelatedItemDialog = () => {
    return (
      <Dialog onClose={handleClose} open={open} maxWidth="xl">
        {renderDialog()}
      </Dialog>
    );
  };

  useEffect(() => {
    if (open && field) fetchSchemaDetails(field);
    else {
      setCount(0);
      setSchema(null);
      setFields([]);
      setSelectedItems([]);
    }
  }, [open, field]);

  return renderAddOrUpdateRelatedItemDialog();
};

export default AddOrUpdateRelatedItemDialog;
