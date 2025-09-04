import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const { login, isLoading } = useAuth();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Handle navigation after successful auth
  useEffect(() => {
    if (shouldNavigate && user) {
      // Only clients go to root route (/), everyone else goes to POS (/pos)
      if (user.role === "client") {
        setLocation("/");
      } else {
        setLocation("/pos");
      }
      setShouldNavigate(false);
    }
  }, [shouldNavigate, user, setLocation]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login({ email: data.email, password: data.password });
      setShouldNavigate(true);
    } catch (error: unknown) {
      console.error("Auth error:", error);

      // Show error toast
      let errorMessage =
        error instanceof Error ? error.message : "Please check your credentials and try again";
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (
          error as {
            response?: { status?: number; headers?: { [key: string]: string } };
          }
        ).response &&
        (error as { response: { status: number } }).response.status === 429
      ) {
        const retryAfter = (error as { response: { headers?: { [key: string]: string } } }).response
          .headers?.["retry-after"];
        if (retryAfter) {
          errorMessage = `Too many login attempts. Please wait ${retryAfter} seconds and try again.`;
        } else {
          errorMessage = "Too many login attempts. Please wait and try again.";
        }
      }
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: errorMessage,
      });

      // Set form error
      loginForm.setError("root", {
        message: errorMessage,
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>{"Welcome back! Please login to continue."}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={loginForm.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                disabled={isLoading}
                {...loginForm.register("email")}
              />
              {loginForm.formState.errors.email && (
                <p className="text-sm font-medium text-destructive">
                  {loginForm.formState.errors.email?.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  disabled={isLoading}
                  {...loginForm.register("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-sm font-medium text-destructive">
                  {loginForm.formState.errors.password?.message}
                </p>
              )}
            </div>

            {loginForm.formState.errors.root && (
              <p className="text-sm font-medium text-destructive">
                {loginForm.formState.errors.root?.message}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
