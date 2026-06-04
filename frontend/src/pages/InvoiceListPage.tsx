import { useState, useCallback } from "react";
import { 
  createColumnHelper, 
  flexRender, 
  getCoreRowModel, 
  useReactTable,
  getSortedRowModel,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { ArrowUpDown, Eye, FileText, Download, Search, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useGetInvoicesQuery } from "@/features/api/invoicesApi";
import { useLazyExportCsvQuery } from "@/features/api/adminApi";

type InvoiceListItem = {
  id: string;
  system_reference: string;
  status: string;
  vendor_name: string | null;
  total_amount: number | null;
  currency: string | null;
  created_at: string;
  risk_level: string | null;
};

const columnHelper = createColumnHelper<InvoiceListItem>();

const getStatusBadge = (status: string) => {
  switch(status) {
    case 'APPROVED':     return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-0">Approved</Badge>;
    case 'PENDING':      return <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-0">Pending</Badge>;
    case 'PROCESSING':   return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-0 animate-pulse">Processing</Badge>;
    case 'EXTRACTED':    return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-0">Extracted</Badge>;
    case 'UNDER_REVIEW': return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-0">Reviewing</Badge>;
    case 'REJECTED':     return <Badge variant="destructive" className="bg-red-100 text-red-800 border-0">Rejected</Badge>;
    case 'ON_HOLD':      return <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-0">On Hold</Badge>;
    default:             return <Badge>{status}</Badge>;
  }
};

const getRiskDot = (risk: string | null) => {
  const colors: Record<string, string> = {
    LOW: "bg-emerald-500", MEDIUM: "bg-amber-500", HIGH: "bg-orange-500", CRITICAL: "bg-red-600 animate-pulse"
  };
  const labels: Record<string, string> = {
    LOW: "Low", MEDIUM: "Medium", HIGH: "High", CRITICAL: "Critical"
  };
  const color = colors[risk || ""] || "bg-slate-300";
  const label = labels[risk || ""] || "—";
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
  );
};

const columns = [
  columnHelper.accessor("system_reference", {
    header: "Reference",
    cell: (info) => <div className="font-semibold text-slate-900 group-hover:text-primary transition-colors">{info.getValue()}</div>,
  }),
  columnHelper.accessor("vendor_name", {
    header: "Vendor",
    cell: (info) => {
      const name = info.getValue();
      const isUnknown = !name || name.toLowerCase() === "unknown";
      return (
        <div className="flex items-center gap-2">
          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isUnknown ? "bg-red-50 text-red-400" : "bg-slate-100 text-slate-600"}`}>
            {isUnknown ? "?" : (name || "U").substring(0, 2).toUpperCase()}
          </div>
          <span className={`font-medium truncate max-w-[140px] ${isUnknown ? "text-red-400 italic text-sm" : "text-slate-700"}`}>
            {isUnknown ? "Unregistered Vendor" : name}
          </span>
        </div>
      );
    },
  }),
  columnHelper.accessor("total_amount", {
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4 hover:bg-slate-100 text-slate-500 font-semibold">
        Amount <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => {
      const amount = info.getValue() || 0;
      const currency = info.row.original.currency || "USD";
      return <div className="font-medium text-slate-900 tabular-nums">
        {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)}
      </div>;
    },
  }),
  columnHelper.accessor("created_at", {
    header: "Date",
    cell: (info) => <div className="text-slate-500 font-medium">
      {new Date(info.getValue()).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
    </div>,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => getStatusBadge(info.getValue()),
  }),
  columnHelper.accessor("risk_level", {
    header: "Risk",
    cell: (info) => getRiskDot(info.getValue()),
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Link to={`/invoices/${row.original.id}`}>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 transition-colors">
            <Eye className="h-4 w-4 mr-2" /> View
          </Button>
        </Link>
      </div>
    ),
  }),
];

const STATUS_OPTIONS = ["", "PENDING", "PROCESSING", "EXTRACTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "ON_HOLD"];

export function InvoiceListPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data: invoicesResponse, isLoading, isError, isFetching } = useGetInvoicesQuery({
    search: activeSearch || undefined,
    status: statusFilter || undefined,
    page,
    page_size: 15,
  });

  const [triggerExport] = useLazyExportCsvQuery();

  const invoices = invoicesResponse?.items || [];
  const totalPages = invoicesResponse?.total_pages || 1;
  const total = invoicesResponse?.total || 0;

  const handleSearch = useCallback(() => {
    setActiveSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setActiveSearch("");
    setPage(1);
  }, []);

  const handleStatusChange = (val: string) => {
    setStatusFilter(val === "ALL" ? "" : val);
    setPage(1);
  };

  const handleExportCsv = async () => {
    try {
      const result = await triggerExport(undefined);
      if (result.data) {
        const blob = new Blob([result.data as string], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoices_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("CSV export failed", err);
    }
  };

  const table = useReactTable({
    data: invoices,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Invoices</h2>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            {total > 0 ? `${total} invoice${total !== 1 ? 's' : ''} found` : "Manage and review all processed invoices."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white hover:bg-slate-50 font-semibold text-slate-700 shadow-sm" onClick={handleExportCsv}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Link to="/invoices/upload">
            <Button className="font-semibold shadow-md shadow-primary/20">
              <FileText className="mr-2 h-4 w-4" /> Upload New
            </Button>
          </Link>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            id="invoice-search"
            placeholder="Search by vendor, reference, invoice #..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9 pr-9 h-10 bg-white"
          />
          {searchInput && (
            <button onClick={handleClearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button id="search-btn" onClick={handleSearch} className="h-10 px-5 font-semibold">
          <Search className="h-4 w-4 mr-2" /> Search
        </Button>
        <Select value={statusFilter || "ALL"} onValueChange={handleStatusChange}>
          <SelectTrigger id="status-filter" className="w-[160px] h-10 bg-white font-medium">
            <Filter className="h-4 w-4 mr-2 text-slate-400" />
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {STATUS_OPTIONS.filter(Boolean).map(s => (
              <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-xl shadow-slate-200/40 rounded-2xl overflow-hidden bg-white/50 backdrop-blur-xl relative">
        {isFetching && !isLoading && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center rounded-2xl">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 animate-pulse">Loading invoices...</div>
        ) : isError ? (
          <div className="p-12 text-center text-red-500">Error loading invoices. Please check your connection.</div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/80">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="hover:bg-transparent border-0">
                  {hg.headers.map((header) => (
                    <TableHead key={header.id} className="text-slate-500 font-bold tracking-wide text-xs uppercase h-12">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-slate-50/80 transition-colors border-slate-100/60 group">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <FileText className="h-10 w-10 mb-3 opacity-20" />
                      <p className="font-medium">{activeSearch ? `No invoices matching "${activeSearch}"` : "No invoices found."}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between py-2">
        <p className="text-sm text-slate-500 font-medium">
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1} className="font-medium bg-white">
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages} className="font-medium bg-white">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
