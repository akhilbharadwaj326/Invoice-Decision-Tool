import { useState } from "react";
import { 
  createColumnHelper, 
  flexRender, 
  getCoreRowModel, 
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { ArrowUpDown, Eye, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

// Mock Data
type Invoice = {
  id: string;
  reference: string;
  vendor: string;
  amount: number;
  date: string;
  status: "PENDING" | "EXTRACTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "ON_HOLD";
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UNKNOWN";
};

const mockInvoices: Invoice[] = [
  { id: "1", reference: "IDT-2026-06-0001", vendor: "TechCorp Systems", amount: 15420.50, date: "2026-06-01", status: "APPROVED", risk: "LOW" },
  { id: "2", reference: "IDT-2026-06-0002", vendor: "Global Supplies Inc", amount: 3200.00, date: "2026-06-02", status: "PENDING", risk: "UNKNOWN" },
  { id: "3", reference: "IDT-2026-06-0003", vendor: "Apex Consulting", amount: 45000.00, date: "2026-06-02", status: "UNDER_REVIEW", risk: "HIGH" },
  { id: "4", reference: "IDT-2026-06-0004", vendor: "Office Depot", amount: 250.75, date: "2026-06-03", status: "EXTRACTED", risk: "LOW" },
  { id: "5", reference: "IDT-2026-06-0005", vendor: "Cloud Hosting LLC", amount: 5500.00, date: "2026-06-03", status: "REJECTED", risk: "CRITICAL" },
];

const columnHelper = createColumnHelper<Invoice>();

const getStatusBadge = (status: string) => {
  switch(status) {
    case 'APPROVED': return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-0">Approved</Badge>;
    case 'PENDING': return <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-0">Pending</Badge>;
    case 'EXTRACTED': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0">Extracted</Badge>;
    case 'UNDER_REVIEW': return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-0">Reviewing</Badge>;
    case 'REJECTED': return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200 border-0">Rejected</Badge>;
    case 'ON_HOLD': return <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-0">On Hold</Badge>;
    default: return <Badge>{status}</Badge>;
  }
}

const getRiskBadge = (risk: string) => {
  switch(risk) {
    case 'LOW': return <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-sm font-medium text-slate-600">Low</span></div>;
    case 'MEDIUM': return <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-sm font-medium text-slate-600">Medium</span></div>;
    case 'HIGH': return <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500"></div><span className="text-sm font-medium text-slate-600">High</span></div>;
    case 'CRITICAL': return <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div><span className="text-sm font-bold text-red-600">Critical</span></div>;
    default: return <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-300"></div><span className="text-sm font-medium text-slate-500">Unknown</span></div>;
  }
}

const columns = [
  columnHelper.accessor("reference", {
    header: "Reference",
    cell: info => <span className="font-bold text-slate-900">{info.getValue()}</span>,
  }),
  columnHelper.accessor("vendor", {
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 hover:bg-slate-100">
          Vendor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: info => <span className="font-medium text-slate-700">{info.getValue()}</span>,
  }),
  columnHelper.accessor("date", {
    header: "Date",
    cell: info => <span className="text-slate-500 font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor("amount", {
    header: () => <div className="text-right">Amount</div>,
    cell: info => {
      const amount = parseFloat(info.getValue().toString())
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount)
      return <div className="text-right font-bold text-slate-900">{formatted}</div>
    },
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: info => getStatusBadge(info.getValue()),
  }),
  columnHelper.accessor("risk", {
    header: "Risk Level",
    cell: info => getRiskBadge(info.getValue()),
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
]

export function InvoiceListPage() {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data: mockInvoices,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Invoices</h2>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Manage and review all processed invoices.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white hover:bg-slate-50 font-semibold text-slate-700 shadow-sm">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Link to="/invoices/upload">
            <Button className="font-semibold shadow-md shadow-primary/20">
              <FileText className="mr-2 h-4 w-4" /> Upload New
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-100">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-0">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-slate-500 font-bold tracking-wide text-xs uppercase h-12">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-slate-50/80 transition-colors border-slate-100/60"
                  >
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
                      <p className="font-medium">No invoices found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4 px-6 border-t border-slate-100 bg-slate-50/50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="font-medium bg-white"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="font-medium bg-white"
          >
            Next
          </Button>
        </div>
      </Card>
    </div>
  );
}
