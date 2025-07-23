import React, { useEffect, useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Receipt, Printer, Download, X } from 'lucide-react'
import { api } from '@/lib/api'

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSaleId: number | null;
}

interface ReceiptData {
  id: number;
  total_amount: number;
  payment_method: string;
  amount_paid: number;
  delivery_fee: number;
  status: string;
  payment_status: string;
  createdAt: string;
  Customer?: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
  };
  User?: {
    id: number;
    name: string;
    email: string;
  };
  items?: Array<{
    id: number;
    quantity: number;
    unit_price: number;
    total: number;
    unit_type: string;
    Product: {
      id: number;
      name: string;
      sku?: string;
    };
  }>;
}

export const ReceiptDialog: React.FC<ReceiptDialogProps> = ({
  open,
  onOpenChange,
  currentSaleId
}) => {
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [receiptText, setReceiptText] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPdf, setShowPdf] = useState(false)

  const fetchReceiptData = useCallback(async () => {
    if (!currentSaleId) return

    setIsLoading(true)
    try {
      // Fetch sale details
      const saleResponse = await api.get(`/sales/${currentSaleId}`)
      setReceiptData(saleResponse.data)

      // Fetch receipt text (optional - don't fail if this endpoint has issues)
      try {
        const textResponse = await api.get(`/sales/${currentSaleId}/receipt/text`)
        setReceiptText(textResponse.data.receipt)
      } catch (textError) {
        console.warn('Could not fetch receipt text:', textError)
        // Set a fallback receipt text
        setReceiptText(`Receipt #${currentSaleId}\nGenerated on ${new Date().toLocaleString()}`)
      }
    } catch (error) {
      console.error('Error fetching receipt data:', error)
      // Set a basic error message
      setReceiptText(`Error loading receipt #${currentSaleId}`)
    } finally {
      setIsLoading(false)
    }
  }, [currentSaleId])

  useEffect(() => {
    if (open && currentSaleId) {
      fetchReceiptData()
    }
  }, [open, currentSaleId, fetchReceiptData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt #${receiptData?.id}</title>
            <style>
              body { font-family: monospace; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .items { margin: 20px 0; }
              .item { margin: 10px 0; }
              .total { border-top: 1px solid #000; padding-top: 10px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>🧾 PROSALE MANAGER</h2>
              <p>Receipt #${receiptData?.id}</p>
              <p>${formatDate(receiptData?.createdAt || '')}</p>
            </div>
            <div class="items">
              ${receiptData?.items?.map(item => `
                <div class="item">
                  <strong>${item.Product?.name || 'Unknown Product'}</strong><br>
                  ${item.quantity} ${item.unit_type} x ${formatCurrency(item.unit_price)} = ${formatCurrency(item.total)}
                </div>
              `).join('') || 'No items found'}
            </div>
            <div class="total">
              <strong>Total: ${formatCurrency(receiptData?.total_amount || 0)}</strong><br>
              Payment Method: ${receiptData?.payment_method}<br>
              ${receiptData?.payment_method === 'cash' && receiptData?.amount_paid
          ? `Amount Paid: ${formatCurrency(receiptData.amount_paid)}<br>
                   Change: ${formatCurrency(receiptData.amount_paid - receiptData.total_amount)}`
          : ''
        }
            </div>
            <div class="footer">
              Thank you for your business!
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleDownload = () => {
    const element = document.createElement('a')
    const file = new Blob([receiptText], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `receipt-${receiptData?.id}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading receipt...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Sale Receipt #{receiptData?.id}
          </DialogTitle>
          <DialogDescription>
            View and print the receipt for sale #{receiptData?.id}
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="pt-6">
            <pre className="whitespace-pre-wrap text-sm font-mono bg-white p-4 rounded border overflow-x-auto">
              {receiptText}
            </pre>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <CardFooter className="flex gap-2 justify-end pt-6">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </CardFooter>
      </DialogContent>
    </Dialog>
  )
}
