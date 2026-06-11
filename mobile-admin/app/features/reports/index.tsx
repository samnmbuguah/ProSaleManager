import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
    ActivityIndicator,
    Appbar,
    Button,
    Card,
    SegmentedButtons,
    Text,
    useTheme,
} from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getPeriodRange, reportService } from '@/services/reportService';
import {
    ExpensesSummary,
    ProductPerformanceItem,
    ReportPeriod,
    SalesSummaryResponse,
} from '@/types/report';

const formatMoney = (value: number | null | undefined) =>
    `$${Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatLabel = (value: string) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ') : 'Unknown';

export default function ReportsScreen() {
    const theme = useTheme();
    const [period, setPeriod] = useState<ReportPeriod>('today');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [salesSummary, setSalesSummary] = useState<SalesSummaryResponse | null>(null);
    const [expensesSummary, setExpensesSummary] = useState<ExpensesSummary | null>(null);
    const [topProducts, setTopProducts] = useState<ProductPerformanceItem[]>([]);

    const loadData = async (selectedPeriod: ReportPeriod, isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        setError(null);

        try {
            const { startDate, endDate } = getPeriodRange(selectedPeriod);
            const [sales, expenses, performance] = await Promise.all([
                reportService.getSalesSummary(selectedPeriod),
                reportService.getExpensesSummary(startDate, endDate),
                reportService.getProductPerformance(startDate, endDate),
            ]);
            setSalesSummary(sales);
            setExpensesSummary(expenses);
            setTopProducts(
                [...performance.products].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
            );
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to load reports. Please check your connection.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData(period);
        }, [period])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData(period, true);
    }, [period]);

    const StatCard = ({ title, value, icon, color, subtitle }: { title: string; value: string; icon: string; color: string; subtitle?: string }) => (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.cardHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                        <IconSymbol name={icon as any} size={24} color={color} />
                    </View>
                    <Text variant="titleMedium" style={{ color: theme.colors.outline }}>{title}</Text>
                </View>
                <Text variant="headlineSmall" style={styles.bold}>{value}</Text>
                {subtitle && <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>{subtitle}</Text>}
            </Card.Content>
        </Card>
    );

    const current = salesSummary?.current;
    const compare = salesSummary?.compare;
    const totalExpenses = expensesSummary?.totalExpenses ?? 0;
    const netProfit = (current?.totalProfit ?? 0) - totalExpenses;

    return (
        <ThemedView style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title="Reports" />
            </Appbar.Header>

            <View style={styles.periodContainer}>
                <SegmentedButtons
                    value={period}
                    onValueChange={(value) => setPeriod(value as ReportPeriod)}
                    buttons={[
                        { value: 'today', label: 'Today' },
                        { value: 'this_week', label: 'Week' },
                        { value: 'this_month', label: 'Month' },
                    ]}
                />
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" />
                </View>
            ) : error && !salesSummary ? (
                <View style={styles.center}>
                    <IconSymbol name="exclamationmark.triangle.fill" size={48} color={theme.colors.error} />
                    <Text variant="titleMedium" style={styles.errorText}>{error}</Text>
                    <Button mode="contained" onPress={() => loadData(period)} style={{ marginTop: 16 }}>
                        Retry
                    </Button>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    <View style={styles.statsGrid}>
                        <View style={styles.col}>
                            <StatCard
                                title="Revenue"
                                value={formatMoney(current?.totalRevenue)}
                                icon="circle.dollar"
                                color="#4CAF50"
                                subtitle={compare ? `Prev: ${formatMoney(compare.totalRevenue)}` : undefined}
                            />
                        </View>
                        <View style={styles.col}>
                            <StatCard
                                title="Profit"
                                value={formatMoney(current?.totalProfit)}
                                icon="chart.bar.fill"
                                color="#2196F3"
                                subtitle={compare ? `Prev: ${formatMoney(compare.totalProfit)}` : undefined}
                            />
                        </View>
                    </View>

                    <View style={styles.statsGrid}>
                        <View style={styles.col}>
                            <StatCard
                                title="Orders"
                                value={(current?.totalSales ?? 0).toLocaleString()}
                                icon="cart.fill"
                                color="#FF9800"
                                subtitle={compare ? `Prev: ${compare.totalSales.toLocaleString()}` : undefined}
                            />
                        </View>
                        <View style={styles.col}>
                            <StatCard
                                title="Expenses"
                                value={formatMoney(totalExpenses)}
                                icon="banknote"
                                color="#F44336"
                                subtitle={`${expensesSummary?.count ?? 0} entries`}
                            />
                        </View>
                    </View>

                    <Card style={[styles.card, styles.netCard]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={{ color: theme.colors.outline }}>
                                Net (Profit - Expenses)
                            </Text>
                            <Text
                                variant="headlineMedium"
                                style={[styles.bold, { color: netProfit >= 0 ? '#4CAF50' : theme.colors.error }]}
                            >
                                {formatMoney(netProfit)}
                            </Text>
                        </Card.Content>
                    </Card>

                    {current && Object.keys(current.paymentMethods).length > 0 && (
                        <>
                            <Text variant="titleLarge" style={styles.sectionTitle}>Payment Methods</Text>
                            <Card style={styles.card}>
                                <Card.Content>
                                    {Object.entries(current.paymentMethods).map(([method, amount]) => (
                                        <View key={method} style={styles.listRowBetween}>
                                            <Text variant="bodyLarge">{formatLabel(method)}</Text>
                                            <Text variant="bodyLarge" style={styles.bold}>{formatMoney(Number(amount))}</Text>
                                        </View>
                                    ))}
                                </Card.Content>
                            </Card>
                        </>
                    )}

                    {expensesSummary && expensesSummary.categoryBreakdown.length > 0 && (
                        <>
                            <Text variant="titleLarge" style={styles.sectionTitle}>Expense Breakdown</Text>
                            <Card style={styles.card}>
                                <Card.Content>
                                    {expensesSummary.categoryBreakdown.map((item) => (
                                        <View key={item.category} style={styles.listRowBetween}>
                                            <View style={styles.flex1}>
                                                <Text variant="bodyLarge">{item.category}</Text>
                                                <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                                                    {item.count} entries • {item.percentage.toFixed(1)}%
                                                </Text>
                                            </View>
                                            <Text variant="bodyLarge" style={styles.bold}>{formatMoney(item.amount)}</Text>
                                        </View>
                                    ))}
                                </Card.Content>
                            </Card>
                        </>
                    )}

                    <Text variant="titleLarge" style={styles.sectionTitle}>Top Products</Text>
                    {topProducts.length === 0 ? (
                        <Card style={styles.card}>
                            <Card.Content>
                                <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>
                                    No product sales in this period.
                                </Text>
                            </Card.Content>
                        </Card>
                    ) : (
                        topProducts.map((product, index) => (
                            <Card key={product.productId} style={styles.listCard}>
                                <Card.Content style={styles.listRow}>
                                    <View style={styles.rankContainer}>
                                        <Text style={styles.bold}>#{index + 1}</Text>
                                    </View>
                                    <View style={styles.flex1}>
                                        <Text variant="titleMedium">{product.productName}</Text>
                                        <Text variant="bodySmall">{product.quantity} units sold</Text>
                                    </View>
                                    <Text variant="titleMedium" style={styles.bold}>
                                        {formatMoney(product.revenue)}
                                    </Text>
                                </Card.Content>
                            </Card>
                        ))
                    )}
                    <View style={{ height: 20 }} />
                </ScrollView>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        marginTop: 16,
        textAlign: 'center',
        marginHorizontal: 32,
    },
    periodContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    content: {
        padding: 16,
        paddingTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    col: {
        flex: 1,
    },
    flex1: {
        flex: 1,
    },
    card: {
        elevation: 2,
        backgroundColor: 'white',
    },
    netCard: {
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    iconContainer: {
        padding: 8,
        borderRadius: 8,
    },
    bold: {
        fontWeight: 'bold',
    },
    sectionTitle: {
        marginTop: 16,
        marginBottom: 12,
        fontWeight: 'bold',
    },
    listCard: {
        marginBottom: 8,
        backgroundColor: 'white',
    },
    listRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    listRowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    rankContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
});
