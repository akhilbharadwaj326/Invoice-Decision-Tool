import { useState } from "react";
import { UserPlus, Edit2, Shield, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation } from "@/features/api/adminApi";
import { useForm } from "react-hook-form";

type UserFormValues = {
  name: string;
  email: string;
  password: string;
  role: string;
};

const ROLES = ["VIEWER", "REVIEWER", "APPROVER", "ADMIN"];

const getRoleBadge = (role: string) => {
  const styles: Record<string, string> = {
    ADMIN:    "bg-primary/10 text-primary border-primary/20",
    APPROVER: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REVIEWER: "bg-amber-50 text-amber-600 border-amber-200",
    VIEWER:   "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <Badge variant="outline" className={`font-bold ${styles[role] || styles.VIEWER}`}>
      {role}
    </Badge>
  );
};

export function UsersPage() {
  const { data: users = [], isLoading, isError } = useGetUsersQuery(undefined);
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [editRole, setEditRole] = useState("");
  const [formError, setFormError] = useState("");

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<UserFormValues>({
    defaultValues: { role: "REVIEWER" },
  });
  const selectedRole = watch("role");

  const onAddUser = async (data: UserFormValues) => {
    try {
      setFormError("");
      await createUser(data).unwrap();
      reset();
      setShowAddDialog(false);
    } catch (err: any) {
      setFormError(err?.data?.detail || "Failed to create user. Please try again.");
    }
  };

  const onToggleActive = async (user: any) => {
    try {
      await updateUser({ id: user.id, is_active: !user.is_active }).unwrap();
    } catch (err) {
      console.error("Failed to update user", err);
    }
  };

  const onSaveRole = async () => {
    if (!editUser) return;
    try {
      await updateUser({ id: editUser.id, role: editRole }).unwrap();
      setEditUser(null);
    } catch (err) {
      console.error("Failed to update role", err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">User Management</h2>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            {users.length} user{users.length !== 1 ? 's' : ''} registered.
          </p>
        </div>
        <Button id="add-user-btn" onClick={() => { reset(); setFormError(""); setShowAddDialog(true); }}
          className="font-semibold shadow-md shadow-primary/20">
          <UserPlus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <Card className="border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-500 animate-pulse">Loading users...</div>
        ) : isError ? (
          <div className="p-10 text-center text-red-500">Failed to load users. Make sure you are logged in as ADMIN.</div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-100">
              <TableRow className="hover:bg-transparent border-0">
                <TableHead className="text-slate-500 font-bold tracking-wide text-xs uppercase h-12">Name</TableHead>
                <TableHead className="text-slate-500 font-bold tracking-wide text-xs uppercase h-12">Email</TableHead>
                <TableHead className="text-slate-500 font-bold tracking-wide text-xs uppercase h-12">Role</TableHead>
                <TableHead className="text-slate-500 font-bold tracking-wide text-xs uppercase h-12">Status</TableHead>
                <TableHead className="text-slate-500 font-bold tracking-wide text-xs uppercase h-12">Joined</TableHead>
                <TableHead className="text-slate-500 font-bold tracking-wide text-xs uppercase h-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: any) => (
                <TableRow key={user.id} className="hover:bg-slate-50/80 transition-colors border-slate-100/60">
                  <TableCell className="font-bold text-slate-900 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {(user.name || "U")[0].toUpperCase()}
                      </div>
                      {user.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500 font-medium py-4">{user.email}</TableCell>
                  <TableCell className="py-4">{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${user.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-400 font-medium py-4 text-sm">
                    {new Date(user.created_at).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" className="text-slate-500 hover:text-primary font-semibold"
                        onClick={() => { setEditUser(user); setEditRole(user.role); }}>
                        <Edit2 className="h-3.5 w-3.5 mr-1" /> Role
                      </Button>
                      <Button variant="ghost" size="sm" disabled={isUpdating}
                        className={`font-semibold ${user.is_active ? 'text-slate-500 hover:text-red-500' : 'text-slate-400 hover:text-emerald-600'}`}
                        onClick={() => onToggleActive(user)}>
                        {user.is_active ? <><ShieldOff className="h-3.5 w-3.5 mr-1" /> Deactivate</> : <><Shield className="h-3.5 w-3.5 mr-1" /> Activate</>}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-400 font-medium">No users found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">Add New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onAddUser)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-name" className="font-semibold text-slate-700">Full Name</Label>
              <Input id="new-name" placeholder="Jane Doe" {...register("name", { required: "Name is required" })} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-email" className="font-semibold text-slate-700">Email</Label>
              <Input id="new-email" type="email" placeholder="jane@company.com" {...register("email", { required: "Email is required" })} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="font-semibold text-slate-700">Password</Label>
              <Input id="new-password" type="password" placeholder="Min 6 characters" {...register("password", { required: "Password is required", minLength: { value: 6, message: "Min 6 characters" } })} />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700">Role</Label>
              <Select value={selectedRole} onValueChange={(v) => setValue("role", v)}>
                <SelectTrigger id="new-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {formError && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{formError}</p>}
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={isCreating} className="font-bold">
                {isCreating ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      {editUser && (
        <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold">Change Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-slate-600">Updating role for <span className="font-bold text-slate-900">{editUser.name}</span> ({editUser.email})</p>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button disabled={isUpdating} onClick={onSaveRole} className="font-bold">
                {isUpdating ? "Saving..." : "Save Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
