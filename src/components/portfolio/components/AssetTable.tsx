import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import { Button } from '../../ui/button';
import { Edit, Trash2, ArrowUpDown } from 'lucide-react';
import type { PortfolioAssetDTO, Currency } from '../../../types';

interface AssetTableProps {
  assets: PortfolioAssetDTO[];
  currency: Currency;
  onEdit: (asset: PortfolioAssetDTO) => void;
  onDelete: (asset: PortfolioAssetDTO) => void;
}

export function AssetTable({ assets, currency, onEdit, onDelete }: AssetTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const columnHelper = createColumnHelper<PortfolioAssetDTO>();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'pl-PL', {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'code'
    }).format(value);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('ticker', {
        header: 'Ticker',
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor('sector_name', {
        header: 'Sector',
        cell: (info) => (
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
            {info.getValue() || 'Other'}
          </div>
        ),
      }),
      columnHelper.accessor('quantity', {
        header: () => <div className="text-right">Quantity</div>,
        cell: (info) => <div className="text-right">{Number(info.getValue())}</div>,
      }),
      columnHelper.accessor('current_price', {
        header: 'Price',
        cell: (info) => formatCurrency(info.getValue()),
      }),
      columnHelper.accessor('current_value', {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="p-0 hover:bg-transparent"
            >
              Value
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: (info) => <span className="font-bold">{formatCurrency(info.getValue())}</span>,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(info.row.original)}
              title="Edit"
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(info.row.original)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        ),
      }),
    ],
    [currency, onEdit, onDelete]
  );

  const table = useReactTable({
    data: assets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (!assets || assets.length === 0) {
      return (
          <div className="p-8 text-center border rounded-md text-muted-foreground bg-card">
              No assets in portfolio. Add one to get started.
          </div>
      )
  }

  return (
    <div className="rounded-md border bg-card text-card-foreground">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
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
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
