import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { ProductFormData, Product } from '@/types/product'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useCategories } from '@/hooks/use-categories';

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
  onSubmit: (e: React.FormEvent, localImageFile?: File) => void;
  selectedProduct: Product | null;
}

const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  selectedProduct
}) => {
  // Key for localStorage
  const FORM_DRAFT_KEY = 'productFormDraft'

  const { data: categories, isLoading } = useCategories();

  // Load draft from localStorage on mount (only for add, not edit), and sanitize category_id
  React.useEffect(() => {
    if (!selectedProduct && categories && categories.length > 0) {
      const draft = localStorage.getItem(FORM_DRAFT_KEY)
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft)
          const validCategoryIds = categories.map(c => c.id)
          if (!parsedDraft.category_id || !validCategoryIds.includes(parsedDraft.category_id)) {
            parsedDraft.category_id = categories[0].id
          }
          setFormData({ ...formData, ...parsedDraft })
        } catch { }
      }
    }
    // eslint-disable-next-line
  }, [selectedProduct, categories])

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
      'min_quantity',
      'sku'
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
      // Extra: For SKU, check for whitespace only
      if (field === 'sku' && typeof value === 'string' && value.trim() === '') {
        return field
      }
    }
    return null
  }

  // Multiple image upload state
  const [imageFiles, setImageFiles] = React.useState<File[]>([])
  const [imagePreviews, setImagePreviews] = React.useState<string[]>([])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setImageFiles(files)
    setImagePreviews(files.map((file) => URL.createObjectURL(file)))
  }

  // Helper to build the payload for submission, converting numbers
  const handleSubmit = async (e: React.FormEvent, _localImageFile?: File) => {
    e.preventDefault()
    const invalidField = validateForm()
    if (invalidField) {
      alert(
        `Please fill the required field: ${invalidField.replace(/_/g, ' ')}`
      )
      return
    }
    const payload = buildProductPayload()
    // Add images array if files selected
    if (imageFiles.length > 0) {
      const formDataToSend = new FormData()
      Object.entries(payload).forEach(([key, value]) => {
        formDataToSend.append(key, String(value))
      })
      imageFiles.forEach((file) => formDataToSend.append('images', file))
      try {
        await onSubmit(e, imageFiles[0]) // Pass first file for legacy support
      } catch (err: any) {
        if (err?.response?.data?.message?.includes('SKU')) {
          alert('SKU already exists. Please use a unique SKU.')
        } else {
          alert('Failed to save product: ' + (err?.response?.data?.message || err.message))
        }
      }
      return
    }
    try {
      await onSubmit(e)
    } catch (err: any) {
      if (err?.response?.data?.message?.includes('SKU')) {
        alert('SKU already exists. Please use a unique SKU.')
      } else {
        alert('Failed to save product: ' + (err?.response?.data?.message || err.message))
      }
    }
    if (!selectedProduct) {
      localStorage.removeItem(FORM_DRAFT_KEY)
    }
  }

  React.useEffect(() => {
    if (categories && categories.length > 0 && !formData.category_id) {
      setFormData((prev) => ({
        ...prev,
        category_id: categories[0].id
      }));
    }
  }, [categories, formData.category_id, setFormData]);

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
            <Label htmlFor="images">Product Images (Optional, multiple allowed)</Label>
            <Input
              id="images"
              name="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="mt-1"
            />
            {imagePreviews.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {imagePreviews.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Product Preview ${idx + 1}`}
                    className="w-24 h-24 object-cover rounded-md"
                  />
                ))}
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
              disabled={isLoading || !categories}
            >
              <option value="" disabled>
                {isLoading ? 'Loading...' : 'Select category'}
              </option>
              {categories && categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
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
