import { useState } from 'react'
import { Product, ProductFormData } from '@/types/product'
import { formatCurrency } from '@/utils/formatters'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { ProductForm } from './ProductForm'
import { Settings, Edit } from 'lucide-react'

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  onUpdateProduct?: (
    id: number,
    data: ProductFormData,
  ) => Promise<void>;
}

export function ProductTable ({
  products = [],
  isLoading,
  onUpdateProduct
}: ProductTableProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!Array.isArray(products)) {
    return <div>No products found</div>
  }

  const getStockStatus = (product: Product) => {
    if (product.quantity <= product.min_quantity) {
      return { label: 'Low Stock', variant: 'destructive' as const }
    }
    return { label: 'In Stock', variant: 'default' as const }
  }

  const calculateProfitMargin = (
    buyingPrice: number,
    sellingPrice: number
  ) => {
    if (buyingPrice <= 0) return 'N/A'
    return (((sellingPrice - buyingPrice) / buyingPrice) * 100).toFixed(1) + '%'
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category ID</TableHead>
              <TableHead>Piece Price (Buy/Sell)</TableHead>
              <TableHead>Profit Margin</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              return (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.sku || 'N/A'}</TableCell>
                  <TableCell>{product.category_id}</TableCell>
                  <TableCell>
                    {`KSh ${product.piece_buying_price.toLocaleString('en-KE')} / KSh ${product.piece_selling_price.toLocaleString('en-KE')}`}
                  </TableCell>
                  <TableCell>
                    {calculateProfitMargin(
                      product.piece_buying_price,
                      product.piece_selling_price
                    )}
                  </TableCell>
                  <TableCell>{product.quantity}</TableCell>
                  <TableCell>
                    <Badge variant={getStockStatus(product).variant}>
                      {getStockStatus(product).label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProduct(product)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!editingProduct}
        onOpenChange={() => setEditingProduct(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <ProductForm
              initialData={{
                name: editingProduct.name,
                description: editingProduct.description || '',
                sku: editingProduct.sku || '',
                barcode: editingProduct.barcode || '',
                category_id: editingProduct.category_id,
                piece_buying_price: editingProduct.piece_buying_price,
                piece_selling_price: editingProduct.piece_selling_price,
                pack_buying_price: editingProduct.pack_buying_price,
                pack_selling_price: editingProduct.pack_selling_price,
                dozen_buying_price: editingProduct.dozen_buying_price,
                dozen_selling_price: editingProduct.dozen_selling_price,
                quantity: editingProduct.quantity,
                min_quantity: editingProduct.min_quantity,
                image_url: editingProduct.image_url || '',
                is_active: editingProduct.is_active
              }}
              onSubmit={async (data: ProductFormData) => {
                if (onUpdateProduct && editingProduct.id) {
                  await onUpdateProduct(editingProduct.id, data)
                  setEditingProduct(null)
                }
              }}
              isSubmitting={false}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedProduct}
        onOpenChange={() => setSelectedProduct(null)}
      >
        <DialogContent className="max-w-3xl">
          {selectedProduct && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>
                  Manage Product: {selectedProduct.name}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Stock Information</h3>
                  <p>Current Stock: {selectedProduct.quantity}</p>
                  <p>Minimum Stock: {selectedProduct.min_quantity || 'Not set'}</p>
                </div>
                <div>
                  <h3 className="font-medium">Pricing Information</h3>
                  <p>Piece Price: {formatCurrency(selectedProduct.piece_selling_price)}</p>
                  <p>Pack Price: {formatCurrency(selectedProduct.pack_selling_price)}</p>
                  <p>Dozen Price: {formatCurrency(selectedProduct.dozen_selling_price)}</p>
                </div>
              </div>
              {selectedProduct.Category && (
                <div className="mt-2">
                  <p className="font-medium">Category: {selectedProduct.Category.name}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
