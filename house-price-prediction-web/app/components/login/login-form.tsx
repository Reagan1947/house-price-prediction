"use client";

import { type FormEvent, useId, useState } from "react";
import { EmailField } from "./email-field";
import { PasswordField } from "./password-field";

type LoginFormProps = {
  portalPath: string;
};

type ApiResponse<T> = {
  code: number;
  msg: string;
  data: T | null;
};

type LoginSuccessPayload = {
  user?: {
    username?: string;
  };
};

const EMAIL_REQUIRED_MESSAGE = "Please enter your email.";
const EMAIL_INVALID_MESSAGE =
  "Currently only email account login is supported, please enter a correct email address.";
const PASSWORD_REQUIRED_MESSAGE = "Please enter your password.";
const LOGIN_FAILED_MESSAGE =
  "The email or password for the account is incorrect. Please check and try again.";
const DEFAULT_LOGIN_ERROR_MESSAGE = "Unable to sign in right now. Please try again.";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function readLoginResponse(response: Response): Promise<ApiResponse<unknown> | null> {
  try {
    return (await response.json()) as ApiResponse<unknown>;
  } catch {
    return null;
  }
}

function readUserName(input: unknown): string | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const user = (input as LoginSuccessPayload).user;
  const userName = typeof user?.username === "string" ? user.username.trim() : "";
  return userName.length > 0 ? userName : null;
}

export function LoginForm({ portalPath }: LoginFormProps) {
  const emailId = useId();
  const passwordId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedEmail = email.trim();
  const isSubmitDisabled = isSubmitting || password.trim().length === 0;

  const validateEmailField = (): boolean => {
    if (normalizedEmail.length === 0) {
      setEmailError(EMAIL_REQUIRED_MESSAGE);
      return false;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setEmailError(EMAIL_INVALID_MESSAGE);
      return false;
    }

    setEmailError(undefined);
    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const emailValid = validateEmailField();
    const passwordValue = password.trim();

    if (passwordValue.length === 0) {
      setPasswordError(PASSWORD_REQUIRED_MESSAGE);
    }

    if (!emailValid || passwordValue.length === 0) {
      return;
    }

    setIsSubmitting(true);
    setPasswordError(undefined);
    setSubmitError(undefined);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          email: normalizedEmail,
          password: passwordValue,
        }),
      });
      const payload = await readLoginResponse(response);

      if (response.status !== 200) {
        setSubmitError(LOGIN_FAILED_MESSAGE);
        return;
      }

      const userName = readUserName(payload?.data);
      if (userName) {
        window.sessionStorage.setItem("portal_user_name", userName);
      } else {
        window.sessionStorage.removeItem("portal_user_name");
      }

      window.location.href = portalPath || "/portal";
    } catch {
      setSubmitError(DEFAULT_LOGIN_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <div className="login-heading-group">
        <h1 className="login-heading" id="login-page-heading">
          Hello !
          <br />
          Log in to your account
        </h1>
      </div>

      <fieldset className="login-fields">
        <legend className="sr-only">Account sign in form</legend>
        <EmailField
          id={emailId}
          value={email}
          error={emailError}
          onChange={(value) => {
            setEmail(value);
            const trimmed = value.trim();
            if (emailError && trimmed.length > 0 && EMAIL_PATTERN.test(trimmed)) {
              setEmailError(undefined);
            }
          }}
          onBlur={validateEmailField}
        />

        {emailError ? (
          <p className="login-error-text" role="alert" id={`${emailId}-error`}>
            {emailError}
          </p>
        ) : null}

        <PasswordField
          id={passwordId}
          value={password}
          error={passwordError}
          visible={isPasswordVisible}
          onChange={(value) => {
            setPassword(value);
            if (passwordError && value.trim().length > 0) {
              setPasswordError(undefined);
            }
          }}
          onToggleVisible={() => setIsPasswordVisible((current) => !current)}
        />

        {passwordError ? (
          <p className="login-error-text" role="alert" id={`${passwordId}-error`}>
            {passwordError}
          </p>
        ) : null}

        {submitError ? (
          <p className="login-error-text" role="alert">
            {submitError}
          </p>
        ) : null}
      </fieldset>

      <button className="login-submit-btn" type="submit" disabled={isSubmitDisabled}>
        {isSubmitting ? "Signing In..." : "Log in"}
      </button>
    </form>
  );
}
