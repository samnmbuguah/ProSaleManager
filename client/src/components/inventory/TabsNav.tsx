import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TabsNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsNav: React.FC<TabsNavProps> = ({ activeTab, setActiveTab }) => (
  <Tabs
    defaultValue="products"
    className="w-full"
    value={activeTab}
    onValueChange={setActiveTab}
  >
    <TabsList>
      <TabsTrigger value="products">Products</TabsTrigger>
      <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
      <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
    </TabsList>
  </Tabs>
);

export default TabsNav;
