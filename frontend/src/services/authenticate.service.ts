import { post } from "./api";

export const useAuthenticate = () => {
  const login = async (username: string, password: string) => {
    const response = await post<{ token: string }>(`/token/`, {
      username,
      password,
    });
    return response;
  };
  const refresh = async (refresh: string) => {
    const response = await post<{ token: string }>(`/token/refresh/`, {
      refresh,
    });
    return response;
  };
  const verify = async (token: string) => {
    const response = await post<{ token: string }>(`/token/verify/`, {
      token,
    });
    return response;
  };

  return {
    login,
    refresh,
    verify,
  };
};
