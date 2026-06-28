import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { login } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import { getErrorMessage } from "@/lib/utils";
import { toast } from "@/store/toastStore";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate("/");
    },
    onError: (error) => {
      toast.error("Login Failed", getErrorMessage(error));
    },
  });

  return (
    <>
      <h1 className="text-lg font-semibold text-text-primary mb-1">
        Welcome back
      </h1>
      <p className="text-sm text-text-muted mb-6">
        Sign in to your smurl account
      </p>

      <form
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="space-y-4"
      >
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />

        <Button
          type="submit"
          className="w-full"
          loading={mutation.isPending}
          size="lg"
        >
          Sign in
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-text-muted">
        Don&apos;t have an account?{" "}
        <Link
          to="/register"
          className="text-brand-600 font-medium hover:underline"
        >
          Create one
        </Link>
      </p>
    </>
  );
}
