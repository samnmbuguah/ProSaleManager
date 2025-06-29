import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Handle navigation after successful auth
  useEffect(() => {
    if (shouldNavigate) {
      setLocation("/pos");
      setShouldNavigate(false);
    }
  }, [shouldNavigate, setLocation]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData | RegisterFormData) => {
    try {
      setIsLoading(true);
      console.log("Sending auth request with data:", {
        ...data,
        password: "***",
      });

      if (isLogin) {
        await login({ email: data.email, password: data.password });
        setShouldNavigate(true);
      } else {
        await register({
          email: data.email,
          password: data.password,
          name: (data as RegisterFormData).name,
        });
        setShouldNavigate(true);
      }
    } catch (error) {
      console.error("Auth error:", error);
      const form = isLogin ? loginForm : registerForm;

      // Show error toast
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description:
          error instanceof Error
            ? error.message
            : "Please check your credentials and try again",
      });

      // Set form error
      form.setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Authentication failed. Please check your credentials.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    loginForm.reset();
    registerForm.reset();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? "Login" : "Register"}</CardTitle>
          <CardDescription>
            {isLogin
              ? "Welcome back! Please login to continue."
              : "Create an account to get started."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(isLogin ? loginForm : registerForm).handleSubmit(
              onSubmit,
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                disabled={isLoading}
                {...(isLogin
                  ? loginForm.register("email")
                  : registerForm.register("email"))}
              />
              {(isLogin
                ? loginForm.formState.errors.email
                : registerForm.formState.errors.email) && (
                  <p className="text-sm font-medium text-destructive">
                    {isLogin
                      ? loginForm.formState.errors.email?.message
                      : registerForm.formState.errors.email?.message}
                  </p>
                )}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="name"
                  autoComplete="name"
                  disabled={isLoading}
                  {...registerForm.register("name")}
                />
                {registerForm.formState.errors.name && (
                  <p className="text-sm font-medium text-destructive">
                    {registerForm.formState.errors.name.message}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  disabled={isLoading}
                  {...(isLogin
                    ? loginForm.register("password")
                    : registerForm.register("password"))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {(isLogin
                ? loginForm.formState.errors.password
                : registerForm.formState.errors.password) && (
                  <p className="text-sm font-medium text-destructive">
                    {isLogin
                      ? loginForm.formState.errors.password?.message
                      : registerForm.formState.errors.password?.message}
                  </p>
                )}
            </div>

            {(isLogin
              ? loginForm.formState.errors.root
              : registerForm.formState.errors.root) && (
                <p className="text-sm font-medium text-destructive">
                  {isLogin
                    ? loginForm.formState.errors.root?.message
                    : registerForm.formState.errors.root?.message}
                </p>
              )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isLogin ? "Login" : "Register"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <Button variant="link" onClick={toggleMode} disabled={isLoading}>
              {isLogin ? "Sign up" : "Login"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
