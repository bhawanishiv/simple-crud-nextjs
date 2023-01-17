export type IUser = {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  role: 'ADMIN' | 'USER';
};
