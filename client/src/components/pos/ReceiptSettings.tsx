import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useReceiptSettingsApi } from "@/lib/receipt-settings";

export function ReceiptSettings() {
  const { settings, updateSettings, isLoading, isError, error, updateStatus } =
    useReceiptSettingsApi();

  // Local state for form fields
  const [form, setForm] = useState(settings);
  const [dirty, setDirty] = useState(false);

  // Sync local state with backend settings when loaded/refetched
  useEffect(() => {
    setForm(settings);
    setDirty(false);
  }, [settings]);

  const handleChange = (field: keyof typeof form, value: unknown) => {
    // Type assertion based on field
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSave = () => {
    updateSettings(form);
    setDirty(false);
  };

  if (isLoading) return <div>Loading receipt settings...</div>;
  if (isError)
    return <div>Error loading receipt settings: {error?.message || "Unknown error"}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipt Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={form.businessName}
              onChange={(e) => handleChange("businessName", e.target.value)}
              disabled={updateStatus === "pending"}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              disabled={updateStatus === "pending"}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              disabled={updateStatus === "pending"}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              disabled={updateStatus === "pending"}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={form.website}
              onChange={(e) => handleChange("website", e.target.value)}
              disabled={updateStatus === "pending"}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="thankYouMessage">Thank You Message</Label>
            <Input
              id="thankYouMessage"
              value={form.thankYouMessage}
              onChange={(e) => handleChange("thankYouMessage", e.target.value)}
              disabled={updateStatus === "pending"}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="showLogo">Show Logo</Label>
            <Switch
              id="showLogo"
              checked={form.showLogo}
              onCheckedChange={(checked) => handleChange("showLogo", checked)}
              disabled={updateStatus === "pending"}
            />
          </div>
        </div>
        <div className="pt-4 flex justify-end">
          <Button onClick={handleSave} disabled={!dirty || updateStatus === "pending"}>
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
