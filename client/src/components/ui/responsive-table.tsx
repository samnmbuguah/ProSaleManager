import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Types for responsive table configuration
export interface ResponsiveTableColumn<T = unknown> {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
  mobileRender?: (item: T) => React.ReactNode; // Custom mobile rendering
  hideOnMobile?: boolean; // Hide column on mobile
  hideOnTablet?: boolean; // Hide column on tablet
  priority?: number; // Higher priority = more important, shown first on mobile
}

export interface ResponsiveTableProps<T = unknown> {
  data: T[];
  columns: ResponsiveTableColumn<T>[];
  keyExtractor: (item: T) => string | number;
  title?: string;
  description?: string;
  emptyMessage?: string;
  className?: string;
  cardClassName?: string;
}

export function ResponsiveTable<T = unknown>({
  data,
  columns,
  keyExtractor,
  title,
  description,
  emptyMessage = "No data available",
  className,
  cardClassName,
}: ResponsiveTableProps<T>) {
  // Sort columns by priority (higher priority first)
  const sortedColumns = [...columns].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  // Get columns visible on mobile (not hidden and highest priority)
  const mobileColumns = sortedColumns.filter((col) => !col.hideOnMobile);

  if (data.length === 0) {
    return (
      <Card className={cardClassName}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">{emptyMessage}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Card className={cardClassName}>
          {title && (
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </CardHeader>
          )}
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead
                        key={column.key}
                        className={cn(
                          column.hideOnTablet && "hidden xl:table-cell",
                          column.hideOnMobile && "hidden lg:table-cell"
                        )}
                      >
                        {column.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={keyExtractor(item)}>
                      {columns.map((column) => (
                        <TableCell
                          key={column.key}
                          className={cn(
                            column.hideOnTablet && "hidden xl:table-cell",
                            column.hideOnMobile && "hidden lg:table-cell"
                          )}
                        >
                          {column.render(item)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {title && (
          <div className="px-1">
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        )}
        {data.map((item) => (
          <Card key={keyExtractor(item)} className={cn("p-4", cardClassName)}>
            <div className="space-y-3">
              {mobileColumns.map((column) => (
                <div key={column.key} className="flex justify-between items-start">
                  <span className="text-sm font-medium text-muted-foreground min-w-0 flex-shrink-0 mr-2">
                    {column.label}:
                  </span>
                  <div className="text-right min-w-0 flex-1">
                    {column.mobileRender ? column.mobileRender(item) : column.render(item)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Utility function to create common column types
export const createTextColumn = <T,>(
  key: string,
  label: string,
  getValue: (item: T) => string,
  options?: {
    hideOnMobile?: boolean;
    hideOnTablet?: boolean;
    priority?: number;
  }
): ResponsiveTableColumn<T> => ({
  key,
  label,
  hideOnMobile: options?.hideOnMobile,
  hideOnTablet: options?.hideOnTablet,
  priority: options?.priority,
  render: (item) => <span>{getValue(item)}</span>,
});

export const createBadgeColumn = <T,>(
  key: string,
  label: string,
  getValue: (item: T) => string,
  getVariant: (item: T) => "default" | "secondary" | "destructive" | "outline" = () => "default",
  options?: {
    hideOnMobile?: boolean;
    hideOnTablet?: boolean;
    priority?: number;
  }
): ResponsiveTableColumn<T> => ({
  key,
  label,
  hideOnMobile: options?.hideOnMobile,
  hideOnTablet: options?.hideOnTablet,
  priority: options?.priority,
  render: (item) => <Badge variant={getVariant(item)}>{getValue(item)}</Badge>,
});

export const createActionsColumn = <T,>(
  key: string,
  label: string,
  renderActions: (item: T) => React.ReactNode,
  options?: {
    hideOnMobile?: boolean;
    hideOnTablet?: boolean;
    priority?: number;
  }
): ResponsiveTableColumn<T> => ({
  key,
  label,
  hideOnMobile: options?.hideOnMobile,
  hideOnTablet: options?.hideOnTablet,
  priority: options?.priority,
  render: renderActions,
  mobileRender: renderActions, // Actions should be visible on mobile
});

export const createDateColumn = <T,>(
  key: string,
  label: string,
  getValue: (item: T) => string | Date,
  options?: {
    hideOnMobile?: boolean;
    hideOnTablet?: boolean;
    priority?: number;
    format?: "date" | "datetime" | "time";
  }
): ResponsiveTableColumn<T> => ({
  key,
  label,
  hideOnMobile: options?.hideOnMobile,
  hideOnTablet: options?.hideOnTablet,
  priority: options?.priority,
  render: (item) => {
    const value = getValue(item);
    const date = new Date(value);
    const format = options?.format || "date";

    let formattedDate: string;
    switch (format) {
      case "datetime":
        formattedDate = date.toLocaleString();
        break;
      case "time":
        formattedDate = date.toLocaleTimeString();
        break;
      default:
        formattedDate = date.toLocaleDateString();
    }

    return <span className="text-sm">{formattedDate}</span>;
  },
});

export const createCurrencyColumn = <T,>(
  key: string,
  label: string,
  getValue: (item: T) => number,
  options?: {
    hideOnMobile?: boolean;
    hideOnTablet?: boolean;
    priority?: number;
    currency?: string;
  }
): ResponsiveTableColumn<T> => ({
  key,
  label,
  hideOnMobile: options?.hideOnMobile,
  hideOnTablet: options?.hideOnTablet,
  priority: options?.priority,
  render: (item) => {
    const value = getValue(item);
    const currency = options?.currency || "KSh";
    return (
      <span className="font-medium">
        {currency} {value.toLocaleString()}
      </span>
    );
  },
});
