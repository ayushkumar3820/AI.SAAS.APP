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
  
  