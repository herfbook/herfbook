import * as React from "react";

export interface Breadcrumb {
  label: string;
  to?: string;
}

export interface PageMeta {
  title: string;
  breadcrumbs?: Breadcrumb[];
}

interface PageMetaContextValue {
  meta: PageMeta;
  setMeta: (meta: PageMeta) => void;
}

const PageMetaContext = React.createContext<PageMetaContextValue>({
  meta: { title: "" },
  setMeta: () => {},
});

export function PageMetaProvider({ children }: { children: React.ReactNode }) {
  const [meta, setMeta] = React.useState<PageMeta>({ title: "" });

  React.useEffect(() => {
    document.title = meta.title ? `${meta.title} · HerfBook` : "HerfBook";
  }, [meta.title]);

  return (
    <PageMetaContext.Provider value={{ meta, setMeta }}>
      {children}
    </PageMetaContext.Provider>
  );
}

export function usePageMetaContext() {
  return React.useContext(PageMetaContext);
}

export function usePageMeta(meta: PageMeta) {
  const { setMeta } = React.useContext(PageMetaContext);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => { setMeta(meta); }, [meta.title, JSON.stringify(meta.breadcrumbs)]);
}
