import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useReceiptSettings } from "@/lib/receipt-settings";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ReceiptSettings() {
  const {
    settings,
    updateSettings,
    templates,
    saveTemplate,
    deleteTemplate,
    loadTemplate,
    activeTemplateId,
  } = useReceiptSettings();
  const [newTemplateName, setNewTemplateName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleSaveTemplate = () => {
    if (newTemplateName.trim()) {
      saveTemplate(newTemplateName.trim());
      setNewTemplateName("");
      setShowSaveDialog(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipt Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Select
            value={activeTemplateId || ""}
            onValueChange={(value) => value && loadTemplate(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">Save as Template</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Template</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Enter template name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowSaveDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {activeTemplateId && (
            <Button
              variant="destructive"
              onClick={() => deleteTemplate(activeTemplateId)}
            >
              Delete Template
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={settings.businessName}
              onChange={(e) => updateSettings({ businessName: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={settings.address}
              onChange={(e) => updateSettings({ address: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={settings.phone}
              onChange={(e) => updateSettings({ phone: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={settings.email}
              onChange={(e) => updateSettings({ email: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={settings.website}
              onChange={(e) => updateSettings({ website: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="thankYouMessage">Thank You Message</Label>
            <Input
              id="thankYouMessage"
              value={settings.thankYouMessage}
              onChange={(e) =>
                updateSettings({ thankYouMessage: e.target.value })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="showLogo">Show Logo</Label>
            <Switch
              id="showLogo"
              checked={settings.showLogo}
              onCheckedChange={(checked) =>
                updateSettings({ showLogo: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Font Size</Label>
            <RadioGroup
              value={settings.fontSize}
              onValueChange={(value) =>
                updateSettings({
                  fontSize: value as "small" | "medium" | "large",
                })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="small" id="small" />
                <Label htmlFor="small">Small</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium">Medium</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="large" id="large" />
                <Label htmlFor="large">Large</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Paper Size</Label>
            <RadioGroup
              value={settings.paperSize}
              onValueChange={(value) =>
                updateSettings({ paperSize: value as "standard" | "thermal" })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standard" id="standard" />
                <Label htmlFor="standard">Standard (A4)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="thermal" id="thermal" />
                <Label htmlFor="thermal">Thermal (80mm)</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
