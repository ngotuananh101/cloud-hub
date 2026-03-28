import type { Table } from "@tanstack/react-table";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface DataTablePaginationProps<TData> {
    table: Table<TData>;
    currentPage?: number;
    pageCount?: number;
}

export function DataTablePagination<TData>({
    table,
    currentPage,
    pageCount,
}: DataTablePaginationProps<TData>) {
    const displayPage = currentPage ?? table.getState().pagination.pageIndex + 1;
    const displayPageCount = pageCount ?? table.getPageCount();
    const canGoPrevious = displayPage > 1;
    const canGoNext = displayPage < displayPageCount;

    return (
        <div className="grow flex items-center justify-between space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
                <Select
                    value={`${table.getState().pagination.pageSize}`}
                    onValueChange={(value) => {
                        table.setPageSize(Number(value));
                    }}
                >
                    <SelectTrigger className="h-8 w-[70px] border-slate-200 !text-xs">
                        <SelectValue placeholder={table.getState().pagination.pageSize} />
                    </SelectTrigger>
                    <SelectContent side="top">
                        {[6, 10, 20, 30, 40, 50].map((pageSize) => (
                            <SelectItem key={pageSize} value={`${pageSize}`} className="text-xs">
                                {pageSize}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center space-x-6">
                <div className="flex items-center justify-center text-sm text-slate-500">
                    Page {displayPage} of {displayPageCount}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex border-slate-200"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!canGoPrevious}
                    >
                        <span className="sr-only">Go to first page</span>
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0 border-slate-200"
                        onClick={() => table.previousPage()}
                        disabled={!canGoPrevious}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0 border-slate-200"
                        onClick={() => table.nextPage()}
                        disabled={!canGoNext}
                    >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex border-slate-200"
                        onClick={() => table.setPageIndex(displayPageCount - 1)}
                        disabled={!canGoNext}
                    >
                        <span className="sr-only">Go to last page</span>
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
