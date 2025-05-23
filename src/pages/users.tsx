import React from 'react';
import { NextPage } from 'next';

import useSwr from 'swr';

import CircularProgress from '@mui/material/CircularProgress';

import Users from '@/components/ui/Users';

import { IUser } from '@/interfaces/User';

const getUsers = async (skip: number = 0, limit: number = 10) => {
  const res = await fetch(`/api/users?limit=${limit}&skip=${skip}`);
  const data = await res.json();
  return data;
};

const UsersPage: NextPage = (props) => {
  const {} = props;
  const { isLoading, data, mutate } = useSwr('users', () => getUsers());

  const handleUsersDataChange = (users: IUser[]) => {
    mutate();
  };

  const renderUsersPage = () => {
    if (isLoading) return <CircularProgress />;
    if (!data) return <div>Something went wrong</div>;
    return (
      <Users
        users={data.users}
        count={data.count}
        onUsersUpdate={handleUsersDataChange}
      />
    );
  };

  return renderUsersPage();
};

export default UsersPage;
