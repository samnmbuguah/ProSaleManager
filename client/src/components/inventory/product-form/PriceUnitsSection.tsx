import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UseFormReturn } from 'react-hook-form'
import { type ProductFormData } from '@/types/product'

interface PriceUnitsSectionProps {
  form: UseFormReturn<ProductFormData>
}

export function PriceUnitsSection({ form }: PriceUnitsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="piece_buying_price">Piece Buying Price</Label>
            <Input
              id="piece_buying_price"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...form.register('piece_buying_price', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="piece_selling_price">Piece Selling Price</Label>
            <Input
              id="piece_selling_price"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...form.register('piece_selling_price', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pack_buying_price">Pack Buying Price</Label>
            <Input
              id="pack_buying_price"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...form.register('pack_buying_price', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pack_selling_price">Pack Selling Price</Label>
            <Input
              id="pack_selling_price"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...form.register('pack_selling_price', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dozen_buying_price">Dozen Buying Price</Label>
            <Input
              id="dozen_buying_price"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...form.register('dozen_buying_price', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dozen_selling_price">Dozen Selling Price</Label>
            <Input
              id="dozen_selling_price"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...form.register('dozen_selling_price', { valueAsNumber: true })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
