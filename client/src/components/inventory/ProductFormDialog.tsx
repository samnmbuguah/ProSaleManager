import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { ProductFormData, Product } from '@/types/product'
import { PRODUCT_CATEGORIES } from '@/constants/categories'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
  imagePreview: string | null;
  setImagePreview: (url: string | null) => void;
  onSubmit: (e: React.FormEvent, localImageFile?: File) => void;
  selectedProduct: Product | null;
}

const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  open,
  onOpenChange,
  formData,
  setFormData,
  imagePreview,
  setImagePreview,
  onSubmit,
  selectedProduct
}) => {
  // Key for localStorage
  const FORM_DRAFT_KEY = 'productFormDraft'

  // Load draft from localStorage on mount (only for add, not edit)
  React.useEffect(() => {
    if (!selectedProduct) {
      const draft = localStorage.getItem(FORM_DRAFT_KEY)
      if (draft) {
        try {
          setFormData({ ...formData, ...JSON.parse(draft) })
        } catch {}
      }
    }
    // eslint-disable-next-line
  }, [selectedProduct]);

  // Save formData to localStorage on change (only for add, not edit)
  React.useEffect(() => {
    if (!selectedProduct) {
      localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(formData))
    }
  }, [formData, selectedProduct])

  // Set default min_quantity to 5 if not already set
  React.useEffect(() => {
    if (
      !selectedProduct &&
      (!formData.min_quantity || formData.min_quantity === 0)
    ) {
      setFormData({ ...formData, min_quantity: 5 })
    }
    // eslint-disable-next-line
  }, [selectedProduct]);

  // Set default values for price fields to empty string for new products
  React.useEffect(() => {
    if (!selectedProduct) {
      setFormData({
        ...formData,
        piece_buying_price: Number(formData.piece_buying_price) || 0,
        piece_selling_price: Number(formData.piece_selling_price) || 0,
        pack_buying_price: Number(formData.pack_buying_price) || 0,
        pack_selling_price: Number(formData.pack_selling_price) || 0,
        dozen_buying_price: Number(formData.dozen_buying_price) || 0,
        dozen_selling_price: Number(formData.dozen_selling_price) || 0
      })
    }
    // eslint-disable-next-line
  }, [selectedProduct]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'number' ? Number(value) : value
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate type
      if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed.')
        return
      }
      // Validate size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB.')
        return
      }
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
    }
  }

  // Helper to update prices based on which field was edited
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const num = Number(value)
    const newFormData = { ...formData }
    if (name === 'piece_buying_price') {
      newFormData.piece_buying_price = num
      newFormData.pack_buying_price = Number((num * 4).toFixed(2))
      newFormData.dozen_buying_price = Number((num * 12).toFixed(2))
    } else if (name === 'pack_buying_price') {
      newFormData.pack_buying_price = num
      newFormData.piece_buying_price = Number((num / 4).toFixed(2))
      newFormData.dozen_buying_price = Number(((num / 4) * 12).toFixed(2))
    } else if (name === 'dozen_buying_price') {
      newFormData.dozen_buying_price = num
      newFormData.piece_buying_price = Number((num / 12).toFixed(2))
      newFormData.pack_buying_price = Number(((num / 12) * 4).toFixed(2))
    } else if (name === 'piece_selling_price') {
      newFormData.piece_selling_price = num
      newFormData.pack_selling_price = Number((num * 4).toFixed(2))
      newFormData.dozen_selling_price = Number((num * 12).toFixed(2))
    } else if (name === 'pack_selling_price') {
      newFormData.pack_selling_price = num
      newFormData.piece_selling_price = Number((num / 4).toFixed(2))
      newFormData.dozen_selling_price = Number(((num / 4) * 12).toFixed(2))
    } else if (name === 'dozen_selling_price') {
      newFormData.dozen_selling_price = num
      newFormData.piece_selling_price = Number((num / 12).toFixed(2))
      newFormData.pack_selling_price = Number(((num / 12) * 4).toFixed(2))
    }
    setFormData(newFormData)
  }

  // Helper to build the payload for submission, converting numbers
  const buildProductPayload = () => {
    const allowedFields = [
      'name',
      'description',
      'sku',
      'barcode',
      'category_id',
      'piece_buying_price',
      'piece_selling_price',
      'pack_buying_price',
      'pack_selling_price',
      'dozen_buying_price',
      'dozen_selling_price',
      'quantity',
      'min_quantity',
      'image_url',
      'is_active'
    ]
    const payload: Partial<ProductFormData> = {}
    allowedFields.forEach((field) => {
      if (formData[field as keyof ProductFormData] !== undefined) {
        const value = formData[field as keyof ProductFormData]
        if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
          (payload as any)[field] = value
        }
      }
    })
    return payload
  }

  // Validate required fields before submit
  const validateForm = () => {
    const requiredFields = [
      'name',
      'category_id',
      'piece_buying_price',
      'piece_selling_price',
      'pack_buying_price',
      'pack_selling_price',
      'dozen_buying_price',
      'dozen_selling_price',
      'quantity',
      'min_quantity'
    ]
    for (const field of requiredFields) {
      const value = formData[field as keyof ProductFormData]
      if (
        value === undefined ||
        value === null ||
        value === '' ||
        (typeof value === 'number' && isNaN(value))
      ) {
        return field
      }
    }
    return null
  }

  // Clear draft on successful submit (add product)
  const handleSubmit = async (e: React.FormEvent, localImageFile?: File) => {
    e.preventDefault()
    const invalidField = validateForm()
    if (invalidField) {
      alert(
        `Please fill the required field: ${invalidField.replace(/_/g, ' ')}`
      )
      return
    }
    const payload = buildProductPayload()
    console.log('[ProductFormDialog] Submitting payload:', payload)
    let submitResult
    try {
      if (localImageFile) {
        const formDataToSend = new FormData()
        Object.entries(payload).forEach(([key, value]) => {
          formDataToSend.append(key, String(value))
        })
        formDataToSend.append('image', localImageFile)
        submitResult = await onSubmit(e, localImageFile)
      } else {
        submitResult = await onSubmit(e)
      }
      console.log('[ProductFormDialog] Submit response:', submitResult)
    } catch (err) {
      console.error('[ProductFormDialog] Submit error:', err)
    }
    if (!selectedProduct) {
      localStorage.removeItem(FORM_DRAFT_KEY)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>
            {selectedProduct ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogDescription>
            Fill in the product details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image">Product Image (Optional)</Label>
            <Input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-1"
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Product Preview"
                  className="w-32 h-32 object-cover rounded-md"
                />
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="category_id">Category *</Label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category_id: Number(e.target.value)
                })
              }
              required
              className="block w-full border rounded px-3 py-2"
            >
              <option value="" disabled>
                Select category
              </option>
              {PRODUCT_CATEGORIES.map((cat, idx) => (
                <option key={cat} value={idx + 1}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="min_quantity">Minimum Stock *</Label>
              <Input
                id="min_quantity"
                name="min_quantity"
                type="number"
                value={formData.min_quantity}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="piece_buying_price">Piece Buying Price *</Label>
              <Input
                id="piece_buying_price"
                name="piece_buying_price"
                type="number"
                value={formData.piece_buying_price}
                onChange={handlePriceChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="piece_selling_price">Piece Selling Price *</Label>
              <Input
                id="piece_selling_price"
                name="piece_selling_price"
                type="number"
                value={formData.piece_selling_price}
                onChange={handlePriceChange}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pack_buying_price">Pack Buying Price</Label>
              <Input
                id="pack_buying_price"
                name="pack_buying_price"
                type="number"
                value={formData.pack_buying_price}
                onChange={handlePriceChange}
              />
            </div>
            <div>
              <Label htmlFor="pack_selling_price">Pack Selling Price</Label>
              <Input
                id="pack_selling_price"
                name="pack_selling_price"
                type="number"
                value={formData.pack_selling_price}
                onChange={handlePriceChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dozen_buying_price">Dozen Buying Price</Label>
              <Input
                id="dozen_buying_price"
                name="dozen_buying_price"
                type="number"
                value={formData.dozen_buying_price}
                onChange={handlePriceChange}
              />
            </div>
            <div>
              <Label htmlFor="dozen_selling_price">Dozen Selling Price</Label>
              <Input
                id="dozen_selling_price"
                name="dozen_selling_price"
                type="number"
                value={formData.dozen_selling_price}
                onChange={handlePriceChange}
              />
            </div>
          </div>
          {/* Optional fields */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="barcode">Barcode</Label>
            <Input
              id="barcode"
              name="barcode"
              value={formData.barcode}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="is_active">Active</Label>
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
            />
          </div>
          <Button type="submit" className="w-full">
            {selectedProduct ? 'Update Product' : 'Add Product'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ProductFormDialog
