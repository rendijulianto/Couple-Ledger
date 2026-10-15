import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface RouterContextType {
  pathname: string;
  navigate: (to: string) => void;
  replace: (to: string) => void;
}

const RouterContext = createContext<RouterContextType>({
  pathname: typeof window !== "undefined" ? window.location.pathname : "/",
  navigate: () => {},
  replace: () => {},
});

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState<string>(
    typeof window !== "undefined" ? window.location.pathname : "/",
  );

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((to: string) => {
    if (typeof window !== "undefined") {
      if (window.location.pathname !== to) {
        window.history.pushState(null, "", to);
        setPathname(to);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, []);

  const replace = useCallback((to: string) => {
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", to);
      setPathname(to);
    }
  }, []);

  return (
    <RouterContext.Provider value={{ pathname, navigate, replace }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return useContext(RouterContext);
}

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  className?: string;
  replace?: boolean;
}

export function Link({ href, children, className, replace = false, onClick, ...rest }: LinkProps) {
  const { navigate, replace: routerReplace } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);

    // Don't intercept if target="_blank" or special modifier keys are pressed
    if (
      e.defaultPrevented ||
      rest.target === "_blank" ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:") ||
      href.startsWith("#")
    ) {
      return;
    }

    e.preventDefault();
    if (replace) {
      routerReplace(href);
    } else {
      navigate(href);
    }
  };

  return (
    <a href={href} onClick={handleClick} className={className} {...rest}>
      {children}
    </a>
  );
}

