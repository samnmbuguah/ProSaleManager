import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TabsNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole?: string;
}

const TabsNav: React.FC<TabsNavProps> = ({ activeTab, setActiveTab, userRole }) => (
  <Tabs defaultValue="products" className="w-full" value={activeTab} onValueChange={setActiveTab}>
    <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
      <TabsTrigger value="products" className="whitespace-nowrap">Products</TabsTrigger>
      <TabsTrigger value="suppliers" className="whitespace-nowrap">Suppliers</TabsTrigger>
      <TabsTrigger value="purchase-orders" className="whitespace-nowrap">Purchase Orders</TabsTrigger>
      {(userRole === "admin" || userRole === "super_admin") && (
        <TabsTrigger value="receive-stock" className="whitespace-nowrap">Receive Stock</TabsTrigger>
      )}
      <TabsTrigger value="stock-take" className="whitespace-nowrap">Stock Take</TabsTrigger>
    </TabsList>
  </Tabs>
);

export default TabsNav;
