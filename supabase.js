import { createClient } from '@supabase/supabase-js';

// Para rodar localmente, crie um arquivo .env na raiz do projeto com:
//   REACT_APP_SUPABASE_URL=https://SEU-PROJETO.supabase.co
//   REACT_APP_SUPABASE_ANON_KEY=sua-anon-key
//
// Se não tiver as credenciais, o app vai carregar mas as chamadas ao
// Supabase vão falhar silenciosamente.

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
