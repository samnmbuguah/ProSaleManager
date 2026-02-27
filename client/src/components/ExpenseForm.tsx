import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { Expense } from "@/types/expense";
import { useQuery } from "@tanstack/react-query";
import { expenseService } from "@/services/expenseService";
import { useStoreContext } from "@/contexts/StoreContext";
import { useState } from "react";

const paymentMethods = ["Cash", "Card", "Mobile Money", "Other"] as const;

const formSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.coerce
    .number()
    .min(0.01, "Amount must be greater than 0")
    .max(1000000, "Amount must be less than 1,000,000"),
  category: z.string().min(1, "Please select or enter a category"),
  custom_category: z.string().optional(),
  date: z.date({
    required_error: "Date is required",
  }),
  payment_method: z.enum(paymentMethods, {
    required_error: "Please select a payment method",
  }),
});

type ExpenseFormValues = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, "id" | "user_id" | "createdAt" | "updatedAt">) => void;
}

export default function ExpenseForm({ onAddExpense }: ExpenseFormProps) {
  const { currentStore } = useStoreContext();
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const { data: serverCategories = [] } = useQuery({
    queryKey: ["expense-categories", currentStore?.id],
    queryFn: () => expenseService.getCategories(currentStore?.id),
    enabled: !!currentStore?.id,
  });

  const defaultCategories = ["Lunch", "Delivery", "Marketing", "Transport", "Salary", "Other"];
  const categories = Array.from(new Set([...defaultCategories, ...serverCategories]));

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: 0,
      category: "Other",
      custom_category: "",
      date: new Date(),
      payment_method: "Cash" as const,
    },
  });

  const onSubmit = (data: ExpenseFormValues) => {
    const category = isCustomCategory ? data.custom_category : data.category;
    if (!category) return;

    onAddExpense({
      ...data,
      category,
      date: format(data.date, "yyyy-MM-dd"),
    });

    form.reset({
      description: "",
      amount: 0,
      category: "Other",
      custom_category: "",
      date: new Date(),
      payment_method: "Cash" as const,
    });
    setIsCustomCategory(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-card p-6 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Add New Expense</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="What was this for?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (KES)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === "" ? "0" : e.target.value;
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <div className="space-y-2">
                  {!isCustomCategory ? (
                    <Select
                      onValueChange={(value) => {
                        if (value === "NEW") {
                          setIsCustomCategory(true);
                          field.onChange("");
                        } else {
                          field.onChange(value);
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                        <SelectItem value="NEW" className="text-primary font-bold">
                          <Plus className="inline-block w-4 h-4 mr-1 text-emerald-500" /> New Category...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex gap-2">
                      <FormField
                        control={form.control}
                        name="custom_category"
                        render={({ field: customField }) => (
                          <div className="flex-1">
                            <FormControl>
                              <Input placeholder="Enter new category name" {...customField} autoFocus />
                            </FormControl>
                          </div>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCustomCategory(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-end">
            <Button type="submit" className="w-full">
              Add Expense
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
