import React from 'react'
import { pdf } from '@react-pdf/renderer'
import { saveAs } from 'file-saver'
import { supabase } from '../supabaseClient'
import { CatalogDocument } from '../components/pdf/Templates'

// Función para obtener datos del usuario logueado
const fetchUserData = async () => {
  console.log('🔍 Obteniendo sesión de Supabase...')
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.error('❌ Error en sesión:', sessionError)
    throw new Error('Error al obtener sesión activa')
  }
  
  if (!session) {
    console.error('❌ No hay sesión activa')
    throw new Error('No hay sesión activa')
  }

  console.log('✅ Sesión obtenida, user.id:', session.user.id)

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('name, almcnt, user_id')
    .eq('user_id', session.user.id)
    .single()

  if (userError) {
    console.error('❌ Error al obtener datos del usuario:', userError)
    throw new Error(`Error al obtener datos del usuario: ${userError.message}`)
  }

  if (!userData) {
    console.error('❌ No se encontraron datos del usuario')
    throw new Error('No se encontraron datos del usuario en la tabla users')
  }

  console.log('✅ Datos del usuario obtenidos:', userData)
  return userData
}

// Función para obtener datos de productos y categorías
const fetchCatalogData = async (almcnt) => {
  console.log('🔍 Obteniendo productos para almacén:', almcnt)
  
  // Consulta exacta como solicitada: select code, name, price, image, unit, stock from products where almcnt=(local storage) and stock > 0
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('code, name, price, image, unit, stock, category_id')
    .eq('almcnt', almcnt)
    .gt('stock', 0)
    .order('category_id', { ascending: true })
    .order('name', { ascending: true })

  if (productsError) {
    throw new Error(`Error al obtener productos: ${productsError.message}`)
  }

  console.log(`✅ Obtenidos ${products.length} productos con stock > 0`)

  // Obtener IDs únicos de categorías que tienen productos
  const uniqueCategoryIds = [...new Set(products.map(p => p.category_id))]
  console.log('🏷️ IDs de categorías encontradas:', uniqueCategoryIds)

  // Obtener información de las categorías
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name')
    .in('id', uniqueCategoryIds)
    .order('name', { ascending: true })

  if (categoriesError) {
    throw new Error(`Error al obtener categorías: ${categoriesError.message}`)
  }

  console.log(`✅ Obtenidas ${categories.length} categorías`)

  return { products, categories }
}

// Función para agrupar productos por categoría
const groupProductsByCategory = (products, categories) => {
  const categoryMap = categories.reduce((map, category) => {
    map[category.id] = {
      ...category,
      products: []
    }
    return map
  }, {})
  
  // Agrupar productos por categoría
  products.forEach(product => {
    if (categoryMap[product.category_id]) {
      categoryMap[product.category_id].products.push(product)
    }
  })
  
  // Filtrar categorías que tienen productos
  return Object.values(categoryMap).filter(category => category.products.length > 0)
}

// Función principal para generar el catálogo
export const generateCatalog = async ({ includePrices = true }) => {
  try {
    console.log('🚀 Iniciando generación de catálogo...')
    
    // Obtener datos del usuario logueado (nombre y almacén)
    const userData = await fetchUserData()
    const { name: userName, almcnt } = userData
    
    console.log(`👤 Usuario: ${userName}, 🏪 Almacén: ${almcnt}`)
    
    // Obtener datos de productos y categorías
    const { products, categories } = await fetchCatalogData(almcnt)
    
    if (products.length === 0) {
      throw new Error('No se encontraron productos con stock para generar el catálogo')
    }
    
    // Agrupar productos por categoría
    const categorizedProducts = groupProductsByCategory(products, categories)
    
    console.log(`📊 Generando catálogo con ${products.length} productos en ${categorizedProducts.length} categorías`)
    console.log('🖼️ Imágenes SIN compresión - usando tamaño original desde /imagenes/')
    
    // Generar PDF
    const pdfBlob = await pdf(
      React.createElement(CatalogDocument, {
        categories: categorizedProducts,
        includePrices: includePrices,
        userName: userName,
        almcnt: almcnt
      })
    ).toBlob()
    
    // Descargar PDF
    const fileName = `catalogo_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${includePrices ? 'con_precios' : 'sin_precios'}.pdf`
    saveAs(pdfBlob, fileName)
    
    console.log('✅ Catálogo generado exitosamente:', fileName)
    
  } catch (error) {
    console.error('❌ Error generando catálogo:', error)
    throw error
  }
} 