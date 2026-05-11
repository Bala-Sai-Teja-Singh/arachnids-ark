'use client';

import * as React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Loading } from '@/components/shared/molecules/loading';
import { EmptyState } from '@/components/shared/molecules/empty-state';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableMoleculeProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  loadingText?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
  className?: string;
  tableClassName?: string;
  /** Optional custom mobile view renderer. If not provided, the table will scroll horizontally on mobile. */
  renderMobileItem?: (item: T) => React.ReactNode;
  rowClassName?: string | ((item: T) => string);
}

export function TableMolecule<T extends { id: string | number }>({
  data,
  columns,
  isLoading,
  loadingText,
  emptyTitle = 'No data found',
  emptyDescription = 'There is no information to display at this time.',
  onRowClick,
  className,
  tableClassName,
  renderMobileItem,
  rowClassName
}: TableMoleculeProps<T>) {
  if (isLoading) {
    return <Loading text={loadingText || 'Loading data...'} />;
  }

  const renderTable = () => (
    <div className={cn("rounded-xl border border-border bg-card overflow-hidden", tableClassName)}>
      <Table>
        <TableHeader>
          <TableRow className="border-border bg-muted/30 hover:bg-transparent">
            {columns.map((col, idx) => (
              <TableHead 
                key={idx} 
                className={cn(
                  "font-bold text-[10px] uppercase tracking-widest",
                  col.align === 'center' && "text-center",
                  col.align === 'right' && "text-right",
                  col.headerClassName
                )}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground italic">
                {emptyDescription}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow 
                key={item.id} 
                className={cn(
                  "border-border group transition-colors",
                  onRowClick && "cursor-pointer hover:bg-muted/10",
                  typeof rowClassName === 'function' ? rowClassName(item) : rowClassName
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col, idx) => (
                  <TableCell 
                    key={idx} 
                    className={cn(
                      col.align === 'center' && "text-center",
                      col.align === 'right' && "text-right",
                      col.className
                    )}
                  >
                    {col.cell ? col.cell(item) : (col.accessorKey ? (item[col.accessorKey] as React.ReactNode) : null)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (renderMobileItem) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Desktop View */}
        <div className="hidden md:block">
          {renderTable()}
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
          {data.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground italic">{emptyDescription}</div>
          ) : (
            data.map((item) => (
              <div 
                key={item.id} 
                className={cn(
                  "p-4 transition-colors",
                  onRowClick && "cursor-pointer active:bg-muted/30"
                )}
                onClick={() => onRowClick?.(item)}
              >
                {renderMobileItem(item)}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      {renderTable()}
    </div>
  );
}
