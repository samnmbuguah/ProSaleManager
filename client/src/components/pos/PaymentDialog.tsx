import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CartItem } from '@/types/pos'

export interface PaymentDetails {
  paymentMethod: 'cash' | 'mpesa';
  amountPaid: number;
  change: number;
}

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onProcessPayment: (details: PaymentDetails) => void;
}

export function PaymentDialog ({
  isOpen,
  onClose,
  cartItems,
  onProcessPayment
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa'>('cash')
  const [amountPaid, setAmountPaid] = useState<string>('')

  const total = cartItems.reduce((sum, item) => sum + item.total, 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const paid = paymentMethod === 'mpesa' ? total : Number(amountPaid)
    onProcessPayment({
      paymentMethod,
      amountPaid: paid,
      change: Math.max(0, paid - total)
    })
  }

  const handlePaymentMethodSelect = (method: 'cash' | 'mpesa') => {
    setPaymentMethod(method)
    if (method === 'mpesa') {
      setAmountPaid(total.toString())
    } else {
      setAmountPaid('')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={paymentMethod === 'cash' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => handlePaymentMethodSelect('cash')}
            >
              Cash
            </Button>
            <Button
              type="button"
              variant={paymentMethod === 'mpesa' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => handlePaymentMethodSelect('mpesa')}
            >
              M-Pesa
            </Button>
          </div>

          <div>
            <Label>Total Amount</Label>
            <Input
              type="text"
              value={`KSh ${total.toFixed(2)}`}
              disabled
              className="text-right"
            />
          </div>

          {paymentMethod === 'cash' && (
            <div>
              <Label>Amount Paid</Label>
              <Input
                type="number"
                step="0.01"
                min={total}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                required
                className="text-right"
              />
            </div>
          )}

          {paymentMethod === 'cash' && amountPaid && (
            <div>
              <Label>Change</Label>
              <Input
                type="text"
                value={`KSh ${Math.max(0, Number(amountPaid) - total).toFixed(2)}`}
                disabled
                className="text-right"
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={
              paymentMethod === 'cash' &&
              (!amountPaid || Number(amountPaid) < total)
            }
          >
            Complete Payment
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
