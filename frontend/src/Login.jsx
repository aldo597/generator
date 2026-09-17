// src/Login.jsx
import './App.css';
import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    try {
      if (isRegistering) {
        const userCredential =
          await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );

        await sendEmailVerification(userCredential.user);

        setInfo(
          "Verification email sent! Please check your inbox — sometimes it lands in the spam folder."
        );

        await signOut(auth);
        return;
      }

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      if (!userCredential.user.emailVerified) {
        setError(
          "Please verify your email before logging in."
        );
        await signOut(auth);
        return;
      }

      onLogin();

    } catch (err) {
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("This email is already in use.");
          break;

        case "auth/invalid-email":
          setError("Invalid email address.");
          break;

        case "auth/weak-password":
          setError("Password must be at least 6 characters.");
          break;

        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError(
            "Incorrect password or user does not exist."
          );
          break;

        default:
          setError("Error: " + err.message);
          break;
      }
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setInfo("");

    if (!email) {
      setInfo("Please enter your email address first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);

      setInfo(
        "Password reset email sent! Please also check your spam folder."
      );
    } catch (err) {
      switch (err.code) {
        case "auth/user-not-found":
          setError("No user found with this email.");
          break;

        case "auth/invalid-email":
          setError("Invalid email address.");
          break;

        default:
          setError("Error: " + err.message);
          break;
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {!isRegistering && (
          <div className="login-register-top">
            <span>Noch nicht registriert?</span>{" "}
            <button
              type="button"
              onClick={() => {
                setIsRegistering(true);
                setInfo("");
                setError("");
              }}
            >
              Register
            </button>
          </div>
        )}

        <h2 className="login-title">
          {isRegistering ? "Register" : "Login"}
        </h2>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        {info && (
          <div className="login-info">
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="login-field">
            <label htmlFor="email">
              E-Mail-Adresse
            </label>

            <input
              id="email"
              type="email"
              placeholder="E-Mail-Adresse"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">
              Passwort
            </label>

            <input
              id="password"
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isRegistering && (
            <div className="login-options">

              <button
                type="button"
                className="forgot-password-link"
                onClick={handleForgotPassword}
              >
                Passwort vergessen?
              </button>
            </div>
          )}

          <button
            type="submit"
            className="login-submit-button"
          >
            {isRegistering ? "Register" : "Login"}
          </button>

        </form>

        {isRegistering && (
          <div className="login-register-section">
            <p>Bereits registriert?</p>

            <button
              type="button"
              className="login-secondary-button"
              onClick={() => {
                setIsRegistering(false);
                setInfo("");
                setError("");
              }}
            >
              Login
            </button>
          </div>
        )}

      </div>
    </div>
  );}