import React, { useEffect, useState } from 'react';
import {
  Routes,
  Route,
  useNavigate,
  Navigate,
  useLocation,
} from 'react-router-dom';

import { Layout } from "./components/Layout";
import Dashboard from './pages/Dashboard';
import { Login } from './components/Login';
import Signup from './components/Signup';


import axios from 'axios';
import Income from './pages/Income';
import Expense from './pages/Expense';
import Profile from './pages/Profile';

const API_URL = 'http://localhost:4000';

const token =
  localStorage.getItem("token") ||
  sessionStorage.getItem("token");

if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// get transactions from localStorage
const getTransactionFromStorage = () => {
  const saved = localStorage.getItem("transaction");
  return saved ? JSON.parse(saved) : [];
};

// protected route
const ProtectRoute = ({ user, children }) => {
  const localToken = localStorage.getItem("token");
  const sessionToken = sessionStorage.getItem("token");

  const hasToken = localToken || sessionToken;

  if (!user || !hasToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// scroll top
const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [location.pathname]);

  return null;
};

export const App = () => {

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [transaction, setTransaction] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  // save auth
  const persistAuth = (userObj, tokenStr, remember = false) => {

    try {

      if (remember) {

        if (userObj) {
          localStorage.setItem("user", JSON.stringify(userObj));
        }

        if (tokenStr) {
          localStorage.setItem("token", tokenStr);
        }

        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");

      } else {

        if (userObj) {
          sessionStorage.setItem("user", JSON.stringify(userObj));
        }

        if (tokenStr) {
          sessionStorage.setItem("token", tokenStr);
        }

        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }

      setUser(userObj || null);
      setToken(tokenStr || null);

    } catch (err) {
      console.error("persistAuth error:", err);
    }
  };

  // clear auth
  const clearAuth = () => {

    try {

      localStorage.removeItem("user");
      localStorage.removeItem("token");

      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");

    } catch (err) {
      console.error("clearAuth error:", err);
    }

    setUser(null);
    setToken(null);
  };

  // update user
  const updateUserData = (updatedUser) => {

    setUser(updatedUser);

    const localToken = localStorage.getItem("token");
    const sessionToken = sessionStorage.getItem("token");

    if (localToken) {
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } else if (sessionToken) {
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  // bootstrap auth
  useEffect(() => {

    const bootstrapAuth = async () => {

      try {

        const localUserRaw = localStorage.getItem("user");
        const sessionUserRaw = sessionStorage.getItem("user");

        const localToken = localStorage.getItem("token");
        const sessionToken = sessionStorage.getItem("token");

        const storedUser = localUserRaw
          ? JSON.parse(localUserRaw)
          : sessionUserRaw
            ? JSON.parse(sessionUserRaw)
            : null;

        const storedToken = localToken || sessionToken || null;

        const tokenFromLocal = !!localToken;

        // if already have user
        if (storedUser && storedToken) {

          setUser(storedUser);
          setToken(storedToken);

          return;
        }

        // if token exists but user not exists
        if (storedToken) {

          try {

            const res = await axios.get(
              `${API_URL}/api/user/me`,
              {
                headers: {
                  Authorization: `Bearer ${storedToken}`,
                },
              }
            );

            // FIX HERE
            const profile = res.data.user || res.data;

            persistAuth(
              profile,
              storedToken,
              tokenFromLocal
            );

          } catch (fetchErr) {

            console.warn(
              "Could not fetch profile:",
              fetchErr
            );

            clearAuth();
          }
        }

      } catch (err) {

        console.error(
          "Error bootstrapping auth:",
          err
        );

      } finally {

        setIsLoading(false);

        try {

          setTransaction(
            getTransactionFromStorage()
          );

        } catch (txErr) {

          console.error(
            "Error loading transactions:",
            txErr
          );
        }
      }
    };

    bootstrapAuth();

  }, []);

  // save transactions
  useEffect(() => {

    try {

      localStorage.setItem(
        "transaction",
        JSON.stringify(transaction)
      );

    } catch (err) {

      console.error(
        "Error saving transactions:",
        err
      );
    }

  }, [transaction]);

  // login
  const handleLogin = (
    userData,
    remember = false,
    tokenFromApi = null
  ) => {

    persistAuth(
      userData,
      tokenFromApi,
      remember
    );

    navigate("/");
  };

  // signup
  const handleSignup = (
    userData,
    remember = false,
    tokenFromApi = null
  ) => {

    persistAuth(
      userData,
      tokenFromApi,
      remember
    );

    navigate("/");
  };

  // logout
  const onLogout = () => {

    clearAuth();

    navigate("/login");
  };

  // transactions
  const addTransaction = (newTransaction) =>
    setTransaction((prev) => [
      newTransaction,
      ...prev,
    ]);

  const editTransaction = (
    id,
    updatedTransaction
  ) =>
    setTransaction((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...updatedTransaction, id }
          : t
      )
    );

  const deleteTransaction = (id) =>
    setTransaction((prev) =>
      prev.filter((t) => t.id !== id)
    );

  const refreshTransactions = () =>
    setTransaction(
      getTransactionFromStorage()
    );

  // loading screen
  if (isLoading) {

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">

        <div className="flex flex-col items-center">

          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>

          <p className="mt-4 text-gray-600">
            Loading...
          </p>

        </div>

      </div>
    );
  }

  return (
    <>

      <ScrollToTop />

      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={
            <Login onLogin={handleLogin} />
          }
        />

        {/* SIGNUP */}
        <Route
          path="/signup"
          element={
            <Signup onSignup={handleSignup} />
          }
        />

        {/* PROTECTED ROUTES */}
        <Route
          element={
            <ProtectRoute user={user}>

              <Layout
                user={user}
                onLogout={onLogout}
                transaction={transaction}
                addTransaction={addTransaction}
                editTransaction={editTransaction}
                deleteTransaction={deleteTransaction}
                refreshTransactions={refreshTransactions}
                updateUserData={updateUserData}
              />

            </ProtectRoute>
          }
        >

          {/* DASHBOARD */}
          <Route
            path="/"
            element={
              <Dashboard
                transaction={transaction}
                addTransaction={addTransaction}
                editTransaction={editTransaction}
                deleteTransaction={deleteTransaction}
                refreshTransactions={refreshTransactions}
              />
            }
          />

          <Route
            path='/income'
            element={
              <Income
                transaction={transaction}
                addTransaction={addTransaction}
                editTransaction={editTransaction}
                deleteTransaction={deleteTransaction}
                refreshTransactions={refreshTransactions}
              />
            }
          />

          <Route
            path='/expense'
            element={
              <Expense
                transaction={transaction}
                addTransaction={addTransaction}
                editTransaction={editTransaction}
                deleteTransaction={deleteTransaction}
                refreshTransactions={refreshTransactions}
              />
            }
          />

          <Route
            path='/profile'
            element={
              <Profile user={user}
                onUpdateProfile={updateUserData}
                onLogout={onLogout}
              />
            }
          />
        </Route>

        <Route path='*' element={<Navigate to={user ? "/" : "/login"} replace />} 
        />
      </Routes>
    </>
  );
};

export default App;