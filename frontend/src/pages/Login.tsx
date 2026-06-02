import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch } from "@/app/hooks";
import { setCredentials } from "@/features/auth/authSlice";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    // Mock login for UI development
    setTimeout(() => {
      dispatch(
        setCredentials({
          user: { name: "System Admin", email: data.email },
          token: "mock-jwt-token-123",
          role: "ADMIN",
        })
      );
      navigate("/");
    }, 1000);
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 bg-slate-50">
      {/* Left side - Branding / Decorative */}
      <div className="hidden lg:flex flex-col justify-between bg-primary relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 p-12 text-primary-foreground h-full flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">InvoiceTool</h1>
          </div>
          
          <div className="space-y-6 max-w-lg">
            <h2 className="text-5xl font-bold leading-tight font-sans">
              Smarter Invoice Approvals
            </h2>
            <p className="text-lg text-primary-foreground/80 leading-relaxed font-medium">
              Automate extraction, streamline reviews, and enforce compliance with AI-powered invoice decisioning.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
        {/* Subtle decorative background for right side */}
        <div className="absolute inset-0 bg-slate-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        
        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please enter your details to sign in
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-8">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@invoicetool.com" className="h-12 bg-white" {...field} />
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
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-foreground/80">Password</FormLabel>
                      <a href="#" className="text-sm font-medium text-primary hover:underline transition-all">
                        Forgot password?
                      </a>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="h-12 bg-white" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 text-base font-medium flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Signing in..." : (
                  <>Sign in <ArrowRight className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Don't have an account?{" "}
            <Link to="/signup" className="font-semibold text-primary hover:underline transition-all">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
