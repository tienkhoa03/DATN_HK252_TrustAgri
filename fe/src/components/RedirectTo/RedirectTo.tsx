import { useEffect } from 'react';
import { useNavigate } from 'zmp-ui';

interface RedirectToProps {
  to: string;
  replace?: boolean;
}

export function RedirectTo({ to, replace = true }: RedirectToProps) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace });
  }, [navigate, to, replace]);
  return null;
}
