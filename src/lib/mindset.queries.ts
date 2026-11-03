import { queryOptions } from "@tanstack/react-query";
import { getMindsetState } from "./mindset.functions";

export const mindsetOptions = () => queryOptions({
  queryKey: ["mindset", "state"],
  queryFn: () => getMindsetState({ data: { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone } }),
  staleTime: 15_000,
});
