import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface SaleTerminalProps {
  children: ReactNode;
}

export function SaleTerminal({ children }: SaleTerminalProps) {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div 
          className="h-full bg-cover bg-center rounded-lg p-4"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1532795986-dbef1643a596)',
            backgroundBlendMode: 'overlay',
            backgroundColor: 'rgba(255,255,255,0.9)',
          }}
        >
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
