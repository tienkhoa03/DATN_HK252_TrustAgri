import { useCallback, useRef } from 'react';
import { useSnackbar } from 'zmp-ui';
import type { SnackbarOptions } from 'zmp-ui/snackbar-provider';

/**
 * zmp-ui's useSnackbar() returns openSnackbar as a new function every render.
 * Listing it in useEffect / useCallback dependency arrays re-runs those on every
 * render → duplicate API calls. This hook forwards to the latest openSnackbar with
 * a stable reference.
 */
export function useStableOpenSnackbar(): (options: SnackbarOptions) => void {
  const { openSnackbar } = useSnackbar();
  const ref = useRef(openSnackbar);
  ref.current = openSnackbar;
  return useCallback((options: SnackbarOptions) => {
    ref.current(options);
  }, []);
}
