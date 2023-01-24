import { IUser } from '@/interfaces/User';
import React, { useState, useEffect, useCallback } from 'react';
import AddOrUpdateUserDialog from './AddOrUpdateUserDialog';

const columns: { title: string; key: keyof IUser }[] = [
  { title: 'First Name', key: 'firstName' },
  { title: 'Last Name', key: 'lastName' },
  { title: 'Email', key: 'email' },
  { title: 'Role', key: 'role' },
  { title: 'Last updated', key: 'updatedAt' },
];

type UsersProps = {};

const Users: React.FC<UsersProps> = (props) => {
  const {} = props;

  const [users, setUsers] = useState<IUser[]>([]);
  const [count, setCount] = useState(0);
  const [addOrUpdateUserDialogOpen, setAddOrUpdateUserDialogOpen] = useState<
    boolean | { user: IUser; index: number }
  >(false);

  const getUsers = async (skip: number = 0, limit: number = 10) => {
    const res = await fetch(`/api/users?limit=${limit}&skip=${skip}`);
    const data = await res.json();
    if (!data || !data.users) return;
    setCount(data.count);
    setUsers(data.users);
  };

  const handleAddUserRequest = useCallback(() => {
    setAddOrUpdateUserDialogOpen(true);
  }, []);

  const handleAddOrUpdateUserDialogClose = () => {
    setAddOrUpdateUserDialogOpen(false);
  };

  const handleEditUser = (user: IUser, index: number) => async (e: any) => {
    setAddOrUpdateUserDialogOpen({ user, index });
  };

  const handleRemoveUser = (user: IUser, index: number) => async (e: any) => {
    try {
      const res = await fetch(`/api/users?uid=${user.uid}`, {
        method: 'DELETE',
      });
      if (!res.ok) return;
      const newUsers = [...users];
      newUsers.splice(index, 1);
      setUsers(newUsers);
    } catch (e) {}
  };

  const handleAddOrUpdateDialogSuccess = ({ user }: { user: IUser }) => {
    if (typeof addOrUpdateUserDialogOpen === 'object') {
      const newUsers = [...users];
      newUsers[addOrUpdateUserDialogOpen.index] = user;
      setUsers(newUsers);
      setAddOrUpdateUserDialogOpen(false);
      return;
    }

    const newUsers = [user, ...users];
    setUsers(newUsers);
    setAddOrUpdateUserDialogOpen(false);
  };

  const renderUsers = () => {
    return (
      <>
        <div>
          <div className="py-1 actions__container">
            <div>
              <h1>Users</h1>
            </div>
            <div>
              <button className="app__button" onClick={handleAddUserRequest}>
                Add a user
              </button>
            </div>
          </div>
          <div>
            <table className="table">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key}>{column.title}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => {
                  return (
                    <tr key={user.uid}>
                      {columns.map((column) => (
                        <td key={column.key}>{user[column.key]?.toString()}</td>
                      ))}
                      <td className="table__actions">
                        <button
                          className="app__button-text action"
                          onClick={handleEditUser(user, i)}
                        >
                          Edit
                        </button>
                        <button
                          className="app__button-text action"
                          onClick={handleRemoveUser(user, i)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <AddOrUpdateUserDialog
          open={Boolean(addOrUpdateUserDialogOpen)}
          user={
            typeof addOrUpdateUserDialogOpen === 'object'
              ? addOrUpdateUserDialogOpen.user
              : undefined
          }
          onSuccess={handleAddOrUpdateDialogSuccess}
          onClose={handleAddOrUpdateUserDialogClose}
        />
      </>
    );
  };

  useEffect(() => {
    getUsers(0, 100);
  }, []);

  return renderUsers();
};

export default Users;
