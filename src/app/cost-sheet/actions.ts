'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface CostSheet {
    id: string
    user_id: string
    product_id: string
    sheet_number: string
    date: string
    quantity_produced: number
    cost_unit: 'per_unit' | 'per_batch'

    // Direct Materials
    material_cost: number

    // Direct Labor
    labor_cost: number
    labor_hours: number
    labor_rate: number

    // Manufacturing Overhead
    overhead_cost: number

    // Other Costs
    other_costs: number

    // Calculated
    total_cost: number
    cost_per_unit: number

    notes: string | null
    created_at: string
    updated_at: string

    // Joined data
    product?: {
        id: string
        name: string
        unit: string
        type: string
    }
}

export async function getCostSheets(): Promise<CostSheet[]> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

    const { data, error } = await supabase
        .from('cost_sheets')
        .select(`
            *,
            product:products(id, name, unit, type)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching cost sheets:', error)
        return []
    }

    return data || []
}

export async function getCostSheet(id: string): Promise<CostSheet | null> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    const { data, error } = await supabase
        .from('cost_sheets')
        .select(`
            *,
            product:products(id, name, unit, type)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (error) {
        console.error('Error fetching cost sheet:', error)
        return null
    }

    return data
}

export async function getNextSheetNumber(): Promise<string> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return 'CS-001'
    }

    const { count } = await supabase
        .from('cost_sheets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

    const nextNumber = (count || 0) + 1
    return `CS-${nextNumber.toString().padStart(3, '0')}`
}

export async function createCostSheet(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const materialCost = parseFloat(formData.get('material_cost') as string) || 0
    const laborHours = parseFloat(formData.get('labor_hours') as string) || 0
    const laborRate = parseFloat(formData.get('labor_rate') as string) || 0
    const laborCost = laborHours * laborRate
    const overheadCost = parseFloat(formData.get('overhead_cost') as string) || 0
    const otherCosts = parseFloat(formData.get('other_costs') as string) || 0
    const quantityProduced = parseInt(formData.get('quantity_produced') as string) || 1

    const totalCost = materialCost + laborCost + overheadCost + otherCosts
    const costPerUnit = quantityProduced > 0 ? totalCost / quantityProduced : totalCost

    const costSheet = {
        user_id: user.id,
        product_id: formData.get('product_id') as string,
        sheet_number: formData.get('sheet_number') as string,
        date: formData.get('date') as string,
        quantity_produced: quantityProduced,
        cost_unit: formData.get('cost_unit') as 'per_unit' | 'per_batch',
        material_cost: materialCost,
        labor_cost: laborCost,
        labor_hours: laborHours,
        labor_rate: laborRate,
        overhead_cost: overheadCost,
        other_costs: otherCosts,
        total_cost: totalCost,
        cost_per_unit: costPerUnit,
        notes: formData.get('notes') as string || null,
    }

    if (!costSheet.product_id) {
        return { error: 'Please select a product' }
    }

    const { error } = await supabase
        .from('cost_sheets')
        .insert(costSheet)

    if (error) {
        console.error('Error creating cost sheet:', error)
        return { error: error.message }
    }

    revalidatePath('/cost-sheet')
    return { success: 'Cost sheet created successfully!' }
}

export async function updateCostSheet(id: string, formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const materialCost = parseFloat(formData.get('material_cost') as string) || 0
    const laborHours = parseFloat(formData.get('labor_hours') as string) || 0
    const laborRate = parseFloat(formData.get('labor_rate') as string) || 0
    const laborCost = laborHours * laborRate
    const overheadCost = parseFloat(formData.get('overhead_cost') as string) || 0
    const otherCosts = parseFloat(formData.get('other_costs') as string) || 0
    const quantityProduced = parseInt(formData.get('quantity_produced') as string) || 1

    const totalCost = materialCost + laborCost + overheadCost + otherCosts
    const costPerUnit = quantityProduced > 0 ? totalCost / quantityProduced : totalCost

    const costSheet = {
        product_id: formData.get('product_id') as string,
        date: formData.get('date') as string,
        quantity_produced: quantityProduced,
        cost_unit: formData.get('cost_unit') as 'per_unit' | 'per_batch',
        material_cost: materialCost,
        labor_cost: laborCost,
        labor_hours: laborHours,
        labor_rate: laborRate,
        overhead_cost: overheadCost,
        other_costs: otherCosts,
        total_cost: totalCost,
        cost_per_unit: costPerUnit,
        notes: formData.get('notes') as string || null,
        updated_at: new Date().toISOString()
    }

    const { error } = await supabase
        .from('cost_sheets')
        .update(costSheet)
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error updating cost sheet:', error)
        return { error: error.message }
    }

    revalidatePath('/cost-sheet')
    return { success: 'Cost sheet updated successfully!' }
}

export async function deleteCostSheet(id: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { error } = await supabase
        .from('cost_sheets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error deleting cost sheet:', error)
        return { error: error.message }
    }

    revalidatePath('/cost-sheet')
    return { success: 'Cost sheet deleted successfully!' }
}
