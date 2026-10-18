import { studyDay } from "./study-day";

export async function userStudyDay(client: { from: (table: "profiles") => any }, userId: string) {
  const { data, error } = await client.from("profiles").select("study_timezone").eq("id", userId).single();
  if (error) throw new Error(error.message);
  return studyDay(data?.study_timezone ?? "UTC");
}