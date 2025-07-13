import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import { Product } from '@/types/product'

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (id: number) => void
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const getStockStatus = () => {
    if (product.quantity <= 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const }
    }
    if (product.quantity <= product.min_quantity) {
      return { label: 'Low Stock', variant: 'outline' as const }
    }
    return { label: 'In Stock', variant: 'default' as const }
  }

  const stockStatus = getStockStatus()

  return (
    <Card className="h-full">
      {/* Product Image */}
      <div className="w-full flex justify-center items-center pt-4">
        <img
          src={product.image_url && product.image_url.trim() !== '' ? product.image_url : 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=120&q=80'}
          alt={product.name}
          className="w-28 h-28 object-cover rounded-md border"
        />
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {product.name}
          </CardTitle>
          <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground space-y-1">
          <p>SKU: {product.sku || 'N/A'}</p>
          <p>Quantity: {product.quantity}</p>
          <p>Min Quantity: {product.min_quantity}</p>
          <div className="flex justify-between">
            <span>Cost: KSh {product.piece_buying_price.toLocaleString()}</span>
            <span>Price: KSh {product.piece_selling_price.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(product)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(product.id)}
            className="flex-1"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
