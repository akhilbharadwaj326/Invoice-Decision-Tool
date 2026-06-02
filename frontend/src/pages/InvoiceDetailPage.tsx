import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, CheckCircle2, XCircle, AlertTriangle, 
  MessageSquare, Save, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock Data for a single invoice
const mockInvoiceData = {
  id: "1",
  reference: "IDT-2026-06-0001",
  status: "UNDER_REVIEW",
  riskLevel: "HIGH",
  vendorName: "TechCorp Systems",
  vendorTaxId: "TX-9988-7766",
  invoiceNumber: "INV-2026-901",
  invoiceDate: "2026-05-28",
  dueDate: "2026-06-28",
  subtotal: 14000.00,
  tax: 1420.50,
  totalAmount: 15420.50,
  currency: "INR",
  lineItems: [
    { id: 1, desc: "Enterprise Software License", qty: 1, unitPrice: 10000, total: 10000 },
    { id: 2, desc: "Implementation Services", qty: 40, unitPrice: 100, total: 4000 }
  ],
  riskFlags: [
    { id: 1, type: "AMOUNT_MISMATCH", description: "Total amount does not match sum of line items + tax.", severity: "HIGH" },
    { id: 2, type: "NEW_VENDOR", description: "Vendor 'TechCorp Systems' is not in the approved ERP vendor list.", severity: "MEDIUM" }
  ],
  comments: [
    { id: 1, user: "System AI", text: "Extracted data with 94% confidence. Found 2 risk flags.", time: "2 hours ago" },
    { id: 2, user: "Jane Doe (Reviewer)", text: "I have requested clarification from the vendor regarding the tax amount.", time: "1 hour ago" }
  ]
};

export function InvoiceDetailPage() {
  const navigate = useNavigate();
  
  // Local state for the editable fields
  const [formData, setFormData] = useState({
    vendorName: mockInvoiceData.vendorName,
    vendorTaxId: mockInvoiceData.vendorTaxId,
    invoiceNumber: mockInvoiceData.invoiceNumber,
    invoiceDate: mockInvoiceData.invoiceDate,
    dueDate: mockInvoiceData.dueDate,
    totalAmount: mockInvoiceData.totalAmount,
  });

  const [newComment, setNewComment] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4 animate-in fade-in duration-500">
      {/* Header and Actions */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-white shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Invoice {mockInvoiceData.reference}
              </h2>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-0 shadow-none">
                Under Review
              </Badge>
              {mockInvoiceData.riskLevel === "HIGH" && (
                <Badge variant="destructive" className="bg-red-100 text-red-800 border-0 shadow-none">
                  High Risk
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-0.5 text-sm font-medium">
              Uploaded 2 hours ago via API
            </p>
          </div>
        </div>

        {/* Decision Panel */}
        <div className="flex items-center gap-3">
          <Button variant="outline" className="font-semibold bg-white text-slate-700 hover:text-slate-900 border-slate-200">
            <Save className="w-4 h-4 mr-2" /> Save Draft
          </Button>
          <Button variant="outline" className="font-semibold bg-red-50 text-red-600 hover:bg-red-100 border-red-100">
            <XCircle className="w-4 h-4 mr-2" /> Reject
          </Button>
          <Button className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
            <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
          </Button>
        </div>
      </div>

      {/* Split Layout */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Side: Document Viewer */}
        <Card className="flex-1 border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden flex flex-col">
          <CardHeader className="py-3 px-4 bg-slate-50 border-b border-slate-100 shrink-0">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center"><FileText className="w-4 h-4 mr-2 text-primary" /> Original Document</span>
              <span className="text-xs text-muted-foreground font-medium">Page 1 of 1</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 bg-slate-200/50 relative">
            {/* Dummy PDF rendering using an iframe */}
            <iframe 
              src="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf#toolbar=0&navpanes=0" 
              className="w-full h-full border-0"
              title="Invoice PDF"
            />
          </CardContent>
        </Card>

        {/* Right Side: Data and Processing */}
        <Card className="w-[450px] shrink-0 border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col overflow-hidden">
          <Tabs defaultValue="data" className="flex flex-col h-full">
            <CardHeader className="py-0 px-0 border-b border-slate-100 shrink-0">
              <TabsList className="w-full h-12 bg-slate-50/80 p-0 rounded-none justify-start border-b border-slate-100">
                <TabsTrigger value="data" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-full px-6 font-bold">
                  Extracted Data
                </TabsTrigger>
                <TabsTrigger value="risks" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-full px-6 font-bold relative">
                  Risks & Comments
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500"></span>
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <ScrollArea className="flex-1">
              <div className="p-5">
                <TabsContent value="data" className="m-0 space-y-6 outline-none">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Vendor Details</h3>
                      <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/20 bg-primary/5">AI CONFIDENCE: 98%</Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="vendorName" className="text-slate-500 font-semibold text-xs">Vendor Name</Label>
                        <Input id="vendorName" name="vendorName" value={formData.vendorName} onChange={handleInputChange} className="h-10 font-medium" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="vendorTaxId" className="text-slate-500 font-semibold text-xs">Tax ID / GSTIN</Label>
                        <Input id="vendorTaxId" name="vendorTaxId" value={formData.vendorTaxId} onChange={handleInputChange} className="h-10 font-medium" />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Invoice Details</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="invoiceNumber" className="text-slate-500 font-semibold text-xs">Invoice Number</Label>
                        <Input id="invoiceNumber" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleInputChange} className="h-10 font-medium" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="totalAmount" className="text-slate-500 font-semibold text-xs">Total Amount</Label>
                        <Input id="totalAmount" name="totalAmount" value={formData.totalAmount} onChange={handleInputChange} className="h-10 font-medium bg-amber-50 border-amber-200 focus-visible:ring-amber-500" />
                        <p className="text-[10px] font-bold text-amber-600 mt-1 flex items-center"><AlertTriangle className="w-3 h-3 mr-1" /> Flagged for review</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="invoiceDate" className="text-slate-500 font-semibold text-xs">Invoice Date</Label>
                        <Input id="invoiceDate" name="invoiceDate" value={formData.invoiceDate} onChange={handleInputChange} className="h-10 font-medium" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="dueDate" className="text-slate-500 font-semibold text-xs">Due Date</Label>
                        <Input id="dueDate" name="dueDate" value={formData.dueDate} onChange={handleInputChange} className="h-10 font-medium" />
                      </div>
                    </div>
                  </div>

                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Line Items</h3>
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2">Desc</th>
                            <th className="px-3 py-2">Qty</th>
                            <th className="px-3 py-2">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {mockInvoiceData.lineItems.map(item => (
                            <tr key={item.id} className="bg-white">
                              <td className="px-3 py-2 font-medium text-slate-700">{item.desc}</td>
                              <td className="px-3 py-2 text-slate-500">{item.qty}</td>
                              <td className="px-3 py-2 font-bold text-slate-900">₹{item.total.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="risks" className="m-0 space-y-6 outline-none">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      Detected Risks ({mockInvoiceData.riskFlags.length})
                    </h3>
                    <div className="space-y-3">
                      {mockInvoiceData.riskFlags.map(flag => (
                        <div key={flag.id} className={`p-4 rounded-xl border ${flag.severity === 'HIGH' ? 'bg-red-50/50 border-red-100' : 'bg-amber-50/50 border-amber-100'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${flag.severity === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                              {flag.type}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-700">{flag.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      Comments
                    </h3>
                    
                    <div className="space-y-4 mb-4">
                      {mockInvoiceData.comments.map(comment => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-slate-600">{comment.user.charAt(0)}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-tr-xl rounded-b-xl border border-slate-100 flex-1">
                            <div className="flex items-baseline justify-between mb-1">
                              <span className="text-xs font-bold text-slate-900">{comment.user}</span>
                              <span className="text-[10px] font-medium text-slate-400">{comment.time}</span>
                            </div>
                            <p className="text-sm text-slate-600">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2 pt-2">
                      <Textarea 
                        placeholder="Add a comment or question..." 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px] resize-none font-medium"
                      />
                      <div className="flex justify-end">
                        <Button size="sm" className="font-bold shadow-md shadow-primary/20" disabled={!newComment.trim()}>
                          Post Comment
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
