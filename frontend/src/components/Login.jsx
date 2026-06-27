import React, { useState } from 'react';
import { loginStyles } from '../assets/dummyStyles';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export const Login = ({ onLogin, API_URL = 'https://trackexpense-s5n5.onrender.com' }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // fetch profile
  const fetchProfile = async (token) => {
    if (!token) return null;

    const res = await axios.get(`${API_URL}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return res.data;
  };

  const persistAuth = (profile, token) => {
    const storage = rememberMe ? localStorage : sessionStorage;

    if (token) storage.setItem("token", token);
    if (profile) storage.setItem("user", JSON.stringify(profile));
  };

  // login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await axios.post(
        `${API_URL}/api/user/login`,
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      const data = res.data || {};
      const token = data.token;

      let profile = data.user || null;

      if (!profile && token) {
        try {
          profile = await fetchProfile(token);
        } catch (err) {
          console.warn("Profile fetch failed:", err);
          profile = { email };
        }
      }

      if (!profile) profile = { email };

      // save auth
      persistAuth(profile, token);

      // 🔥 IMPORTANT FIX (GLOBAL TOKEN SET)
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      if (typeof onLogin === "function") {
        onLogin(profile, rememberMe, token);
      }

      navigate("/");

      setPassword("");

    } catch (err) {
      console.error("Login Error:", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Login failed"
      );

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={loginStyles.pageContainer}>
      <div className={loginStyles.cardContainer}>
        <div className={loginStyles.header}>
          <div className={loginStyles.avatar}>
            <User className="w-10 h-10 text-white" />
          </div>

          <h1 className={loginStyles.headerTitle}>
            Welcome Back
          </h1>

          <p className={loginStyles.headerSubtitle}>
            Sign in to your ExpenseTracker account
          </p>
        </div>

        <div className={loginStyles.formContainer}>
          {error && (
            <div className={loginStyles.errorContainer}>
              <span className={loginStyles.errorText}>
                {error}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* EMAIL */}
            <div className='mb-6'>
              <label className={loginStyles.label}>
                Email Address
              </label>

              <div className={loginStyles.inputContainer}>
                <Mail className="w-5 h-5" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={loginStyles.input}
                  placeholder="your@example.com"
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className='mb-6'>
              <label className={loginStyles.label}>
                Password
              </label>

              <div className={loginStyles.inputContainer}>
                <Lock className="w-5 h-5" />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={loginStyles.input}
                  placeholder="********"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* REMEMBER */}
            <div className={loginStyles.checkboxContainer}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />

              <label>Remember Me</label>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className={loginStyles.button}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className={loginStyles.signUpContainer}>
            <p>
              Don't have an account?{" "}
              <Link to="/signup">
                Create One
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;