import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import type { Customer } from '@/types/customer'

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartTotal: number;
  deliveryFee: number;
  setDeliveryFee: (fee: number) => void;
  paymentMethod: 'cash' | 'mpesa';
  setPaymentMethod: (method: 'cash' | 'mpesa') => void;
  customers: Customer[];
  selectedCustomer: number | null;
  setSelectedCustomer: (id: number | null) => void;
  onCheckout: () => void;
  isLoadingCheckout: boolean;
}

export const CheckoutDialog: React.FC<CheckoutDialogProps> = ({
  open,
  onOpenChange,
  cartTotal,
  deliveryFee,
  setDeliveryFee,
  paymentMethod,
  setPaymentMethod,
  customers,
  selectedCustomer,
  setSelectedCustomer,
  onCheckout,
  isLoadingCheckout
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Complete Sale</DialogTitle>
        <DialogDescription>
          Select payment method and customer details
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Payment Method</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="mpesa">M-Pesa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Customer (Optional)</Label>
          <Select
            value={selectedCustomer ? selectedCustomer.toString() : 'walk_in'}
            onValueChange={(value) =>
              setSelectedCustomer(value !== 'walk_in' ? parseInt(value) : null)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="walk_in">Walk-in Customer</SelectItem>
              {(customers || []).map((customer) => (
                <SelectItem key={customer.id} value={customer.id.toString()}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Delivery Fee</Label>
          <Input
            type="number"
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(Number(e.target.value))}
            min={0}
            step={0.01}
            placeholder="200"
          />
        </div>
        <div className="pt-4 space-y-2">
          <div className="flex justify-between text-lg font-bold">
            <span>Total Amount:</span>
            <span>KSh {(cartTotal + deliveryFee).toFixed(2)}</span>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={onCheckout} disabled={isLoadingCheckout}>
          {isLoadingCheckout ? 'Processing...' : 'Complete Sale'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
