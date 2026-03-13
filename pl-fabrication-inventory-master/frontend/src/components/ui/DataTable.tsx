import type { ReactNode } from 'react';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, EmptyState } from './Table';
import { Package } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  keyExtractor?: (item: T, index: number) => string;
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  emptyMessage = 'No data found',
  keyExtractor = (_, index) => String(index),
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pl-500"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={<Package className="w-12 h-12" />}
        title={emptyMessage}
      />
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          {columns.map((col) => (
            <TableHeader key={col.key} sortable={col.sortable}>
              {col.header}
            </TableHeader>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((item, index) => (
          <TableRow key={keyExtractor(item, index)}>
            {columns.map((col) => (
              <TableCell key={col.key}>{col.render(item)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
