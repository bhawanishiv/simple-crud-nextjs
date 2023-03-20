export type OperationRequestType = 'SEARCH' | 'UPDATE' | 'CREATE';

export type SearchOperationRequest = {
  type: 'SEARCH';
  params: {
    filter: any;
    limit: number;
    skip: number;
    sort: any;
  };
};

export type UpdateOperationRequest<T = any> = {
  type: 'UPDATE';
  params: {
    filter: any;
  };
  update: T;
};

export type CreateOperationRequest = {
  type: 'CREATE';
  params: {
    query: string;
  };
};

export type OperationRequest<T = any> =
  | SearchOperationRequest
  | UpdateOperationRequest<T>
  | CreateOperationRequest;
