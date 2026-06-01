import { useCallback, useState } from "react";
import { FileBarChart2, Download, Printer, FileText, FileSpreadsheet, FileType, Plus, Calendar, GraduationCap, ChevronDown, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ExportFormat, ReportId, ReportFilter } from "@/types/reports";

interface ReportHeaderProps {
  academicYears: string[];
  selectedYear: string;
  onYearChange: (year: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onExport: (format: ExportFormat) => void;
  onPrint: () => void;
  exporting: { id: ReportId; format: ExportFormat } | null;
  filters: ReportFilter;
  onFiltersChange: (filters: ReportFilter) => void;
}

export function ReportHeader({
  academicYears,
  selectedYear,
  onYearChange,
  searchQuery,
  onSearchChange,
  onExport,
  onPrint,
  exporting,
  filters,
  onFiltersChange,
}: ReportHeaderProps) {
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");

  const handleExport = useCallback(
    (format: ExportFormat) => {
      if (format === "print") {
        onPrint();
      } else {
        onExport(format);
      }
    },
    [onExport, onPrint]
  );

  return (
    <div className="space-y-4">
      {/* Title & Actions Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileBarChart2 className="h-6 w-6 text-primary" />
            Reports Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enterprise analytics & decision-support reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Academic Year Selector */}
          <Select value={selectedYear} onValueChange={onYearChange}>
            <SelectTrigger className="h-9 w-[150px] text-xs">
              <GraduationCap className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Academic Year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range */}
          <div className="hidden md:flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="date"
              value={dateRangeStart}
              onChange={(e) => setDateRangeStart(e.target.value)}
              className="h-9 w-[130px] rounded-md border bg-card px-2 text-xs outline-none ring-ring/40 transition focus:ring-2"
              placeholder="Start"
            />
            <span className="text-xs text-muted-foreground">–</span>
            <input
              type="date"
              value={dateRangeEnd}
              onChange={(e) => setDateRangeEnd(e.target.value)}
              className="h-9 w-[130px] rounded-md border bg-card px-2 text-xs outline-none ring-ring/40 transition focus:ring-2"
              placeholder="End"
            />
          </div>

          {/* Generate Report Button */}
          <Button size="sm" className="h-9">
            <Plus className="mr-1.5 h-4 w-4" />
            Generate Report
          </Button>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9" disabled={!!exporting}>
                {exporting ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-1.5 h-4 w-4" />
                )}
                Export
                <ChevronDown className="ml-1 h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                <FileText className="mr-2 h-4 w-4 text-red-500" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("excel")}>
                <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-500" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                <FileType className="mr-2 h-4 w-4 text-blue-500" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport("print")}>
                <Printer className="mr-2 h-4 w-4" />
                Print Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search & Filters Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reports, departments, teachers..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filters.department ?? "all"}
            onValueChange={(v) => onFiltersChange({ ...filters, department: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="Science">Science</SelectItem>
              <SelectItem value="Mathematics">Mathematics</SelectItem>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="ICT">ICT</SelectItem>
              <SelectItem value="MAPEH">MAPEH</SelectItem>
              <SelectItem value="Social Studies">Social Studies</SelectItem>
              <SelectItem value="Filipino">Filipino</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.riskLevel ?? "all"}
            onValueChange={(v) => onFiltersChange({ ...filters, riskLevel: v === "all" ? undefined : v as "low" | "medium" | "high" })}
          >
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risks</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.employmentStatus ?? "all"}
            onValueChange={(v) => onFiltersChange({ ...filters, employmentStatus: v === "all" ? undefined : v as "active" | "inactive" | "on_leave" })}
          >
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}