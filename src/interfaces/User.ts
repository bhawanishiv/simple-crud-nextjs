export type IUser = {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  role: 'ADMIN' | 'USER';
};
