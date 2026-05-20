import { UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";

type UsernameFieldProps = {
  id: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
};

export function UsernameField({ id, value, error, onChange, onBlur }: UsernameFieldProps) {
  return (
    <div className="login-field-group">
      <label className="login-field-label" htmlFor={id}>
        Username
      </label>
      <div className="login-input-shell">
        <div className="login-input-icon" aria-hidden="true">
          <UserRound aria-hidden="true" />
        </div>
        <Input
          id={id}
          name="username"
          type="text"
          autoComplete="username"
          className={`login-input-shadcn focus-visible:ring-0 focus-visible:ring-offset-0 ${error ? "login-input-shadcn-error" : ""}`}
          placeholder="Enter your username"
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
