import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "./database.types";

export const createClient = () => {
  return createClientComponentClient<Database>();
};