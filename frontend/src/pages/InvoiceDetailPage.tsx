import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store";
import {
  ArrowLeft, CheckCircle2, XCircle, AlertTriangle,
  MessageSquare, Save, FileText, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useGetInvoiceDetailQuery,
  useGetCommentsQuery,
  useMakeDecisionMutation,
  useAddCommentMutation,
  useCorrectFieldsMutation,
} from "@/features/api/invoicesApi";

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "APPROVED": return "bg-emerald-100 text-emerald-800";
    case "REJECTED": return "bg-red-100 text-red-800";
    case "UNDER_REVIEW": return "bg-amber-100 text-amber-800";
    case "PROCESSING": return "bg-blue-50 text-blue-700";
    case "ON_HOLD": return "bg-purple-100 text-purple-800";
    default: return "bg-slate-100 text-slate-700";
  }
}

export function InvoiceDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const currentUserRole = useSelector((state: RootState) => state.auth.role);

  const { data: invoice, isLoading, isError } = useGetInvoiceDetailQuery(id, { skip: !id });
  const { data: commentsResponse } = useGetCommentsQuery(id, { skip: !id });
  const comments = commentsResponse || [];

  const [makeDecision, { isLoading: isDeciding }] = useMakeDecisionMutation();
  const [addComment, { isLoading: isCommenting }] = useAddCommentMutation();
  const [correctFields, { isLoading: isSaving }] = useCorrectFieldsMutation();

  const [formData, setFormData] = useState({
    vendorName: "", vendorTaxId: "", invoiceNumber: "",
    invoiceDate: "", dueDate: "", totalAmount: "",
  });
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState<"data" | "risks" | "comments">("data");

  useEffect(() => {
    if (invoice) {
      setFormData({
        vendorName: invoice.vendor?.name || invoice.vendor_name_raw || "",
        vendorTaxId: invoice.vendor?.tax_id || "",
        invoiceNumber: invoice.vendor_invoice_number || "",
        invoiceDate: invoice.invoice_date || "",
        dueDate: invoice.due_date || "",
        totalAmount: invoice.total_amount?.toString() || "",
      });
    }
  }, [invoice]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveFields = async () => {
    if (!id) return;
    try {
      const payload: any = {};
      if (formData.invoiceNumber) payload.vendor_invoice_number = formData.invoiceNumber;
      if (formData.totalAmount) payload.total_amount = parseFloat(formData.totalAmount);
      await correctFields({ id, fields: payload }).unwrap();
    } catch (err) { console.error("Failed to save fields", err); }
  };

  const handleDecision = async (decision: "APPROVED" | "REJECTED") => {
    if (!id) return;
    try {
      await makeDecision({ id, decision, reason: `Invoice ${decision.toLowerCase()} by user.` }).unwrap();
      navigate("/invoices");
    } catch (err) { console.error(`Failed to ${decision}`, err); }
  };

  const handlePostComment = async () => {
    if (!id || !newComment.trim()) return;
    try {
      await addComment({ id, comment: newComment, is_internal: false }).unwrap();
      setNewComment("");
    } catch (err) { console.error("Failed to post comment", err); }
  };

  const handleViewOriginal = () => {
    if (invoice?.file_path) {
      window.open(invoice.file_path, "_blank", "noopener,noreferrer");
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-medium">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center space-y-3 p-8 bg-red-50 rounded-2xl border border-red-100">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-red-600 font-bold text-lg">Failed to load invoice</p>
          <p className="text-red-400 text-sm">The invoice could not be found or you lack permission to view it.</p>
          <Button variant="outline" onClick={() => navigate("/invoices")} className="mt-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  const riskFlags = invoice.risk_assessment?.flags || [];
  const riskLevel = invoice.risk_assessment?.overall_risk || "UNKNOWN";
  const aiSummary = invoice.risk_assessment?.ai_summary;
  const recommendation = invoice.risk_assessment?.recommendation;
  const confidenceScore = invoice.extraction?.confidence_score
    ? Math.round(Number(invoice.extraction.confidence_score) * 100) : 0;

  const riskColors: Record<string, string> = {
    LOW: "text-emerald-600 bg-emerald-50 border-emerald-200",
    MEDIUM: "text-amber-600 bg-amber-50 border-amber-200",
    HIGH: "text-orange-600 bg-orange-50 border-orange-200",
    CRITICAL: "text-red-600 bg-red-50 border-red-200",
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col gap-5 animate-in fade-in duration-500 pb-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-white shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Invoice {invoice.system_reference}
              </h2>
              <Badge className={`border-0 ${getStatusBadgeClass(invoice.status)}`}>
                {invoice.status.replace("_", " ")}
              </Badge>
              {(riskLevel === "HIGH" || riskLevel === "CRITICAL") && (
                <Badge className="bg-red-100 text-red-800 border-0">
                  {riskLevel} Risk
                </Badge>
              )}
            </div>
            <p className="text-slate-500 text-sm font-medium mt-0.5">
              Uploaded {new Date(invoice.created_at).toLocaleString()} &nbsp;·&nbsp;
              {invoice.file_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {invoice.file_path ? (
            <Button
              variant="outline"
              className="font-semibold bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              onClick={handleViewOriginal}
            >
              <Eye className="w-4 h-4 mr-2" /> View Original Document
            </Button>
          ) : (
            <Button variant="outline" disabled className="font-semibold text-slate-400 border-slate-200">
              <FileText className="w-4 h-4 mr-2" /> Original Not Available
            </Button>
          )}
          <Button
            variant="outline"
            className="font-semibold bg-white text-slate-700 border-slate-200"
            onClick={handleSaveFields}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" /> {isSaving ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            variant="outline"
            className="font-semibold bg-red-50 text-red-600 hover:bg-red-100 border-red-100"
            onClick={() => handleDecision("REJECTED")}
            disabled={isDeciding || ["APPROVED", "REJECTED", "ARCHIVED"].includes(invoice.status) || !["ADMIN", "APPROVER"].includes(currentUserRole)}
          >
            <XCircle className="w-4 h-4 mr-2" /> Reject
          </Button>
          <Button
            className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
            onClick={() => handleDecision("APPROVED")}
            disabled={isDeciding || ["APPROVED", "REJECTED", "ARCHIVED"].includes(invoice.status) || !["ADMIN", "APPROVER"].includes(currentUserRole)}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
          </Button>
        </div>
      </div>

      {/* ── AI Summary Banner ── */}
      {aiSummary && (
        <div className={`p-4 rounded-2xl border text-sm font-medium flex gap-3 items-start ${riskColors[riskLevel] || "bg-slate-50 border-slate-200 text-slate-700"}`}>
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold">AI Insight: </span>{aiSummary}
            {recommendation && (
              <span className="ml-2 font-bold uppercase">· Recommendation: {recommendation}</span>
            )}
          </div>
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1">

        {/* Left column: Vendor + Invoice fields */}
        <div className="lg:col-span-1 space-y-5">
          {/* Vendor Details */}
          <Card className="border border-slate-100 shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Vendor Details
                </CardTitle>
                <Badge variant="outline" className={`text-[10px] font-bold border-primary/20 ${confidenceScore < 80 ? "bg-amber-50 text-amber-700" : "bg-primary/5 text-primary"}`}>
                  AI Confidence: {confidenceScore}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-slate-500 font-semibold text-xs">Vendor Name</Label>
                <Input name="vendorName" value={formData.vendorName} onChange={handleInputChange} className="h-10 font-medium" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-500 font-semibold text-xs">Tax ID / GSTIN</Label>
                <Input name="vendorTaxId" value={formData.vendorTaxId} onChange={handleInputChange} className="h-10 font-medium" />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Header Fields */}
          <Card className="border border-slate-100 shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-500 font-semibold text-xs">Invoice #</Label>
                  <Input name="invoiceNumber" value={formData.invoiceNumber} onChange={handleInputChange} className="h-10 font-medium" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-500 font-semibold text-xs">Currency</Label>
                  <Input readOnly value={invoice.currency || "INR"} className="h-10 font-medium bg-slate-50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-500 font-semibold text-xs">Invoice Date</Label>
                  <Input name="invoiceDate" value={formData.invoiceDate} onChange={handleInputChange} className="h-10 font-medium" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-500 font-semibold text-xs">Due Date</Label>
                  <Input name="dueDate" value={formData.dueDate} onChange={handleInputChange} className="h-10 font-medium" />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                {invoice.subtotal != null && (
                  <div className="flex justify-between col-span-2">
                    <span className="text-slate-500 font-medium">Subtotal</span>
                    <span className="font-bold text-slate-800">
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: invoice.currency || "INR" }).format(Number(invoice.subtotal))}
                    </span>
                  </div>
                )}
                {invoice.tax_amount != null && (
                  <div className="flex justify-between col-span-2">
                    <span className="text-slate-500 font-medium">Tax ({invoice.tax_rate ?? ""}%)</span>
                    <span className="font-bold text-slate-800">
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: invoice.currency || "INR" }).format(Number(invoice.tax_amount))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between col-span-2 pt-1 border-t border-slate-100">
                  <span className="text-slate-700 font-bold">Total Amount</span>
                  <span className="text-lg font-extrabold text-slate-900">
                    {invoice.total_amount != null
                      ? new Intl.NumberFormat("en-IN", { style: "currency", currency: invoice.currency || "INR" }).format(Number(invoice.total_amount))
                      : "—"}
                  </span>
                </div>
              </div>
              {invoice.po_number && (
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-slate-500 font-medium">PO Number</span>
                  <span className="font-semibold text-slate-800">{invoice.po_number}</span>
                </div>
              )}
              {invoice.payment_terms && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Payment Terms</span>
                  <span className="font-semibold text-slate-800">{invoice.payment_terms}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Middle column: Line Items */}
        <div className="lg:col-span-1">
          <Card className="border border-slate-100 shadow-sm h-full">
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Line Items {invoice.line_items?.length > 0 && `(${invoice.line_items.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <ScrollArea className="h-[calc(100vh-20rem)]">
                {(!invoice.line_items || invoice.line_items.length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 px-5">
                    <FileText className="w-10 h-10 mb-3 opacity-20" />
                    <p className="font-medium text-sm text-center">No line items extracted for this invoice.</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">#</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Description</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">Unit Price</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoice.line_items.map((item: any) => (
                        <tr key={item.id || item.line_number} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-400 font-mono text-xs">{item.line_number}</td>
                          <td className="px-4 py-3 font-medium text-slate-700">
                            {item.description || "—"}
                            {item.hsn_sac_code && <span className="ml-1 text-xs text-slate-400">({item.hsn_sac_code})</span>}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {item.quantity != null ? `${item.quantity} ${item.unit || ""}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {item.unit_price != null
                              ? new Intl.NumberFormat("en-IN", { style: "currency", currency: invoice.currency || "INR" }).format(Number(item.unit_price))
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">
                            {item.line_total != null
                              ? new Intl.NumberFormat("en-IN", { style: "currency", currency: invoice.currency || "INR" }).format(Number(item.line_total))
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Tabs — Risks + Comments */}
        <div className="lg:col-span-1">
          <Card className="border border-slate-100 shadow-sm h-full flex flex-col">
            {/* Tab headers */}
            <div className="flex border-b border-slate-100 bg-slate-50/80 rounded-t-xl">
              {(["risks", "comments"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors relative ${
                    activeTab === tab
                      ? "text-primary bg-white border-b-2 border-primary"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab === "risks" ? (
                    <>
                      Risks & Insights
                      {riskFlags.length > 0 && (
                        <span className="absolute top-2 right-4 w-2 h-2 rounded-full bg-red-500" />
                      )}
                    </>
                  ) : (
                    <>
                      Comments
                      {comments.length > 0 && (
                        <span className="ml-1.5 text-[10px] bg-primary/10 text-primary rounded-full px-1.5 py-px font-bold">
                          {comments.length}
                        </span>
                      )}
                    </>
                  )}
                </button>
              ))}
            </div>

            <ScrollArea className="flex-1">
              <div className="p-5 space-y-5">
                {activeTab === "risks" && (
                  <>
                    {/* Overall risk indicator */}
                    <div className={`p-4 rounded-xl border flex items-center gap-3 ${riskColors[riskLevel] || "bg-slate-50 border-slate-200 text-slate-600"}`}>
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <div>
                        <p className="font-bold text-sm">Overall Risk: {riskLevel}</p>
                        {invoice.risk_assessment?.risk_score != null && (
                          <p className="text-xs font-medium opacity-80">Score: {Number(invoice.risk_assessment.risk_score).toFixed(1)} / 10</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Detected Flags ({riskFlags.length})
                      </h3>
                      {riskFlags.length === 0 ? (
                        <div className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl border border-slate-100">
                          No risk flags detected for this invoice.
                        </div>
                      ) : (
                        riskFlags.map((flag: any, i: number) => (
                          <div
                            key={i}
                            className={`p-4 rounded-xl border ${
                              flag.severity === "CRITICAL" ? "bg-red-50/60 border-red-200" :
                              flag.severity === "HIGH" ? "bg-orange-50/60 border-orange-200" :
                              "bg-amber-50/50 border-amber-100"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                flag.severity === "CRITICAL" ? "bg-red-100 text-red-700" :
                                flag.severity === "HIGH" ? "bg-orange-100 text-orange-700" :
                                "bg-amber-100 text-amber-700"
                              }`}>
                                {flag.severity || "MEDIUM"}
                              </span>
                              <span className="text-xs font-bold text-slate-700">{flag.rule_name || flag.rule_code}</span>
                            </div>
                            <p className="text-sm font-medium text-slate-600">{flag.description}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* AI Recommendation */}
                    {recommendation && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">AI Recommendation</h3>
                          <div className={`p-4 rounded-xl font-bold text-sm border ${
                            recommendation === "APPROVE" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                            recommendation === "DECLINE" ? "bg-red-50 border-red-200 text-red-700" :
                            "bg-amber-50 border-amber-200 text-amber-700"
                          }`}>
                            {recommendation === "APPROVE" ? "✓ Recommended for Approval" :
                             recommendation === "DECLINE" ? "✗ Recommended for Rejection" :
                             "⚠ Requires Manual Review"}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {activeTab === "comments" && (
                  <>
                    <div className="space-y-3">
                      {comments.length === 0 ? (
                        <div className="text-sm text-slate-500 italic text-center py-6">
                          No comments yet. Be the first to add one.
                        </div>
                      ) : (
                        (comments as any[]).map((comment: any) => (
                          <div key={comment.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary">
                                {(comment.user_name || comment.user?.full_name || "U")[0].toUpperCase()}
                              </span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-tr-xl rounded-b-xl border border-slate-100 flex-1">
                              <div className="flex items-baseline justify-between mb-1">
                                <span className="text-xs font-bold text-slate-900">
                                  {comment.user_name || comment.user?.full_name || "Unknown"}
                                </span>
                                <span className="text-[10px] font-medium text-slate-400">
                                  {new Date(comment.created_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600">
                                {comment.comment || comment.comment_text}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Textarea
                        placeholder="Add a comment or question..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px] resize-none font-medium"
                      />
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          className="font-bold shadow-md shadow-primary/20"
                          disabled={!newComment.trim() || isCommenting}
                          onClick={handlePostComment}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          {isCommenting ? "Posting..." : "Post Comment"}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
