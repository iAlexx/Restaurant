"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";
import {
  buttonPrimaryClassName,
  inputClassName,
  labelClassName,
} from "@/components/dashboard/form-ui";

const initialState: LoginState = {};

interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      {redirectTo ? (
        <input type="hidden" name="redirect" value={redirectTo} />
      ) : null}

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className={labelClassName()}>
          البريد الإلكتروني
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          className={inputClassName()}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className={labelClassName()}>
          كلمة المرور
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          dir="ltr"
          className={inputClassName()}
        />
      </div>

      {state.error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className={buttonPrimaryClassName()}
      >
        {isPending ? "جاري الدخول..." : "تسجيل الدخول"}
      </button>
    </form>
  );
}
