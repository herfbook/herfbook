import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { runSetup } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";
import { getErrorMessage } from "@/lib/api/errors";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const setupSchema = z
  .object({
    username: z
      .string()
      .min(3, "At least 3 characters")
      .max(100, "At most 100 characters")
      .regex(/^[a-zA-Z0-9_-]+$/, "Letters, numbers, underscores, hyphens only"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .max(128, "At most 128 characters"),
    password_confirm: z.string(),
    display_name: z.string().max(100, "At most 100 characters").optional(),
    email: z.union([z.literal(""), z.string().email("Invalid email address")]),
    humidor_name: z
      .string()
      .min(1, "Required")
      .max(100, "At most 100 characters"),
    humidor_description: z.string().optional(),
    humidor_capacity: z
      .string()
      .optional()
      .refine(
        (val) =>
          !val ||
          val.trim() === "" ||
          (Number.isInteger(Number(val)) && Number(val) > 0),
        { message: "Must be a positive whole number" }
      ),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Passwords don't match",
    path: ["password_confirm"],
  });

type SetupFormValues = z.infer<typeof setupSchema>;

export default function SetupPage() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      username: "",
      password: "",
      password_confirm: "",
      display_name: "",
      email: "",
      humidor_name: "Main Humidor",
      humidor_description: "",
      humidor_capacity: "",
    },
  });

  async function onSubmit(values: SetupFormValues) {
    setSubmitting(true);
    try {
      const capacityStr = values.humidor_capacity?.trim();
      const capacity =
        capacityStr && capacityStr !== ""
          ? parseInt(capacityStr, 10)
          : null;

      const result = await runSetup({
        username: values.username,
        password: values.password,
        email: values.email || undefined,
        display_name: values.display_name || undefined,
        humidor_name: values.humidor_name,
        humidor_description: values.humidor_description || undefined,
        humidor_capacity: capacity,
      });
      setTokens({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        token_type: "bearer",
      });
      setUser(result.user);
      toast.success("Welcome to HerfBook");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center pb-2">
          <h1 className="font-serif text-4xl font-bold text-primary mb-1">
            HerfBook
          </h1>
          <CardTitle className="text-xl font-semibold">Welcome</CardTitle>
          <CardDescription>Let's get your humidor ready.</CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Section 1: Admin account */}
              <div className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Admin Account
                </h2>

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username *</FormLabel>
                      <FormControl>
                        <Input placeholder="your_username" {...field} />
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
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password_confirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password *</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Section 2: First humidor */}
              <div className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  First Humidor
                </h2>

                <FormField
                  control={form.control}
                  name="humidor_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Humidor Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Main Humidor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="humidor_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Optional description…"
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="humidor_capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity (cigars)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 100"
                          min={1}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Setting up…" : "Create Account & Humidor"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
