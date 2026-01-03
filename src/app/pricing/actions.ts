'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface PricingDecision {
    id: string
    user_id: string
    cost_sheet_id: string
    pricing_method: 'cost_plus' | 'desired_profit' | 'market_basis'
    cost_per_unit: number
    selling_price: number
    markup_percentage: number | null
    profit_margin: number | null
    competitor_price: number | null
    notes: string | null
    created_at: string
    cost_sheet?: {
        id: string
        sheet_number: string
        product: {
            id: string
            name: string
            unit: string
        }
    }
}

export async function getPricingDecisions(): Promise<PricingDecision[]> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('pricing_decisions')
        .select(`
            *,
            cost_sheet:cost_sheets(
                id,
                sheet_number,
                product:products(id, name, unit)
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching pricing decisions:', error)
        return []
    }

    return data || []
}

export async function createPricingDecision(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const decision = {
        user_id: user.id,
        cost_sheet_id: formData.get('cost_sheet_id') as string,
        pricing_method: formData.get('pricing_method') as string,
        cost_per_unit: parseFloat(formData.get('cost_per_unit') as string) || 0,
        selling_price: parseFloat(formData.get('selling_price') as string) || 0,
        markup_percentage: formData.get('markup_percentage') ? parseFloat(formData.get('markup_percentage') as string) : null,
        profit_margin: formData.get('profit_margin') ? parseFloat(formData.get('profit_margin') as string) : null,
        competitor_price: formData.get('competitor_price') ? parseFloat(formData.get('competitor_price') as string) : null,
        notes: formData.get('notes') as string || null,
    }

    if (!decision.cost_sheet_id) {
        return { error: 'Please select a cost sheet' }
    }

    const { error } = await supabase
        .from('pricing_decisions')
        .insert(decision)

    if (error) {
        console.error('Error creating pricing decision:', error)
        return { error: error.message }
    }

    revalidatePath('/pricing')
    return { success: 'Pricing decision saved!' }
}

export async function deletePricingDecision(id: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { error } = await supabase
        .from('pricing_decisions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error deleting pricing decision:', error)
        return { error: error.message }
    }

    revalidatePath('/pricing')
    return { success: 'Pricing decision deleted!' }
}
