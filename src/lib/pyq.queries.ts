import { queryOptions } from "@tanstack/react-query";
import { pyqBootstrap, getPyqSession } from "./pyq.functions";

export const pyqBootstrapOptions = () => queryOptions({
  queryKey: ["pyq", "bootstrap"],
  queryFn: () => pyqBootstrap({ data: { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone } }),
  staleTime: 60_000,
});
export const pyqSessionOptions = (id: string) => queryOptions({
  queryKey: ["pyq", "session", id], queryFn: () => getPyqSession({ data: { id } }), staleTime: 15_000,
});