import { useCallback, useMemo, useRef, type ReactNode } from "react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
// Must be the same context instance zmp-ui's AnimationRoutes consumes (not a local duplicate).
// zmp-ui's ZMPRouter forces basename `/zapps/${APP_ID}` in every production build, which breaks
// static hosting at `/` (e.g. Docker + nginx on localhost:3000).
import { AnimationRouterContext } from "zmp-ui/esm/components/router/ZMPRouter.js";

const PAGE_TRANSITION_DIRECTION = {
  FORWARD: "forward",
  BACKWARD: "backward",
} as const;

type ZmpHostWindow = Window & { APP_ID?: string; BASE_PATH?: string };

/**
 * Basename for react-router: Zalo hosts the mini app under `/zapps/{APP_ID}/…`.
 * zmp-ui's stock ZMPRouter sets that basename for *all* production bundles, so opening
 * the same build at `http://localhost/` never matches `/` routes. We only apply `/zapps/…`
 * when the URL (or ZMP testing query) indicates that layout.
 */
function resolveTrustRouterBasename(): string {
  if (typeof window === "undefined") return "";

  const w = window as ZmpHostWindow;
  const baseFromWindow = w.BASE_PATH || "";
  const appEnv = new URLSearchParams(w.location.search).get("env");
  const testingQuery =
    appEnv === "TESTING_LOCAL" || appEnv === "TESTING" || appEnv === "DEVELOPMENT";

  if (import.meta.env.PROD) {
    if (testingQuery && w.APP_ID) {
      return `/zapps/${w.APP_ID}`;
    }
    if (w.location.pathname.startsWith("/zapps/") && w.APP_ID) {
      return `/zapps/${w.APP_ID}`;
    }
    return baseFromWindow;
  }

  if (testingQuery && w.APP_ID) {
    return `/zapps/${w.APP_ID}`;
  }
  return baseFromWindow;
}

export type TrustWebRouterProps = {
  children: ReactNode;
  memoryRouter?: boolean;
};

/**
 * Drop-in replacement for zmp-ui `ZMPRouter` with fixed `basename` logic for web/Docker.
 */
export function TrustWebRouter({ children, memoryRouter }: TrustWebRouterProps) {
  const pageScrollPosition = useRef<Record<string, unknown>>({});

  const basepath = resolveTrustRouterBasename();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSetAnimate = useCallback((_args: { animate?: boolean; direction?: string }) => {}, []);

  const updateScrollPosition = (key: string, position: unknown) => {
    pageScrollPosition.current[key] = position;
  };

  const contextValue = useMemo(
    () => ({
      setAnimate: handleSetAnimate,
      animate: false,
      direction: PAGE_TRANSITION_DIRECTION.FORWARD,
      pageScrollPosition: pageScrollPosition.current,
      updatePosition: updateScrollPosition,
    }),
    [handleSetAnimate],
  );

  const RouterComponent = memoryRouter ? MemoryRouter : BrowserRouter;
  const routerProps = memoryRouter ? { initialEntries: [basepath] } : {};

  return (
    <AnimationRouterContext.Provider value={contextValue}>
      <RouterComponent basename={basepath} {...routerProps}>
        {children}
      </RouterComponent>
    </AnimationRouterContext.Provider>
  );
}
