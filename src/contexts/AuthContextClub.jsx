import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";

const AuthContextClub = createContext();

export const useAuthClub = () => {
    return useContext(AuthContextClub);
};

export const AuthProviderClub = ({ children }) => {
  const [authState, setAuthState] = useState({
    authenticated: null,
    token: null,
    club: null,
  });

  useEffect(() => {
    const loadTokenClub = async () => {
      const token = Cookies.get("CLUB_TOKEN_KEY");
      const club = Cookies.get("CLUB_USER_KEY");

      if (token && club) {
        try {
          const parsedClub = JSON.parse(club);
          setAuthState({ club: parsedClub, authenticated: true, token: token });
        } catch (err) {
          setAuthState({ authenticated: false, token: null, club: null });
        }
      } else setAuthState({ authenticated: false, token: null, club: null });
    };

    loadTokenClub();
  }, []);

  const setLogin = async (club, token) => {
    try {
      setAuthState({ authenticated: true, token: token, club: club });
      Cookies.set("CLUB_USER_KEY", JSON.stringify(club), { expires: 30 });
      Cookies.set("CLUB_TOKEN_KEY", token, { expires: 30 });

      return "success";
    } catch (err) {
      return "error";
    }
  };

  const logout = async () => {
    Cookies.remove("CLUB_TOKEN_KEY");
    Cookies.remove("CLUB_USER_KEY");

    setAuthState({ authenticated: false, token: null, club: null });
  };

  const setValue = (key, value) => {
    setAuthState((prevState) => {
      if (!prevState.club) return prevState;
      const updatedClub = { ...prevState.club, [key]: value };
      Cookies.set("CLUB_USER_KEY", JSON.stringify(updatedClub));
      return { ...prevState, club: updatedClub };
    });
  };

  const updateClub = async (club) => {
    try {
      setAuthState((prevState) => {
        const updatedState = { ...prevState, club: club };
        Cookies.set("CLUB_USER_KEY", JSON.stringify(club), { expires: 30 });
        return updatedState;
      });
      return "success";
    } catch (err) {
      return "error";
    }
  };

  const value = { setLogin, logout, authState, setAuthState, setValue, updateClub };

  return <AuthContextClub.Provider value={value}>{children}</AuthContextClub.Provider>;
};

