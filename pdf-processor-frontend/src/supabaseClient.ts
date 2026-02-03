import { createClient } from '@supabase/supabase-js'

// 使用 Vite 的环境变量 import.meta.env 来获取 URL 和 KEY
// 我们在这里添加类型断言，以符合 TypeScript 的要求
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
