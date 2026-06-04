import { useState } from "react";
import { useForm } from "react-hook-form";
import { User, Lock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUpdateProfileMutation } from "@/features/api/authApi";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { setCredentials } from "@/features/auth/authSlice";

type ProfileFormValues = {
  name: string;
  password?: string;
};

export function SettingsPage() {
  const { user, token, role } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormValues>({
    defaultValues: {
      name: user?.name || "",
      password: "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setSuccessMsg("");
      setErrorMsg("");
      
      const payload: any = { name: data.name };
      if (data.password) {
        payload.password = data.password;
      }
      
      const updatedUser = await updateProfile(payload).unwrap();
      
      // Update redux state with new user info
      if (token && role) {
        dispatch(setCredentials({ user: updatedUser, token, role }));
      }
      
      setSuccessMsg("Profile updated successfully!");
      reset({ name: updatedUser.name, password: "" });
    } catch (err: any) {
      setErrorMsg(err?.data?.detail || "Failed to update profile.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">General Settings</h2>
        <p className="text-muted-foreground mt-1 text-sm font-medium">
          Manage your account profile and security.
        </p>
      </div>

      <Card className="border border-slate-100 shadow-sm shadow-slate-200/50">
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Update your personal information and password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold text-slate-700">Email Address (Read Only)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input id="email" value={user?.email || ""} disabled className="pl-9 bg-slate-50 text-slate-500" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="font-semibold text-slate-700">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="Your Name" 
                  {...register("name", { required: "Name is required", minLength: { value: 2, message: "Minimum 2 characters" } })} 
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-semibold text-slate-700">New Password (Optional)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Leave blank to keep current password" 
                    className="pl-9"
                    {...register("password", { minLength: { value: 6, message: "Minimum 6 characters" } })} 
                  />
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                <p className="text-xs text-slate-500 mt-1">Must be at least 6 characters long.</p>
              </div>
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-100">
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-100">
                {errorMsg}
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="font-bold w-full sm:w-auto shadow-md shadow-primary/20">
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Saving Changes..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
