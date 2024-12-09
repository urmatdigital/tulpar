import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          phone: string | null
          full_name: string | null
          role: 'admin' | 'buyer' | 'client'
          telegram_id: string | null
          created_at: string
          updated_at: string
        }
      }
      buyers: {
        Row: {
          id: string
          user_id: string
          company_name: string | null
          subdomain: string | null
          logo_url: string | null
          description: string | null
          rating: number
          is_verified: boolean
          created_at: string
          updated_at: string
        }
      }
      parcels: {
        Row: {
          id: string
          tracking_number: string
          buyer_id: string
          client_id: string
          status: 'pending' | 'processing' | 'in_transit' | 'delivered' | 'cancelled'
          description: string | null
          weight: number | null
          price: number | null
          created_at: string
          updated_at: string
        }
      }
    }
  }
}
