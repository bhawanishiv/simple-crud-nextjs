import React from 'react';

import SvgIcon from '@mui/material/SvgIcon';

type IRelatedIcons = {
  hasOne: any;
  fieldHasOneAndBelongsToOne: any;
  belongsToMany: any;
  fieldHasMany: any;
  hasAndBelongsToMany: any;
  hasMany: any;
};

export type RelationTypes = keyof IRelatedIcons;

type RelatedIconsProps = {
  name: RelationTypes;
};

export const relationshipItems: {
  label: string;
  twoWay?: boolean;
  type: RelationTypes;
}[] = [
  { label: 'has one', type: 'hasOne' },
  {
    label: 'has and belongs to one',
    twoWay: true,
    type: 'fieldHasOneAndBelongsToOne',
  },
  { label: 'belongs to many', twoWay: true, type: 'belongsToMany' },
  { label: 'has many', twoWay: true, type: 'fieldHasMany' },
  {
    label: 'has and belongs to many',
    twoWay: true,
    type: 'hasAndBelongsToMany',
  },
  { label: 'has many', type: 'hasMany' },
];

const icons: IRelatedIcons = {
  hasOne: (
    <SvgIcon
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M7.128 12.321a3.601 3.601 0 110-1.44H18.72v-2.4L24 11.6l-5.28 3.12v-2.4H7.128zM6 11.6a2.4 2.4 0 11-4.8 0 2.4 2.4 0 014.8 0z"
      />
    </SvgIcon>
  ),

  fieldHasOneAndBelongsToOne: (
    <SvgIcon
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M3.6 14a2.4 2.4 0 100-4.8 2.4 2.4 0 000 4.8zm0 1.2a3.6 3.6 0 100-7.2 3.6 3.6 0 000 7.2zM20.4 14a2.4 2.4 0 100-4.8 2.4 2.4 0 000 4.8zm0 1.2a3.6 3.6 0 100-7.2 3.6 3.6 0 000 7.2z"
      />
      <path d="M6.24 10.881H18v1.44H6.24v-1.44z" />
    </SvgIcon>
  ),

  belongsToMany: (
    <SvgIcon
      width="1em"
      height="1em"
      viewBox="0 0 24 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6.24 11.28H18v1.44H6.24v-1.44z" />
      <path d="M5.871 10.699l8.347-6.176.86 1.162-8.347 6.177-.86-1.163zM5.899 13.354l8.346 6.176.864-1.167-8.347-6.176-.863 1.167z" />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M3.6 14.399a2.4 2.4 0 100-4.8 2.4 2.4 0 000 4.8zm0 1.2a3.6 3.6 0 100-7.2 3.6 3.6 0 000 7.2zM20.4 14.399a2.4 2.4 0 100-4.8 2.4 2.4 0 000 4.8zm0 1.2a3.6 3.6 0 100-7.2 3.6 3.6 0 000 7.2zM16.8 22.8a2.4 2.4 0 100-4.8 2.4 2.4 0 000 4.8zm0 1.2a3.6 3.6 0 100-7.2 3.6 3.6 0 000 7.2zM16.8 6a2.4 2.4 0 100-4.8 2.4 2.4 0 000 4.8zm0 1.2a3.6 3.6 0 100-7.2 3.6 3.6 0 000 7.2z"
      />
    </SvgIcon>
  ),

  fieldHasMany: (
    <SvgIcon
      width="1em"
      height="1em"
      viewBox="0 0 24 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.76 11.28H6v1.44h11.76v-1.44z" />
      <path d="M18.129 10.699L9.782 4.523l-.86 1.162 8.347 6.177.86-1.163zM18.101 13.354L9.755 19.53l-.864-1.167 8.347-6.176.863 1.167z" />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M20.4 14.399a2.4 2.4 0 110-4.8 2.4 2.4 0 010 4.8zm0 1.2a3.6 3.6 0 110-7.2 3.6 3.6 0 010 7.2zM3.6 14.399a2.4 2.4 0 110-4.8 2.4 2.4 0 010 4.8zm0 1.2a3.6 3.6 0 110-7.2 3.6 3.6 0 010 7.2zM7.2 22.8a2.4 2.4 0 110-4.8 2.4 2.4 0 010 4.8zm0 1.2a3.6 3.6 0 110-7.2 3.6 3.6 0 010 7.2zM7.2 6a2.4 2.4 0 110-4.8 2.4 2.4 0 010 4.8zm0 1.2a3.6 3.6 0 110-7.2 3.6 3.6 0 010 7.2z"
      />
    </SvgIcon>
  ),

  hasAndBelongsToMany: (
    <SvgIcon
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M20.4 14.4a2.4 2.4 0 100-4.8 2.4 2.4 0 000 4.8zm0 1.2a3.6 3.6 0 100-7.2 3.6 3.6 0 000 7.2zM3.6 14.4a2.4 2.4 0 100-4.8 2.4 2.4 0 000 4.8zm0 1.2a3.6 3.6 0 100-7.2 3.6 3.6 0 000 7.2zM20.4 22.8a2.4 2.4 0 100-4.8 2.4 2.4 0 000 4.8zm0 1.2a3.6 3.6 0 100-7.2 3.6 3.6 0 000 7.2zM20.4 6a2.4 2.4 0 100-4.8 2.4 2.4 0 000 4.8zm0 1.2a3.6 3.6 0 100-7.2 3.6 3.6 0 000 7.2z"
      />
      <path d="M6.24 11.28H18v1.44H6.24v-1.44z" />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M3.6 22.8a2.4 2.4 0 110-4.8 2.4 2.4 0 010 4.8zm0 1.2a3.6 3.6 0 110-7.2 3.6 3.6 0 010 7.2zM3.6 6a2.4 2.4 0 110-4.8 2.4 2.4 0 010 4.8zm0 1.2a3.6 3.6 0 110-7.2 3.6 3.6 0 010 7.2z"
      />
      <path d="M18.328 13.863L6.49 19.765l-.652-1.307 11.838-5.902.652 1.307zM18.358 10.078L6.398 4.115l-.646 1.294 11.961 5.963.645-1.294z" />
      <path d="M18.323 18.83L6.252 12.813l-.643 1.29 12.071 6.019.643-1.29zM18.136 5.228L6.207 11.176l-.653-1.311 11.928-5.948.654 1.311z" />
    </SvgIcon>
  ),

  hasMany: (
    <SvgIcon
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M3.6 14.132a2.4 2.4 0 100-4.8 2.4 2.4 0 000 4.8zm0 1.2a3.6 3.6 0 100-7.2 3.6 3.6 0 000 7.2z"
      />
      <path d="M6.24 11.011h13.44v1.44H6.24v-1.44z" />
      <path d="M5.872 10.43l8.347-6.176.86 1.163-8.347 6.176-.86-1.162zM5.9 13.087l8.346 6.177.864-1.168-8.347-6.176-.864 1.167zM18.72 8.613l5.28 3.12-5.28 3.12v-6.24z" />
      <path d="M12.72 2.633L18.82 2 16.43 7.649 12.72 2.633zM12.72 21.307l6.1.633-2.389-5.649-3.711 5.016z" />
    </SvgIcon>
  ),
};

export const RelatedIcon: React.FC<RelatedIconsProps> = (props) => {
  const { name } = props;

  return icons[name];
};
