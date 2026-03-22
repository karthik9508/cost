'use server'

import { createClient } from '@/lib/supabase/server'

export interface Material {
    id: string
    user_id: string
    cost_sheet_id: string
    name: string
    part_number: string | null
    category: string
    unit: string
    quantity: number
    rate: number
    amount: number
    created_at: string
}

export interface MaterialInput {
    name: string
    part_number: string
    category: string
    unit: string
    quantity: number
    rate: number
    amount: number
}

export interface ScrapItem {
    id: string
    user_id: string
    cost_sheet_id: string
    description: string
    unit: string
    quantity: number
    rate: number
    amount: number
    created_at: string
}

export interface ScrapInput {
    description: string
    unit: string
    quantity: number
    rate: number
    amount: number
}

export async function getMaterials(costSheetId: string): Promise<Material[]> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

    const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('cost_sheet_id', costSheetId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching materials:', error)
        return []
    }

    return data || []
}

export async function saveMaterials(
    costSheetId: string,
    materials: MaterialInput[]
): Promise<{ error?: string; success?: string }> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Delete existing materials for this cost sheet
    const { error: deleteError } = await supabase
        .from('materials')
        .delete()
        .eq('cost_sheet_id', costSheetId)
        .eq('user_id', user.id)

    if (deleteError) {
        console.error('Error deleting old materials:', deleteError)
        return { error: deleteError.message }
    }

    // Insert new materials (skip empty rows)
    const validMaterials = materials.filter(m => m.name.trim() !== '')
    if (validMaterials.length === 0) {
        return { success: 'Materials saved' }
    }

    const rows = validMaterials.map(m => ({
        user_id: user.id,
        cost_sheet_id: costSheetId,
        name: m.name,
        part_number: m.part_number || null,
        category: m.category || 'raw_material',
        unit: m.unit,
        quantity: m.quantity,
        rate: m.rate,
        amount: m.quantity * m.rate,
    }))

    const { error: insertError } = await supabase
        .from('materials')
        .insert(rows)

    if (insertError) {
        console.error('Error inserting materials:', insertError)
        return { error: insertError.message }
    }

    return { success: 'Materials saved' }
}

// ═══════════════════════════════════════════
// Scrap Items
// ═══════════════════════════════════════════

export async function getScrapItems(costSheetId: string): Promise<ScrapItem[]> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

    const { data, error } = await supabase
        .from('scrap_items')
        .select('*')
        .eq('cost_sheet_id', costSheetId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching scrap items:', error)
        return []
    }

    return data || []
}

export async function saveScrapItems(
    costSheetId: string,
    scrapItems: ScrapInput[]
): Promise<{ error?: string; success?: string }> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Delete existing scrap items for this cost sheet
    const { error: deleteError } = await supabase
        .from('scrap_items')
        .delete()
        .eq('cost_sheet_id', costSheetId)
        .eq('user_id', user.id)

    if (deleteError) {
        console.error('Error deleting old scrap items:', deleteError)
        return { error: deleteError.message }
    }

    // Insert new scrap items (skip empty rows)
    const validItems = scrapItems.filter(s => s.description.trim() !== '')
    if (validItems.length === 0) {
        return { success: 'Scrap items saved' }
    }

    const rows = validItems.map(s => ({
        user_id: user.id,
        cost_sheet_id: costSheetId,
        description: s.description,
        unit: s.unit,
        quantity: s.quantity,
        rate: s.rate,
        amount: s.quantity * s.rate,
    }))

    const { error: insertError } = await supabase
        .from('scrap_items')
        .insert(rows)

    if (insertError) {
        console.error('Error inserting scrap items:', insertError)
        return { error: insertError.message }
    }

    return { success: 'Scrap items saved' }
}
