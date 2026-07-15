import { createClient } from "@supabase/supabase-js";

let _supabase: any = null;

export const supabase = new Proxy({} as any, {
  get(target, prop) {
    if (!_supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!url || !key) {
        // During build-time pre-rendering, we might not have these vars.
        // Returning undefined/noop objects prevents the "supabaseUrl is required" crash.
        return undefined;
      }
      
      _supabase = createClient(url, key);
    }
    return _supabase[prop];
  }
});
