"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Filter, X } from "lucide-react"
import { StringFilter } from "./StringFilter"
import { NumberFilter } from "./NumberFilter"
import { DateFilter } from "./DateFilter"
import { DateTimeFilter } from "./DateTimeFilter"
import { CategoryFilter } from "./CategoryFilter"
import { BooleanFilter } from "./BooleanFilter"

export interface FilterValue {
  column: string
  type: string
  operator?: string
  value?: string | string[]
  value2?: string
}

interface ColumnFilterPopoverProps {
  column: string
  columnType: string
  uniqueValues?: string[]
  value?: FilterValue
  onChange: (filter: FilterValue | null) => void
  isActive?: boolean
}

export function ColumnFilterPopover({
  column,
  columnType,
  uniqueValues = [],
  value,
  onChange,
  isActive = false,
}: ColumnFilterPopoverProps) {
  const [open, setOpen] = useState(false)
  const [localFilter, setLocalFilter] = useState<FilterValue>(
    value || getDefaultFilter(column, columnType)
  )

  // Sincroniza filtro local quando o valor da prop muda
  useEffect(() => {
    setLocalFilter(value || getDefaultFilter(column, columnType))
  }, [value, column, columnType])

  /**
   * Retorna configuração padrão de filtro baseado no tipo da coluna.
   */
  function getDefaultFilter(col: string, type: string): FilterValue {
    switch (type) {
      case "number":
      case "integer":
      case "float":
        return { column: col, type, operator: "equals", value: "" }
      case "date":
        return { column: col, type, operator: "equals", value: "" }
      case "datetime":
        return { column: col, type, operator: "equals", value: "" }
      case "boolean":
        return { column: col, type, value: "all" }
      case "category":
        return { column: col, type, value: [] }
      default:
        return { column: col, type: "string", operator: "contains", value: "" }
    }
  }

  const handleApply = () => {
    onChange(localFilter)
    setOpen(false)
  }

  const handleClear = () => {
    const defaultFilter = getDefaultFilter(column, columnType)
    setLocalFilter(defaultFilter)
    onChange(null)
    setOpen(false)
  }

  /**
   * Renderiza o componente de filtro apropriado baseado no tipo da coluna.
   */
  const renderFilter = () => {
    switch (columnType) {
      case "number":
      case "integer":
      case "float":
        return (
          <NumberFilter
            value={{
              operator: localFilter.operator || "equals",
              value: (localFilter.value as string) || "",
              value2: localFilter.value2,
            }}
            onChange={(v) =>
              setLocalFilter({
                ...localFilter,
                operator: v.operator,
                value: v.value,
                value2: v.value2,
              })
            }
          />
        )
      case "date":
        return (
          <DateFilter
            value={{
              operator: localFilter.operator || "equals",
              value: (localFilter.value as string) || "",
              value2: localFilter.value2,
            }}
            onChange={(v) =>
              setLocalFilter({
                ...localFilter,
                operator: v.operator,
                value: v.value,
                value2: v.value2,
              })
            }
          />
        )
      case "datetime":
        return (
          <DateTimeFilter
            value={{
              operator: localFilter.operator || "equals",
              value: (localFilter.value as string) || "",
              value2: localFilter.value2,
            }}
            onChange={(v) =>
              setLocalFilter({
                ...localFilter,
                operator: v.operator,
                value: v.value,
                value2: v.value2,
              })
            }
          />
        )
      case "boolean":
        return (
          <BooleanFilter
            value={(localFilter.value as string) || "all"}
            onChange={(v) => setLocalFilter({ ...localFilter, value: v })}
          />
        )
      case "category":
        return (
          <CategoryFilter
            value={(localFilter.value as string[]) || []}
            options={uniqueValues}
            onChange={(v) => setLocalFilter({ ...localFilter, value: v })}
          />
        )
      default:
        return (
          <StringFilter
            value={{
              operator: localFilter.operator || "contains",
              value: (localFilter.value as string) || "",
            }}
            onChange={(v) =>
              setLocalFilter({
                ...localFilter,
                operator: v.operator,
                value: v.value,
              })
            }
          />
        )
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`p-1 rounded hover:bg-gray-200 transition-colors ${
            isActive ? "text-blue-600 bg-blue-100" : "text-gray-400"
          }`}
        >
          <Filter className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Filtrar: {column}</h4>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {renderFilter()}

          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-xs"
              onClick={handleClear}
            >
              Limpar
            </Button>
            <Button
              size="sm"
              className="flex-1 h-7 text-xs bg-black hover:bg-gray-800"
              onClick={handleApply}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
