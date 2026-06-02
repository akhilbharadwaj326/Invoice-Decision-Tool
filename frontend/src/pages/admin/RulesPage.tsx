import { ShieldAlert, Plus, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const mockRules = [
  { id: 1, name: "Amount Mismatch", description: "Flags invoice if extracted total does not match line items sum + tax.", severity: "HIGH", active: true },
  { id: 2, name: "Unregistered Vendor", description: "Flags invoice if vendor is not found in the approved ERP database.", severity: "MEDIUM", active: true },
  { id: 3, name: "Duplicate Invoice ID", description: "Prevents processing of an invoice number that already exists for the vendor.", severity: "CRITICAL", active: true },
  { id: 4, name: "Date Discrepancy", description: "Flags invoice if due date is before the invoice date.", severity: "MEDIUM", active: false },
  { id: 5, name: "High Amount Threshold", description: "Requires manual approval for any invoice over $50,000.", severity: "HIGH", active: true },
];

export function RulesPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Risk Rules</h2>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Configure AI risk detection and validation thresholds.</p>
        </div>
        <Button className="font-semibold shadow-md shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Create Rule
        </Button>
      </div>

      <div className="grid gap-4">
        {mockRules.map((rule) => (
          <Card key={rule.id} className={`border border-slate-100 shadow-sm transition-all ${rule.active ? 'bg-white shadow-slate-200/50' : 'bg-slate-50/50 opacity-80'}`}>
            <CardContent className="p-6 flex items-start gap-4">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                !rule.active ? 'bg-slate-200 text-slate-400' :
                rule.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                rule.severity === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                'bg-amber-100 text-amber-600'
              }`}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-slate-900">{rule.name}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    !rule.active ? 'bg-slate-200 text-slate-500' :
                    rule.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                    rule.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {rule.severity}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-500 max-w-3xl">{rule.description}</p>
              </div>

              <div className="flex items-center gap-6 shrink-0 pl-4 border-l border-slate-100">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`rule-${rule.id}`} className="sr-only">Toggle rule</Label>
                  <Switch id={`rule-${rule.id}`} defaultChecked={rule.active} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
