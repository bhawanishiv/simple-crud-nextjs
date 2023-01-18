import React, { useEffect } from 'react';

import { SubmitHandler, useForm } from 'react-hook-form';

import Dialog from '@/components/Dialog';
import { IUser } from '@/interfaces/User';

const roles = [
  { value: 'USER', title: 'User' },
  { value: 'ADMIN', title: 'Admin' },
];

type AddOrUpdateUserDialogProps = {
  open: boolean;
  user?: IUser;
  onClose: (e?: any) => void;
  onSuccess: (res: { user: IUser }) => void | Promise<void>;
};

const AddOrUpdateUserDialog: React.FC<AddOrUpdateUserDialogProps> = (props) => {
  const { open, user, onSuccess, onClose } = props;

  const { formState, register, setError, reset, handleSubmit } = useForm({
    mode: 'all',
  });

  const { errors, isSubmitting } = formState;

  const handleClose = () => {
    reset({ firstName: '', lastName: '', email: '', role: 'USER' });
    onClose();
  };
  const handleAddOrUpdateUser: SubmitHandler<any> = async (data) => {
    try {
      const res = await fetch('/api/users', {
        method: user ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user ? { ...data, uid: user.uid } : data),
      });

      const resData = await res.json();

      if (!res.ok) {
        if (resData.message) {
          setError('email', { type: 'custom', message: resData.message });
          return;
        }
      }
      await onSuccess(resData);
    } catch (e) {
      // console.log(`e->`, e);
    }
  };

  const renderAddOrUpdateUserDialog = () => {
    return (
      <Dialog open={open} onClose={handleClose}>
        <h2>Add a user</h2>
        <form onSubmit={handleSubmit(handleAddOrUpdateUser)}>
          <div className="py-1">
            <label>First name</label>
            <div className="my-1">
              <input
                type="text"
                className="app__input"
                placeholder="Enter the First name"
                {...register('firstName', {
                  required: 'Please enter the first name',
                  maxLength: {
                    value: 50,
                    message: 'The first name is too long',
                  },
                })}
              />
              {errors.firstName && (
                <div>
                  <span className="app__input-error">
                    {errors.firstName.message as string}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="py-1">
            <label>Last name</label>
            <div className="my-1">
              <input
                type="text"
                className="app__input"
                placeholder="Enter the Last name"
                {...register('lastName', {
                  required: 'Please enter the last name',
                  maxLength: {
                    value: 50,
                    message: 'The last name is too long',
                  },
                })}
              />
              {errors.lastName && (
                <div>
                  <span className="app__input-error">
                    {errors.lastName.message as string}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="py-1">
            <label>Email name</label>
            <div className="my-1">
              <input
                type="email"
                className="app__input"
                placeholder="Enter the Email address"
                {...register('email', {
                  required: 'Please enter the email address',
                  pattern: {
                    value:
                      /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
                    message: 'Please enter a valid email address',
                  },
                })}
              />
              {errors.email && (
                <div>
                  <span className="app__input-error">
                    {errors.email.message as string}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="py-1">
            <label>Role</label>
            <div className="my-1">
              <select
                {...register('role', {
                  required: 'Please select the role',
                })}
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.title}
                  </option>
                ))}
              </select>
              {errors.role && (
                <div>
                  <span className="app__input-error">
                    {errors.role.message as string}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="py-1 actions__container">
            <div />
            <button
              disabled={isSubmitting}
              className="app__button"
              type="submit"
            >
              Save
            </button>
          </div>
        </form>
      </Dialog>
    );
  };

  useEffect(() => {
    if (open && user) {
      const { role, firstName, lastName, email } = user;
      reset({ firstName, lastName, email, role });
    }
  }, [reset, open, user]);

  return renderAddOrUpdateUserDialog();
};

export default AddOrUpdateUserDialog;
