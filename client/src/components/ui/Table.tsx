import React, { useState, useMemo, useRef, useEffect } from 'react';
import { SearchInput } from './SearchInput';
import { Pagination } from './Pagination';
import { Checkbox } from './Checkbox';

export interface TableColumn<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  width?: string;
  visible?: boolean;
}

export interface TableAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  variant?: 'default' | 'danger';
  show?: (row: T) => boolean;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  actions?: TableAction<T>[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  pagination?: boolean;
  itemsPerPage?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
  className?: string;
}

export function Table<T>({
  columns: initialColumns,
  data,
  keyExtractor,
  actions,
  loading = false,
  searchable = true,
  searchPlaceholder = 'Search...',
  onSearch,
  selectable = false,
  onSelectionChange,
  pagination = true,
  itemsPerPage = 10,
  emptyMessage = 'No data available',
  className = '',
  currentPage,
  onPageChange,
}: TableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [internalPage, setInternalPage] = useState<number>(currentPage ?? 1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    const visibility: Record<string, boolean> = {};
    initialColumns.forEach((col) => {
      visibility[col.id] = col.visible !== false;
    });
    return visibility;
  });
  const [visibilityMenuOpen, setVisibilityMenuOpen] = useState(false);
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const visibilityMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActiveActionMenu(null);
      }
      if (visibilityMenuRef.current && !visibilityMenuRef.current.contains(event.target as Node)) {
        setVisibilityMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const columns = useMemo(
    () => initialColumns.filter((col) => columnVisibility[col.id]),
    [initialColumns, columnVisibility]
  );

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const column = columns.find((col) => col.id === sortConfig.key);
      if (!column) return 0;

      let aValue: any;
      let bValue: any;

      if (typeof column.accessor === 'function') {
        return 0; // Can't sort computed columns
      } else {
        aValue = a[column.accessor];
        bValue = b[column.accessor];
      }

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig, columns]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const effectivePage = typeof currentPage === 'number' ? currentPage : internalPage;
    const start = (effectivePage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, internalPage, itemsPerPage, pagination]);

  // Selection
  const allSelected = paginatedData.length > 0 && paginatedData.every((row) => selectedRows.has(keyExtractor(row)));
  const someSelected = paginatedData.some((row) => selectedRows.has(keyExtractor(row))) && !allSelected;

  const handleSelectAll = () => {
    const newSelected = new Set(selectedRows);
    if (allSelected) {
      paginatedData.forEach((row) => newSelected.delete(keyExtractor(row)));
    } else {
      paginatedData.forEach((row) => newSelected.add(keyExtractor(row)));
    }
    setSelectedRows(newSelected);
    onSelectionChange?.(data.filter((row) => newSelected.has(keyExtractor(row))));
  };

  const handleSelectRow = (row: T) => {
    const key = keyExtractor(row);
    const newSelected = new Set(selectedRows);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedRows(newSelected);
    onSelectionChange?.(data.filter((row) => newSelected.has(keyExtractor(row))));
  };

  const handleSort = (columnId: string) => {
    setSortConfig((current) => {
      if (current?.key === columnId) {
        if (current.direction === 'asc') {
          return { key: columnId, direction: 'desc' };
        } else {
          return null;
        }
      }
      return { key: columnId, direction: 'asc' };
    });
  };

  const handleSearch = React.useCallback((query: string) => {
    // Only reset internal page when uncontrolled; do not call parent's onPageChange
    if (!onPageChange) setInternalPage(1);
    onSearch?.(query);
  }, [onSearch, onPageChange]);

  useEffect(() => {
    if (typeof currentPage === 'number') setInternalPage(currentPage);
  }, [currentPage]);

  const setPage = (p: number) => {
    if (onPageChange) onPageChange(p);
    else setInternalPage(p);
  };

  const renderCellContent = (column: TableColumn<T>, row: T) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    const value = row[column.accessor];
    return value !== null && value !== undefined ? String(value) : '-';
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      {(searchable || selectable) && (
        <div className="flex items-center justify-between gap-4 p-4 border-b border-gray-200">
          {searchable && (
            <SearchInput
              placeholder={searchPlaceholder}
              onSearch={handleSearch}
              className="flex-1 max-w-md"
            />
          )}
          <div className="flex items-center gap-2">
            {selectedRows.size > 0 && (
              <div className="text-sm text-gray-600">
                {selectedRows.size} row{selectedRows.size > 1 ? 's' : ''} selected
              </div>
            )}
            {/* Column Visibility Toggle */}
            <div className="relative" ref={visibilityMenuRef}>
              <button
                onClick={() => setVisibilityMenuOpen(!visibilityMenuOpen)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Column visibility"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </button>
              {visibilityMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Show Columns</div>
                  {initialColumns.map((col) => (
                    <label key={col.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={columnVisibility[col.id]}
                        onChange={(e) => {
                          setColumnVisibility((prev) => ({
                            ...prev,
                            [col.id]: e.target.checked,
                          }));
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{col.header}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <Checkbox
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className={someSelected ? 'indeterminate' : ''}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.id}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  style={{ width: column.width }}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.id)}
                      className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                    >
                      {column.header}
                      <span className="text-gray-400">
                        {sortConfig?.key === column.id ? (
                          sortConfig.direction === 'asc' ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                            />
                          </svg>
                        )}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="w-16 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="px-4 py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="px-4 py-8">
                  <div className="text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No data</h3>
                    <p className="mt-1 text-sm text-gray-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const rowKey = keyExtractor(row);
                const isSelected = selectedRows.has(rowKey);

                return (
                  <tr
                    key={rowKey}
                    className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    {selectable && (
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelectRow(row)}
                          aria-label={`Select row ${rowKey}`}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.id} className="px-4 py-3 text-sm text-gray-900">
                        {renderCellContent(column, row)}
                      </td>
                    ))}
                    {actions && actions.length > 0 && (
                      <td className="px-4 py-3 text-sm text-gray-900 relative">
                        <button
                          onClick={() => setActiveActionMenu(activeActionMenu === rowKey ? null : rowKey)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          aria-label="Row actions"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        {activeActionMenu === rowKey && (
                          <div
                            ref={actionMenuRef}
                            className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                          >
                            {actions
                              .filter((action) => !action.show || action.show(row))
                              .map((action, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    action.onClick(row);
                                    setActiveActionMenu(null);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                                    action.variant === 'danger'
                                      ? 'text-red-600 hover:bg-red-50'
                                      : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  {action.icon}
                                  {action.label}
                                </button>
                              ))}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && !loading && (
        <div className="flex justify-end">
          <Pagination
            currentPage={typeof currentPage === 'number' ? currentPage : internalPage}
            totalPages={totalPages}
            onPageChange={setPage}
            itemsPerPage={itemsPerPage}
            totalItems={sortedData.length}
            showItemsInfo={false}
            align="right"
            useArrows={true}
          />
        </div>
      )}
    </div>
  );
}
