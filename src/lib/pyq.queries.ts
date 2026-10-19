import { queryOptions } from "@tanstack/react-query";
import { pyqBootstrap, getPyqSession, browseRevision, type RevisionFilters } from "./pyq.functions";

export const pyqBootstrapOptions = () => queryOptions({
  queryKey: ["pyq", "bootstrap"],
  queryFn: () => pyqBootstrap({ data: { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone } }),
  staleTime: 60_000,
});
export const pyqSessionOptions = (id: string) => queryOptions({
  queryKey: ["pyq", "session", id], queryFn: () => getPyqSession({ data: { id } }), staleTime: 15_000,
});
export const revisionOptions = (filters: RevisionFilters = { collection: "all", page: 0 }) => queryOptions({
  queryKey: ["pyq", "revision", filters], queryFn: () => browseRevision({ data: filters }), staleTime: 15_000,
});
