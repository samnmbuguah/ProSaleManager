import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";
import VarianceAnalysis from "@/components/reports/VarianceAnalysis";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function StockTake() {
    const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
    const [isExporting, setIsExporting] = useState(false);
    const [showVarianceAnalysis, setShowVarianceAnalysis] = useState(false);

    const handleExportTemplate = async () => {
        try {
            setIsExporting(true);

            const endpoint = `/reports/export/stock-take/${exportFormat}`;

            const response = await api.get(endpoint, {
                responseType: "blob",
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;

            const contentDisposition = response.headers["content-disposition"];
            let filename = `stock-take-template.${exportFormat}`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast({
                title: "Template Exported",
                description: `Stock take template downloaded successfully as ${exportFormat.toUpperCase()}`,
            });

        } catch (error) {
            console.error("Error exporting template:", error);
            toast({
                title: "Export Failed",
                description: "Failed to export stock take template. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Stock Take</h2>
                <p className="text-muted-foreground">
                    Perform physical inventory counts and analyze variance
                </p>
            </div>

            {!showVarianceAnalysis ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                    1
                                </div>
                                <div>
                                    <CardTitle>Export Stock Take Template</CardTitle>
                                    <CardDescription>
                                        Download a template with your current inventory
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Export Format</label>
                                <Select
                                    value={exportFormat}
                                    onValueChange={(value: 'csv' | 'excel') => setExportFormat(value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="csv">CSV</SelectItem>
                                        <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                onClick={handleExportTemplate}
                                disabled={isExporting}
                                className="w-full"
                                size="lg"
                            >
                                {isExporting ? (
                                    <>
                                        <Download className="mr-2 h-4 w-4 animate-pulse" />
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Template
                                    </>
                                )}
                            </Button>

                            <div className="bg-muted p-4 rounded-lg space-y-2">
                                <p className="text-sm font-medium">What&apos;s included:</p>
                                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                    <li>Product Name &amp; SKU</li>
                                    <li>Category</li>
                                    <li>Current Quantity (from system)</li>
                                    <li>New Quantity (for you to fill)</li>
                                    <li>Variance (auto-calculated)</li>
                                    <li>Notes (for discrepancy explanations)</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                    2
                                </div>
                                <div>
                                    <CardTitle>Import &amp; Analyze Variance</CardTitle>
                                    <CardDescription>
                                        Upload your completed stock take and review discrepancies
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={() => setShowVarianceAnalysis(true)}
                                size="lg"
                                className="w-full md:w-auto"
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                Import Completed Stock Take
                            </Button>
                            <p className="text-sm text-muted-foreground mt-3">
                                Click here once you&apos;ve completed your physical count and filled the template
                            </p>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div>
                    <Button
                        variant="outline"
                        onClick={() => setShowVarianceAnalysis(false)}
                        className="mb-4"
                    >
                        ← Back to Instructions
                    </Button>
                    <VarianceAnalysis onClose={() => setShowVarianceAnalysis(false)} />
                </div>
            )}
        </div>
    );
}
