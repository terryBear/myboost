import type { Tokens } from "./api";
import { post } from "./api";

/** Django SimpleJWT: TokenObtainPairView returns { access, refresh } */
export const useAuthenticate = () => {
  const login = async (username: string, password: string): Promise<Tokens> => {
    const response = await post<Tokens>(`/token/`, {
      username,
      password,
    });
    return response;
  };
  const refresh = async (refreshToken: string): Promise<Tokens> => {
    const response = await post<Tokens>(`/token/refresh/`, {
      refresh: refreshToken,
    });
    return response;
  };
  /** Django SimpleJWT verify expects body: { token: "<access_token>" } */
  const verify = async (token: string): Promise<{ detail?: string }> => {
    const response = await post<{ detail?: string }>(`/token/verify/`, {
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
