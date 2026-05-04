import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 h-8 w-40 rounded-md bg-zinc-200 dark:bg-zinc-800" />
        <div className="space-y-4">
          <div className="h-10 rounded-md bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-10 rounded-md bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-10 rounded-md bg-zinc-900 dark:bg-white" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
