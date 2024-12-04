import { useState } from "react";
import { useUser } from "../hooks/use-user";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@db/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type FormData = {
  username: string;
  password: string;
  email?: string;
};

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const { login, register } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<FormData>({
    resolver: zodResolver(isRegister ? insertUserSchema : loginSchema),
    defaultValues: {
      username: "",
      password: "",
      ...(isRegister ? { email: "" } : {}),
    },
  });

  const onSubmit = async (data: FormData) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      console.log('Submitting form:', data);
      const result = await (isRegister 
        ? register({ ...data, email: data.email! } as InsertUser)
        : login({ username: data.username, password: data.password })
      );
      console.log('Got result:', result);
      
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: isRegister ? "Registration failed" : "Login failed",
          description: result.message,
        });
      } else {
        toast({
          title: isRegister ? "Registration successful" : "Login successful",
          description: result.data?.message,
        });
        setLocation("/inventory");
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form when switching between login and register
  const toggleMode = () => {
    form.reset({
      username: "",
      password: "",
      ...(isRegister ? {} : { email: "" }),
    });
    setIsRegister(!isRegister);
  };

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isRegister ? "Register" : "Login"}</CardTitle>
          <CardDescription>
            {isRegister
              ? "Create a new account to continue"
              : "Login to access the POS system"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isRegister && (
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Loading..." : (isRegister ? "Register" : "Login")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={toggleMode}
                  disabled={isLoading}
                >
                  {isRegister
                    ? "Already have an account? Login"
                    : "Don't have an account? Register"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
