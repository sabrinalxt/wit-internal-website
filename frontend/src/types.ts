export type User = {
  user_id: string | number;
  first_name: string;
  last_name: string;
  email: string;
};

// Shape returned by POST /auth/login
export type LoginResponse = {
  token: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    roles: string[];
  };
};
