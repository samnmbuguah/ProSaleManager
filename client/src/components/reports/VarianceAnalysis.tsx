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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";

interface VarianceResult {
  productId: number;
  productName: string;
  sku: string;
  category: string;
  currentQuantity: number;
  newQuantity: number;
  variance: number;
  notes: string;
  variancePercentage: string;
}

interface VarianceSummary {
  totalProducts: number;
  totalVariance: number;
  positiveVariance: number;
  negativeVariance: number;
  noVariance: number;
  averageVariance: string;
}

interface VarianceAnalysisProps {
  onClose: () => void;
}

export default function VarianceAnalysis({ onClose }: VarianceAnalysisProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [varianceResults, setVarianceResults] = useState<VarianceResult[]>([]);
  const [summary, setSummary] = useState<VarianceSummary | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const parseCSV = (csvText: string): Array<{sku: string, newQuantity: number, notes: string}> => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Find column indices
    const skuIndex = headers.findIndex(h => h.toLowerCase().includes('sku'));
    const newQuantityIndex = headers.findIndex(h => h.toLowerCase().includes('new quantity'));
    const notesIndex = headers.findIndex(h => h.toLowerCase().includes('notes'));

    const data: Array<{sku: string, newQuantity: number, notes: string}> = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      
      if (values.length > Math.max(skuIndex, newQuantityIndex, notesIndex)) {
        data.push({
          sku: values[skuIndex] || '',
          newQuantity: parseFloat(values[newQuantityIndex]) || 0,
          notes: values[notesIndex] || ''
        });
      }
    }

    return data;
  };

  const handleProcessVariance = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to process.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      
      const csvText = await file.text();
      const stockTakeData = parseCSV(csvText);

      const response = await api.post("/reports/stock-take/import", {
        stockTakeData
      });

      if (response.data.success) {
        setVarianceResults(response.data.data.varianceResults);
        setSummary(response.data.data.summary);
        
        toast({
          title: "Variance Analysis Complete",
          description: `Processed ${response.data.data.varianceResults.length} products`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error processing variance:", error);
      toast({
        title: "Processing Failed",
        description: "Failed to process variance analysis. Please check your CSV format.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getVarianceBadge = (variance: number) => {
    if (variance > 0) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><TrendingUp className="h-3 w-3 mr-1" />+{variance}</Badge>;
    } else if (variance < 0) {
      return <Badge variant="destructive"><TrendingDown className="h-3 w-3 mr-1" />{variance}</Badge>;
    } else {
      return <Badge variant="secondary"><Minus className="h-3 w-3 mr-1" />0</Badge>;
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Stock Take Variance Analysis</h2>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Stock Take Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="flex-1"
            />
            <Button
              onClick={handleProcessVariance}
              disabled={!file || isUploading}
              className="flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Upload className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Process Variance
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Upload a CSV file with the completed stock take results. The file should contain SKU, New Quantity, and Notes columns.
          </p>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Products analyzed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Positive Variance</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.positiveVariance}</div>
              <p className="text-xs text-muted-foreground">
                More than expected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Negative Variance</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.negativeVariance}</div>
              <p className="text-xs text-muted-foreground">
                Less than expected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">No Variance</CardTitle>
              <Minus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.noVariance}</div>
              <p className="text-xs text-muted-foreground">
                Exact match
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Variance Results Table */}
      {varianceResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Variance Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Current Qty</TableHead>
                  <TableHead className="text-right">New Qty</TableHead>
                  <TableHead className="text-center">Variance</TableHead>
                  <TableHead className="text-right">Variance %</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {varianceResults.map((result) => (
                  <TableRow key={result.productId}>
                    <TableCell className="font-medium">{result.productName}</TableCell>
                    <TableCell>{result.sku}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{result.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{result.currentQuantity}</TableCell>
                    <TableCell className="text-right">{result.newQuantity}</TableCell>
                    <TableCell className="text-center">
                      {getVarianceBadge(result.variance)}
                    </TableCell>
                    <TableCell className="text-right">
                      {result.variancePercentage}%
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{result.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
