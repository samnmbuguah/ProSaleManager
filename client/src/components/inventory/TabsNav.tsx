import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TabsNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole?: string;
}

const TabsNav: React.FC<TabsNavProps> = ({ activeTab, setActiveTab, userRole }) => (
  <Tabs defaultValue="products" className="w-full" value={activeTab} onValueChange={setActiveTab}>
    <TabsList>
      <TabsTrigger value="products">Products</TabsTrigger>
      <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
      <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
      {(userRole === "admin" || userRole === "super_admin") && (
        <TabsTrigger value="receive-stock">Receive Stock</TabsTrigger>
      )}
      <TabsTrigger value="stock-take">Stock Take</TabsTrigger>
    </TabsList>
  </Tabs>
);

export default TabsNav;
