import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    authenticated: null,
    token: null,
    user: null,
  });

  useEffect(() => {
    const loadTokenUser = async () => {
      const token = Cookies.get("TOKEN_KEY");
      const user = Cookies.get("USER_KEY");

      if (token && user) {
        try {
          const parsedUser = JSON.parse(user);
          setAuthState({ user: parsedUser, authenticated: true, token: token });
        } catch (err) {
          setAuthState({ authenticated: false, token: null, user: null });
        }
      } else setAuthState({ authenticated: false, token: null, user: null });
    };

    loadTokenUser();
  }, []);

  const setLogin = async (user, token) => {
    try {
      setAuthState({ authenticated: true, token: token, user: user });
      Cookies.set("USER_KEY", JSON.stringify(user), { expires: 30 });
      Cookies.set("TOKEN_KEY", token, { expires: 30 });

      return "success";
    } catch (err) {
      return "error";
    }
  };

  const logout = async () => {
    Cookies.remove("TOKEN_KEY");
    Cookies.remove("USER_KEY");

    setAuthState({ authenticated: false, token: null, user: null });
  };

  const setValue = (key, value) => {
    setAuthState((prevState) => {
      if (!prevState.user) return prevState;
      const updatedUser = { ...prevState.user, [key]: value };
      Cookies.set("USER_KEY", JSON.stringify(updatedUser));
      return { ...prevState, user: updatedUser };
    });
  };

  const value = { setLogin, logout, authState, setAuthState, setValue };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};