import { Input } from "@/components/ui/input";
import { LockKeyhole } from "lucide-react";

type PasswordFieldProps = {
  id: string;
  value: string;
  error?: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggleVisible: () => void;
};

export function PasswordField({
  id,
  value,
  error,
  visible,
  onChange,
  onToggleVisible,
}: PasswordFieldProps) {
  return (
    <div className="login-field-group">
      <label className="login-field-label" htmlFor={id}>
        Password
      </label>
      <div className="login-input-shell">
        <div className="login-input-icon" aria-hidden="true">
          <LockKeyhole aria-hidden="true" />
        </div>
        <Input
          id={id}
          name="password"
          type={visible ? "text" : "password"}
          autoComplete="current-password"
          className={`login-input-shadcn login-input-shadcn-with-trailing focus-visible:ring-0 focus-visible:ring-offset-0 ${error ? "login-input-shadcn-error" : ""}`}
          placeholder="Enter your password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          className="login-visibility-toggle-shadcn"
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={onToggleVisible}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path
                d="M3 4.5 21 19.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M9.5 9.2A3.5 3.5 0 0 1 14.8 14.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M5.5 7.8A14 14 0 0 1 12 6c5.6 0 9 4 10 6-0.4 0.8-1.2 2-2.4 3.1"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18.4 15.8A13.8 13.8 0 0 1 12 18c-5.6 0-9-4-10-6 0.4-0.7 1-1.7 2-2.7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path
                d="M2 12c1-2 4.4-6 10-6s9 4 10 6c-1 2-4.4 6-10 6S3 14 2 12Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="12"
                r="3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
