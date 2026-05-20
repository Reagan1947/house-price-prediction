import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";

type EmailFieldProps = {
  id: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
};

export function EmailField({ id, value, error, onChange, onBlur }: EmailFieldProps) {
  return (
    <div className="login-field-group">
      <label className="login-field-label" htmlFor={id}>
        Email address
      </label>
      <div className="login-input-shell">
        <div className="login-input-icon" aria-hidden="true">
          <Mail aria-hidden="true" />
        </div>
        <Input
          id={id}
          name="email"
          type="email"
          autoComplete="email"
          className={`login-input-shadcn focus-visible:ring-0 focus-visible:ring-offset-0 ${error ? "login-input-shadcn-error" : ""}`}
          placeholder="Enter your email"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      </div>
    </div>
  );
}
