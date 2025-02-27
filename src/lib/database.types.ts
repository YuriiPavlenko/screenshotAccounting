export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      cards: {
        Row: {
          id: string
          name: string
          balance: number
          last_four: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          balance: number
          last_four: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          balance?: number
          last_four?: string
          user_id?: string
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          date: string
          description: string
          amount: number
          category: string
          card_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          description: string
          amount: number
          category: string
          card_id: string
          user_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          description?: string
          amount?: number
          category?: string
          card_id?: string
          user_id?: string
          created_at?: string
        }
      }
      whitelisted_emails: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
      }
    }
    Functions: {
      update_card_balance: {
        Args: {
          p_card_id: string
          p_amount: number
        }
        Returns: undefined
      }
    }
  }
}

