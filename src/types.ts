// eslint-disable-next-line @typescript-eslint/no-unused-vars
type CoinsType = {
    coins: number;
  };
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type UserSummaries = {
    id: string;
    url: string;
    response?: string | null;
    title?: string | null;
    created_at: Date;
  };
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type ChatType = {
    id: string;
    url: string;
    response?: string | null;
    user_id: number;
    created_at: Date;
    title: string;
  };
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type AddUrlErrorType = {
    url?: string;
    user_id?: string;
  };
  
  // types/payment.ts
export enum TransactionStatus {
  CANCELLED = 0,
  PENDING = 1,
  INITIAL = 2,
  COMPLETED = 3,
  FAILED = 4
}

export interface Transaction {
  id: string;
  status: TransactionStatus;
  // Add other transaction fields as needed
}
  