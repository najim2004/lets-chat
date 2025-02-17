"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
// import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ApiResponse } from "../../api/types";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).min(1, {
    message: "Email is required",
  }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  // const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  type LoginResponse = ApiResponse & {
    data?: {
      token: string;
      user: {
        id: string;
        email: string;
      };
    };
  };

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok || !data.success) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: data.message || "Something went wrong",
        });
        form.reset();
        return;
      }

      if (data?.token) {
        localStorage.setItem("token", data?.token);
        toast({
          variant: "default",
          title: "Success",
          description: "Logged in successfully",
        });
        // router.push("/dashboard");
      }
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <Card className="w-[400px] rounded-none shadow-none bg-white">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your email"
                        type="email"
                        className="rounded-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Enter your password"
                          className="rounded-sm"
                          type={showPassword ? "text" : "password"}
                          {...field}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none active:bg-transparent hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full rounded-sm">
                Login
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center w-full justify-center">
          <p className="text-sm text-gray-600">
            Don&#39;t have an account?{" "}
            <Link href="/signup" className="font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
