const SUPABASE_URL = "https://xmiopurruokiejckqdui.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_dXH5VOpvqNA8VK-HsF3cUw_M6Ee60bF";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

window.supabaseClient = supabaseClient;