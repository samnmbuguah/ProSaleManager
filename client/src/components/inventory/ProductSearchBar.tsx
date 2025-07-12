import React from 'react'
import { Input } from '@/components/ui/input'

interface ProductSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: (query: string) => void;
}

const ProductSearchBar: React.FC<ProductSearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  onSearch
}) => {
  // Debounce search
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSearch(value)
    }, 300)
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Search products..."
        value={searchQuery}
        onChange={handleChange}
        className="w-64"
      />
    </div>
  )
}

export default ProductSearchBar
