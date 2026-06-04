import { useState } from "react";
import { ShieldAlert, Plus, Edit2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetRulesQuery, useCreateRuleMutation, useUpdateRuleMutation } from "@/features/api/adminApi";

type Rule = {
  id: string;
  rule_code: string;
  name: string;
  description: string | null;
  severity: string;
  threshold: number | null;
  is_active: boolean;
};

const SEVERITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const severityStyle = (severity: string, active: boolean) => {
  if (!active) return { badge: "bg-slate-200 text-slate-500", icon: "bg-slate-200 text-slate-400" };
  switch (severity) {
    case "CRITICAL": return { badge: "bg-red-100 text-red-700", icon: "bg-red-100 text-red-600" };
    case "HIGH":     return { badge: "bg-orange-100 text-orange-700", icon: "bg-orange-100 text-orange-600" };
    case "MEDIUM":   return { badge: "bg-amber-100 text-amber-700", icon: "bg-amber-100 text-amber-600" };
    default:         return { badge: "bg-blue-100 text-blue-700", icon: "bg-blue-100 text-blue-600" };
  }
};

const emptyForm = {
  rule_code: "",
  name: "",
  description: "",
  severity: "MEDIUM",
  threshold: "",
  is_active: true,
};

export function RulesPage() {
  const { data: rules = [], isLoading, isError } = useGetRulesQuery(undefined);
  const [createRule, { isLoading: isCreating }] = useCreateRuleMutation();
  const [updateRule, { isLoading: isUpdating }] = useUpdateRuleMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const openCreate = () => {
    setEditingRule(null);
    setForm(emptyForm);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (rule: Rule) => {
    setEditingRule(rule);
    setForm({
      rule_code: rule.rule_code,
      name: rule.name,
      description: rule.description || "",
      severity: rule.severity,
      threshold: rule.threshold !== null ? String(rule.threshold) : "",
      is_active: rule.is_active,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleToggle = async (rule: Rule, newActive: boolean) => {
    try {
      await updateRule({ id: rule.id, is_active: newActive }).unwrap();
    } catch {
      console.error("Failed to toggle rule");
    }
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!form.rule_code.trim() || !form.name.trim()) {
      setFormError("Rule Code and Name are required.");
      return;
    }

    try {
      if (editingRule) {
        await updateRule({
          id: editingRule.id,
          name: form.name,
          description: form.description || null,
          severity: form.severity,
          threshold: form.threshold ? parseFloat(form.threshold) : null,
          is_active: form.is_active,
        }).unwrap();
      } else {
        await createRule({
          rule_code: form.rule_code.trim().toUpperCase().replace(/\s+/g, "_"),
          name: form.name,
          description: form.description || null,
          severity: form.severity,
          threshold: form.threshold ? parseFloat(form.threshold) : null,
          is_active: form.is_active,
        }).unwrap();
      }
      setDialogOpen(false);
    } catch (err: any) {
      setFormError(err?.data?.detail || "Failed to save rule. Please try again.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Risk Rules</h2>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Configure AI risk detection and validation thresholds.
          </p>
        </div>
        <Button id="create-rule-btn" onClick={openCreate} className="font-semibold shadow-md shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Create Rule
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-slate-500 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading rules...
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-center py-16 text-red-500 gap-2">
          <AlertCircle className="w-5 h-5" /> Failed to load rules. Ensure you are logged in as Admin.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid gap-4">
          {rules.length === 0 && (
            <div className="text-center py-12 text-slate-400 font-medium">
              No risk rules configured yet. Create your first rule.
            </div>
          )}
          {(rules as Rule[]).map((rule) => {
            const styles = severityStyle(rule.severity, rule.is_active);
            return (
              <Card
                key={rule.id}
                className={`border border-slate-100 shadow-sm transition-all ${
                  rule.is_active ? "bg-white shadow-slate-200/50" : "bg-slate-50/50 opacity-75"
                }`}
              >
                <CardContent className="p-6 flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl shrink-0 ${styles.icon}`}>
                    <ShieldAlert className="w-5 h-5" />
                  </div>

                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">{rule.name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles.badge}`}>
                        {rule.severity}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {rule.rule_code}
                      </span>
                      {rule.threshold !== null && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          Threshold: {rule.threshold}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-500 max-w-3xl">
                      {rule.description || "No description provided."}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 pl-4 border-l border-slate-100">
                    <Button
                      id={`edit-rule-${rule.id}`}
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-primary"
                      onClick={() => openEdit(rule)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`rule-${rule.id}`} className="sr-only">
                        Toggle rule
                      </Label>
                      <Switch
                        id={`rule-${rule.id}`}
                        checked={rule.is_active}
                        onCheckedChange={(val) => handleToggle(rule, val)}
                        disabled={isUpdating}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-slate-900">
              {editingRule ? "Edit Risk Rule" : "Create New Risk Rule"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {!editingRule && (
              <div className="space-y-1.5">
                <Label htmlFor="rule_code" className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Rule Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="rule_code"
                  placeholder="e.g. DUPLICATE_INVOICE"
                  value={form.rule_code}
                  onChange={(e) => setForm((f) => ({ ...f, rule_code: e.target.value }))}
                  className="h-10 font-mono"
                />
                <p className="text-[11px] text-slate-400">Unique identifier. Spaces will become underscores.</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="rule_name" className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="rule_name"
                placeholder="e.g. Duplicate Invoice Detection"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="h-10 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rule_desc" className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Description
              </Label>
              <Textarea
                id="rule_desc"
                placeholder="Describe what this rule checks for..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="resize-none min-h-[72px] font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Severity</Label>
                <Select value={form.severity} onValueChange={(v) => setForm((f) => ({ ...f, severity: v }))}>
                  <SelectTrigger id="rule_severity" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rule_threshold" className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Threshold (optional)
                </Label>
                <Input
                  id="rule_threshold"
                  type="number"
                  placeholder="e.g. 50000"
                  value={form.threshold}
                  onChange={(e) => setForm((f) => ({ ...f, threshold: e.target.value }))}
                  className="h-10 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Switch
                id="rule_active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              />
              <Label htmlFor="rule_active" className="text-sm font-semibold text-slate-700 cursor-pointer">
                Active (rule will be applied to new invoices)
              </Label>
            </div>

            {formError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-medium p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {formError}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="font-semibold">
              Cancel
            </Button>
            <Button
              id="save-rule-btn"
              onClick={handleSubmit}
              disabled={isCreating || isUpdating}
              className="font-bold"
            >
              {(isCreating || isUpdating) ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                editingRule ? "Save Changes" : "Create Rule"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
