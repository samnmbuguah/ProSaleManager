import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";

// Add providers here if needed (e.g., router, theme, auth context)
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: AllTheProviders, ...options });

// re-export everything
export { screen, waitFor } from "@testing-library/react";

// override render method
export { customRender as render };
