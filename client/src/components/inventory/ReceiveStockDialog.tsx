import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { Product } from "@/types/product"; // Ensure you have this type or similar
import { useStoreContext } from "@/contexts/StoreContext";

// Define the API call - should probably be in a service but for speed inline here or move later
const receiveStockApi = async (data: any, storeId?: number) => {
    const headers = storeId ? { "x-store-id": storeId.toString() } : {};
    const response = await api.post("/api/stock/receive", data, { headers });
    return response.data;
};

interface ReceiveStockDialogProps {
    products: Product[]; // Pass products to select from
}

export function ReceiveStockDialog({ products }: ReceiveStockDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { currentStore } = useStoreContext();

    const form = useForm({
        defaultValues: {
            product_id: "",
            quantity: "",
            unit_type: "piece",
            buying_price: "",
            selling_price: "",
            notes: ""
        },
    });

    const mutation = useMutation({
        mutationFn: (data: any) => receiveStockApi(data, currentStore?.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast({
                title: "Success",
                description: "Stock received successfully",
            });
            setOpen(false);
            form.reset();
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "Failed to receive stock",
            });
        },
    });

    const onSubmit = (data: any) => {
        // ensure numbers
        const payload = {
            ...data,
            product_id: parseInt(data.product_id),
            quantity: parseFloat(data.quantity),
            buying_price: parseFloat(data.buying_price),
            selling_price: parseFloat(data.selling_price)
        }
        mutation.mutate(payload);
    };

    const selectedProductId = form.watch("product_id");
    const selectedProduct = products.find(p => p.id.toString() === selectedProductId);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Quick Receive Stock</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Receive New Stock</DialogTitle>
                    <DialogDescription>
                        Quickly add stock without a full purchase order.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="product_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a product" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {products.map((product) => (
                                                <SelectItem key={product.id} value={product.id.toString()}>
                                                    {product.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantity</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="unit_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unit Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Unit" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="piece">Piece</SelectItem>
                                                <SelectItem value="pack">Pack</SelectItem>
                                                <SelectItem value="dozen">Dozen</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="buying_price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Buying Price (per unit)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="selling_price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Selling Price (per unit)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes (Optional)</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={mutation.isPending}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Receive Stock
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
