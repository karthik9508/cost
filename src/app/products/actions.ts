'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface Product {
    id: string
    user_id: string
    name: string
    type: 'product' | 'service'
    unit: string
    expected_monthly_quantity: number | null
    description: string | null
    created_at: string
    updated_at: string
}

export async function getProducts(): Promise<Product[]> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching products:', error)
        return []
    }

    return data || []
}

export async function createProduct(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const product = {
        user_id: user.id,
        name: formData.get('name') as string,
        type: formData.get('type') as 'product' | 'service',
        unit: formData.get('unit') as string,
        expected_monthly_quantity: formData.get('expected_monthly_quantity')
            ? parseInt(formData.get('expected_monthly_quantity') as string)
            : null,
        description: formData.get('description') as string || null,
    }

    if (!product.name || !product.unit) {
        return { error: 'Name and unit are required' }
    }

    const { error } = await supabase
        .from('products')
        .insert(product)

    if (error) {
        console.error('Error creating product:', error)
        return { error: error.message }
    }

    revalidatePath('/products')
    return { success: 'Product created successfully!' }
}

export async function updateProduct(id: string, formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const product = {
        name: formData.get('name') as string,
        type: formData.get('type') as 'product' | 'service',
        unit: formData.get('unit') as string,
        expected_monthly_quantity: formData.get('expected_monthly_quantity')
            ? parseInt(formData.get('expected_monthly_quantity') as string)
            : null,
        description: formData.get('description') as string || null,
        updated_at: new Date().toISOString()
    }

    if (!product.name || !product.unit) {
        return { error: 'Name and unit are required' }
    }

    const { error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error updating product:', error)
        return { error: error.message }
    }

    revalidatePath('/products')
    return { success: 'Product updated successfully!' }
}

export async function deleteProduct(id: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error deleting product:', error)
        return { error: error.message }
    }

    revalidatePath('/products')
    return { success: 'Product deleted successfully!' }
}
