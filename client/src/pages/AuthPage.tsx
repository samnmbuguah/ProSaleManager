import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAuthContext } from "@/contexts/AuthContext";
import { useStoreContext } from "@/contexts/StoreContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, ShieldCheck, Store, UserRoundCog, ScanLine, ShoppingBag } from "lucide-react";
import { useLocation } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const demoAccounts = [
  { role: "Super Admin", email: "demo.superadmin@prosale.com", password: "Demo123!", icon: ShieldCheck, description: "Platform-wide administration" },
  { role: "Store Admin", email: "demo.admin@prosale.com", password: "Demo123!", icon: Store, description: "Complete store management" },
  { role: "Manager", email: "demo.manager@prosale.com", password: "Demo123!", icon: UserRoundCog, description: "Operations and reporting" },
  { role: "Cashier", email: "demo.cashier@prosale.com", password: "Demo123!", icon: ScanLine, description: "Point of sale workflow" },
  { role: "Customer", email: "demo.customer@prosale.com", password: "Demo123!", icon: ShoppingBag, description: "Customer storefront view" },
] as const;

export default function AuthPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const { login, isLoading } = useAuth();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { currentStore } = useStoreContext();

  // Handle navigation after successful auth
  useEffect(() => {
    if (shouldNavigate && user) {
      // Wait until store context is available so we can build store-aware routes
      if (!currentStore?.name) {
        return;
      }

      const storePrefix = `/${encodeURIComponent(currentStore.name)}`;

      // Only clients go to store home route, everyone else goes to POS
      if (user.role === "client") {
        setLocation(storePrefix);
      } else {
        setLocation(`${storePrefix}/pos`);
      }
      setShouldNavigate(false);
    }
  }, [shouldNavigate, user, currentStore, setLocation]);

  // If user is already authenticated and visits /auth directly, redirect them
  useEffect(() => {
    if (user && currentStore?.name) {
      const storePrefix = `/${encodeURIComponent(currentStore.name)}`;

      if (user.role === "client") {
        setLocation(storePrefix);
      } else {
        setLocation(`${storePrefix}/pos`);
      }
    }
  }, [user, currentStore, setLocation]);

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
      let errorMessage = "Incorrect email or password. Please check your details and try again.";

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
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4 py-10">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">ProSaleManager Demo</CardTitle>
          <CardDescription>Choose a demo role to explore, or enter credentials manually.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8 md:grid-cols-[1.25fr_1fr]">
          <section aria-labelledby="demo-roles-title">
            <h2 id="demo-roles-title" className="mb-3 text-sm font-semibold">Explore as a demo user</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {demoAccounts.map((account) => {
                const Icon = account.icon;
                return (
                  <Button
                    key={account.role}
                    type="button"
                    variant="outline"
                    className="h-auto justify-start gap-3 p-4 text-left"
                    disabled={isLoading}
                    onClick={() => {
                      loginForm.setValue("email", account.email, { shouldValidate: true });
                      loginForm.setValue("password", account.password, { shouldValidate: true });
                      void loginForm.handleSubmit(onSubmit)();
                    }}
                  >
                    <Icon className="h-5 w-5 shrink-0 text-primary" />
                    <span>
                      <span className="block font-semibold">{account.role}</span>
                      <span className="block text-xs font-normal text-muted-foreground">{account.description}</span>
                    </span>
                  </Button>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Demo accounts contain fictional data and may be reset periodically.</p>
          </section>
          <form onSubmit={loginForm.handleSubmit(onSubmit)} className="space-y-4 border-t pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <h2 className="text-sm font-semibold">Manual login</h2>
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
