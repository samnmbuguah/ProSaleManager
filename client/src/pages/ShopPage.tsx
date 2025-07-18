import MainNav from '@/components/layout/MainNav'
import { useProducts } from '@/hooks/use-products'
import { useCart } from '@/contexts/CartContext'
import { useState } from 'react'
import { api, API_ENDPOINTS } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import Swal from 'sweetalert2'

export default function ShopPage() {
    const { products, isLoading } = useProducts()
    const { cart, addToCart, removeFromCart, clearCart } = useCart()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { toast } = useToast()
    // Track which product images failed to load
    const [imageErrorIds, setImageErrorIds] = useState<{ [id: number]: boolean }>({})

    const handleAddToCart = (product) => {
        if (!product || !product.id || !product.piece_selling_price) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid product',
                text: 'This product cannot be added to the cart.'
            })
            return
        }
        addToCart(product, 'piece', product.piece_selling_price)
    }

    const handleRemove = (itemId) => {
        removeFromCart(itemId)
    }

    const handleOrder = async () => {
        if (!cart.items.length) {
            Swal.fire({
                icon: 'info',
                title: 'Cart is empty',
                text: 'Please add items to your cart before placing an order.'
            })
            return
        }
        setIsSubmitting(true)
        try {
            await api.post(API_ENDPOINTS.orders.create, {
                items: cart.items.map(i => {
                    if (!i.product || !i.product.id) {
                        throw new Error('Invalid cart item')
                    }
                    return {
                        product_id: i.product.id,
                        quantity: i.quantity,
                        unit_type: i.unit_type,
                        unit_price: i.unit_price
                    }
                })
            })
            Swal.fire({
                icon: 'success',
                title: 'Order placed!',
                text: 'Your order has been submitted successfully.'
            })
            clearCart()
        } catch (e) {
            Swal.fire({
                icon: 'error',
                title: 'Order failed',
                text: e?.response?.data?.message || e.message || 'Failed to place order. Please try again.'
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) return <div>Loading...</div>

    // Defensive: If products is not an array, show error
    if (!Array.isArray(products)) {
        Swal.fire({
            icon: 'error',
            title: 'Product Load Error',
            text: 'Failed to load products. Please refresh the page.'
        })
        return null
    }

    return (
        <>
            <MainNav />
            <div className="container mx-auto p-4 mt-16">
                <h1 className="text-3xl font-bold mb-4">Shop</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {products.map(product => {
                        const mainImage = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null
                        return (
                            <Card key={product.id} className="flex flex-col p-4">
                                <img
                                    src={imageErrorIds[product.id] || !mainImage ? '/placeholder.png' : mainImage}
                                    alt={product.name || 'Product'}
                                    className="h-32 object-cover mb-2"
                                    onError={() => setImageErrorIds(prev => ({ ...prev, [product.id]: true }))}
                                />
                                <div className="font-semibold">{product.name || 'Unnamed Product'}</div>
                                <div className="text-sm text-muted-foreground mb-2">{product.description || 'No description'}</div>
                                <div className="mb-2">KSh {product.piece_selling_price ?? 'N/A'}</div>
                                <Button onClick={() => handleAddToCart(product)}>Add to Cart</Button>
                            </Card>
                        )
                    })}
                </div>
                <div className="bg-white rounded shadow p-4 max-w-md mx-auto">
                    <h2 className="text-xl font-bold mb-2">Cart</h2>
                    {cart.items.length === 0 && <div>Your cart is empty.</div>}
                    {cart.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center mb-2">
                            <span>{item.product?.name || 'Unknown'} x{item.quantity}</span>
                            <Button size="sm" variant="ghost" onClick={() => handleRemove(item.id)}>Remove</Button>
                        </div>
                    ))}
                    <div className="font-bold mt-2">Total: KSh {cart.total}</div>
                    <Button className="mt-2 w-full" onClick={handleOrder} disabled={isSubmitting || cart.items.length === 0}>
                        {isSubmitting ? 'Placing Order...' : 'Place Order'}
                    </Button>
                </div>
            </div>
        </>
    )
} 