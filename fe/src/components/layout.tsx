import React, { useEffect, useMemo, type ComponentType, type PropsWithChildren } from "react";
import { getSystemInfo } from "zmp-sdk";
import { App, SnackbarProvider } from "zmp-ui";
import { TrustWebRouter } from "@/components/TrustWebRouter";
import { AppProps } from "zmp-ui/app";
import { AppRoutes } from "@/router/routes";
import { bootstrapAuthSessionStorage } from "@/state/authSessionStorage";

/** Theme from Zalo host; safe fallback when opening the SPA outside ZMP (Docker/nginx, plain browser). */
function resolveAppTheme(): AppProps["theme"] {
  try {
    const zaloTheme = getSystemInfo()?.zaloTheme;
    if (zaloTheme != null && String(zaloTheme).length > 0) {
      return zaloTheme as AppProps["theme"];
    }
  } catch {
    // zmp-sdk is not available outside the Zalo Mini App runtime.
  }
  return "light" as AppProps["theme"];
}

const Layout = () => {
  const theme = useMemo(() => resolveAppTheme(), []);

  useEffect(() => bootstrapAuthSessionStorage(), []);

  // zmp-ui's SnackbarProvider type declarations are missing the default component export signature.
  // Runtime works fine; we cast to a React component type to satisfy TS.
  const SnackbarProviderComponent = SnackbarProvider as unknown as ComponentType<PropsWithChildren>;

  return (
    <App theme={theme}>
      <SnackbarProviderComponent>
        <TrustWebRouter>
          <AppRoutes />
        </TrustWebRouter>
      </SnackbarProviderComponent>
    </App>
  );
};
export default Layout;
