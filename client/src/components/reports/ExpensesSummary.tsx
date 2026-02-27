import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReportFilters, ExpenseFilters } from "./ReportFilters";
import { ExpensePieChart } from "./ExpensePieChart";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { api } from "@/lib/api";
import { ExportOptions } from "./ExportOptions";

interface ExpenseData {
    id: number;
    description: string;
    amount: number;
    category: string;
    date: string;
    payment_method: string;
    user?: {
        id: number;
        name: string;
    };
}

interface ExpenseCategoryData {
    category: string;
    amount: number;
    count: number;
    percentage: number;
}

interface ExpensesSummaryProps {
    expenses: ExpenseData[];
    onFiltersChange: (filters: ExpenseFilters) => void;
}

export default function ExpensesSummary({ expenses, onFiltersChange }: ExpensesSummaryProps) {
    const [filters, setFilters] = useState<ExpenseFilters>({
        category: "all",
        paymentMethod: "all",
        dateRange: { start: null, end: null },
    });

    const handleFiltersChange = (newFilters: ExpenseFilters) => {
        setFilters(newFilters);
        onFiltersChange(newFilters);
    };

    const handleClearFilters = () => {
        const clearedFilters: ExpenseFilters = {
            category: "all",
            paymentMethod: "all",
            dateRange: { start: null, end: null },
        };
        setFilters(clearedFilters);
        onFiltersChange(clearedFilters);
    };

    // Filter expenses based on current filters
    const filteredExpenses = expenses.filter((expense) => {
        // Category filter
        if (filters.category !== "all" && expense.category !== filters.category) {
            return false;
        }

        // Payment method filter
        if (filters.paymentMethod !== "all" &&
            expense.payment_method.toLowerCase().replace(" ", "") !== filters.paymentMethod) {
            return false;
        }

        // Date range filter
        if (filters.dateRange.start || filters.dateRange.end) {
            const expenseDate = new Date(expense.date);
            if (filters.dateRange.start && expenseDate < filters.dateRange.start) {
                return false;
            }
            if (filters.dateRange.end && expenseDate > filters.dateRange.end) {
                return false;
            }
        }

        return true;
    });

    // Calculate category data for pie chart
    const categoryMap = new Map<string, { amount: number; count: number }>();

    filteredExpenses.forEach((expense) => {
        const existing = categoryMap.get(expense.category) || { amount: 0, count: 0 };
        categoryMap.set(expense.category, {
            amount: existing.amount + expense.amount,
            count: existing.count + 1,
        });
    });

    const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    const categoryData: ExpenseCategoryData[] = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
    })).sort((a, b) => b.amount - a.amount);

    // Calculate summary statistics
    const totalExpenses = filteredExpenses.length;
    const averageExpense = totalExpenses > 0 ? totalAmount / totalExpenses : 0;

    // Find most expensive category
    const mostExpensiveCategory = categoryData.length > 0 ? categoryData[0] : null;

    // Calculate monthly trend (simplified - comparing current month vs previous)
    const currentMonth = new Date();
    const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);

    const currentMonthExpenses = filteredExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= currentMonth && expenseDate < nextMonth;
    }).reduce((sum, expense) => sum + expense.amount, 0);

    const previousMonthExpenses = filteredExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= previousMonth && expenseDate < currentMonth;
    }).reduce((sum, expense) => sum + expense.amount, 0);

    const monthlyTrend = previousMonthExpenses > 0
        ? ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100
        : 0;

    const formatCurrency = (amount: number) => {
        return `KSh ${amount.toLocaleString('en-KE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-KE');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold">Expenses Summary</h2>
                    <p className="text-muted-foreground">Showing {filteredExpenses.length} expenses</p>
                </div>
                <ExportOptions
                    onExport={async (format) => {
                        const params: Record<string, string> = {};
                        if (filters.category && filters.category !== "all") params.category = filters.category;
                        if (filters.dateRange?.start) params.startDate = filters.dateRange.start.toISOString();
                        if (filters.dateRange?.end) params.endDate = filters.dateRange.end.toISOString();

                        const response = await api.get(`/reports/export/expenses/${format}`, {
                            params,
                            responseType: "blob",
                        });

                        const url = window.URL.createObjectURL(new Blob([response.data]));
                        const link = document.createElement("a");
                        link.href = url;
                        const contentDisposition = response.headers["content-disposition"];
                        let filename = `expenses-export.${format}`;
                        if (contentDisposition) {
                            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                            if (filenameMatch) filename = filenameMatch[1];
                        }
                        link.setAttribute("download", filename);
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        window.URL.revokeObjectURL(url);
                    }}
                    disabled={filteredExpenses.length === 0}
                    exportType="expenses"
                />
            </div>

            <ReportFilters
                type="expenses"
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
                        <p className="text-xs text-muted-foreground">
                            {totalExpenses} transactions
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(averageExpense)}</div>
                        <p className="text-xs text-muted-foreground">
                            Per transaction
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Category</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {mostExpensiveCategory?.category || "N/A"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {mostExpensiveCategory ? formatCurrency(mostExpensiveCategory.amount) : ""}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Trend</CardTitle>
                        {monthlyTrend >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${monthlyTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {monthlyTrend >= 0 ? '+' : ''}{monthlyTrend.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                            vs last month
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Pie Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Expense Categories Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <ExpensePieChart data={categoryData} totalAmount={totalAmount} />
                </CardContent>
            </Card>

            {/* Expenses Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Payment Method</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredExpenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No expenses found matching the current filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredExpenses
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .slice(0, 20) // Show only recent 20 expenses
                                    .map((expense) => (
                                        <TableRow key={expense.id}>
                                            <TableCell>{formatDate(expense.date)}</TableCell>
                                            <TableCell>{expense.description}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{expense.category}</Badge>
                                            </TableCell>
                                            <TableCell>{expense.payment_method}</TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(expense.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
