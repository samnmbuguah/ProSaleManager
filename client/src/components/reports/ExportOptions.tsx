import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Image,
  ChevronDown,
  Loader2
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface ExportOptionsProps {
  onExport: (format: 'csv' | 'excel' | 'pdf' | 'image') => Promise<void>;
  disabled?: boolean;
  exportType?: 'inventory' | 'stock-take' | 'sales' | 'expenses';
  className?: string;
}

export function ExportOptions({
  onExport,
  disabled = false,
  exportType = 'inventory',
  className = ""
}: ExportOptionsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<string>('');

  const handleExport = async (format: 'csv' | 'excel' | 'pdf' | 'image') => {
    try {
      setIsExporting(true);
      setExportFormat(format);
      await onExport(format);

      const formatNames = {
        csv: 'CSV',
        excel: 'Excel',
        pdf: 'PDF',
        image: 'Image'
      };

      toast({
        title: "Export Complete",
        description: `${formatNames[format]} file exported successfully`,
        variant: "default",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportFormat('');
    }
  };

  const getExportIcon = (format: string) => {
    switch (format) {
      case 'csv':
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  const getExportLabel = (format: string) => {
    switch (format) {
      case 'csv':
        if (exportType === 'inventory') return 'Inventory CSV';
        if (exportType === 'stock-take') return 'Stock Take CSV';
        if (exportType === 'sales') return 'Detailed Sales CSV';
        if (exportType === 'expenses') return 'Expenses CSV';
        return 'CSV Export';
      case 'excel':
        return 'Excel Spreadsheet';
      case 'pdf':
        return 'PDF Report';
      case 'image':
        return 'Image (PNG)';
      default:
        return 'Export';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={disabled || isExporting}
          variant="outline"
          className={`flex items-center gap-2 ${className}`}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exporting {exportFormat.toUpperCase()}...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={isExporting}
        >
          {getExportIcon('csv')}
          <span className="ml-2">{getExportLabel('csv')}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleExport('excel')}
          disabled={isExporting}
        >
          {getExportIcon('excel')}
          <span className="ml-2">{getExportLabel('excel')}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
        >
          {getExportIcon('pdf')}
          <span className="ml-2">{getExportLabel('pdf')}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleExport('image')}
          disabled={isExporting}
        >
          {getExportIcon('image')}
          <span className="ml-2">{getExportLabel('image')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
