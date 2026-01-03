'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface UserSettings {
    id?: string
    user_id: string
    full_name: string | null
    business_name: string | null
    address: string | null
    currency: string
    created_at?: string
    updated_at?: string
}

export async function getSettings(): Promise<UserSettings | null> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error)
        return null
    }

    return data || {
        user_id: user.id,
        full_name: null,
        business_name: null,
        address: null,
        currency: 'INR'
    }
}

export async function updateSettings(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const settings = {
        user_id: user.id,
        full_name: formData.get('full_name') as string || null,
        business_name: formData.get('business_name') as string || null,
        address: formData.get('address') as string || null,
        currency: formData.get('currency') as string || 'INR',
        updated_at: new Date().toISOString()
    }

    // Check if settings exist
    const { data: existing } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .single()

    let error

    if (existing) {
        // Update existing settings
        const result = await supabase
            .from('user_settings')
            .update(settings)
            .eq('user_id', user.id)
        error = result.error
    } else {
        // Insert new settings
        const result = await supabase
            .from('user_settings')
            .insert(settings)
        error = result.error
    }

    if (error) {
        console.error('Error saving settings:', error)
        return { error: error.message }
    }

    revalidatePath('/settings')
    return { success: 'Settings saved successfully!' }
}
