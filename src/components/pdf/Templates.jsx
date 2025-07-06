import React from 'react'
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Image
} from '@react-pdf/renderer'

// Estilos PDF con diseño tipo tabla
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 15,
    fontFamily: 'Helvetica'
  },
  
  // Portada
  coverPage: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%'
  },
  coverLogo: {
    width: 100,
    height: 100,
    marginBottom: 15
  },
  coverTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center'
  },
  coverSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 20,
    textAlign: 'center'
  },
  coverInfo: {
    fontSize: 11,
    color: '#34495e',
    textAlign: 'center',
    marginBottom: 5
  },
  
  // Índice
  indexTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center'
  },
  indexContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  indexColumn: {
    width: '48%'
  },
  indexItem: {
    fontSize: 9,
    color: '#2c3e50',
    marginBottom: 2,
    padding: 3,
    backgroundColor: '#ecf0f1'
  },
  
  // Encabezado de tabla
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#34495e',
    padding: 8,
    marginBottom: 5
  },
  headerText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 10
  },
  headerImage: {
    width: '15%',
    textAlign: 'center'
  },
  headerInfo: {
    width: '50%',
    textAlign: 'left'
  },
  headerStock: {
    width: '15%',
    textAlign: 'center'
  },
  headerPrice: {
    width: '20%',
    textAlign: 'center'
  },
  
  // Fila de producto
  productRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    paddingVertical: 8,
    paddingHorizontal: 5,
    alignItems: 'center'
  },
  
  // Celda de imagen
  imageCell: {
    width: '15%',
    alignItems: 'center'
  },
  productImage: {
    width: 60,
    height: 60
  },
  
  // Celda de información
  infoCell: {
    width: '50%',
    paddingLeft: 10,
    paddingRight: 10
  },
  productName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2
  },
  productCode: {
    fontSize: 8,
    color: '#7f8c8d',
    marginBottom: 1
  },
  productUnit: {
    fontSize: 8,
    color: '#7f8c8d'
  },
  
  // Celda de stock
  stockCell: {
    width: '15%',
    alignItems: 'center'
  },
  productStock: {
    fontSize: 10,
    color: '#27ae60',
    fontWeight: 'bold'
  },
  
  // Celda de precio
  priceCell: {
    width: '20%',
    alignItems: 'center'
  },
  productPrice: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#e74c3c',
    backgroundColor: '#f8f9fa',
    padding: 4,
    borderRadius: 3
  }
})

// Componente de portada
const CoverPage = ({ userName, almcnt }) => {
  const currentDate = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
  
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.coverPage}>
        <Image
          style={styles.coverLogo}
          src="/logo.svg"
        />
        <Text style={styles.coverTitle}>
          Catálogo de Productos
        </Text>
        <Text style={styles.coverSubtitle}>
          {userName}
        </Text>
        <Text style={styles.coverInfo}>
          Almacén: {almcnt}
        </Text>
        <Text style={styles.coverInfo}>
          Fecha: {currentDate}
        </Text>
      </View>
    </Page>
  )
}

// Componente de índice
const IndexPage = ({ categories }) => {
  // Dividir categorías en dos columnas
  const midPoint = Math.ceil(categories.length / 2)
  const leftColumn = categories.slice(0, midPoint)
  const rightColumn = categories.slice(midPoint)

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.indexTitle}>Índice de Categorías</Text>
      
      <View style={styles.indexContainer}>
        <View style={styles.indexColumn}>
          {leftColumn.map((category, index) => (
            <Text key={category.id} style={styles.indexItem}>
              {category.name} ({category.products.length} productos)
            </Text>
          ))}
        </View>
        
        <View style={styles.indexColumn}>
          {rightColumn.map((category, index) => (
            <Text key={category.id} style={styles.indexItem}>
              {category.name} ({category.products.length} productos)
            </Text>
          ))}
        </View>
      </View>
    </Page>
  )
}

// Componente de página de productos con tabla
const ProductsPage = ({ products, includePrices, categoryName }) => {
  return (
    <Page size="A4" style={styles.page}>
      {/* Título de categoría */}
      <Text style={styles.indexTitle}>{categoryName}</Text>
      
      {/* Encabezado de tabla */}
      <View style={styles.tableHeader}>
        <View style={styles.headerImage}>
          <Text style={styles.headerText}>Imagen</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerText}>Información del Producto</Text>
        </View>
        <View style={styles.headerStock}>
          <Text style={styles.headerText}>Stock</Text>
        </View>
        {includePrices && (
          <View style={styles.headerPrice}>
            <Text style={styles.headerText}>Precio</Text>
          </View>
        )}
      </View>
      
      {/* Filas de productos */}
      {products.map((product) => (
        <View key={product.code} style={styles.productRow}>
          {/* Celda de imagen */}
          <View style={styles.imageCell}>
            <Image
              style={styles.productImage}
              src={product.image ? `/imagenes/${product.image}` : '/imagenes/placeholder.png'}
            />
          </View>
          
          {/* Celda de información */}
          <View style={styles.infoCell}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productCode}>Código: {product.code}</Text>
            <Text style={styles.productUnit}>Presentación: {product.unit}</Text>
          </View>
          
          {/* Celda de stock */}
          <View style={styles.stockCell}>
            <Text style={styles.productStock}>{product.stock}</Text>
          </View>
          
          {/* Celda de precio (si se incluye) */}
          {includePrices && (
            <View style={styles.priceCell}>
              <Text style={styles.productPrice}>
                ${product.price ? product.price.toFixed(2) : '0.00'}
              </Text>
            </View>
          )}
        </View>
      ))}
    </Page>
  )
}

// Función para dividir productos en páginas (15 productos por página en tabla)
const paginateProducts = (products, productsPerPage = 15) => {
  const pages = []
  for (let i = 0; i < products.length; i += productsPerPage) {
    pages.push(products.slice(i, i + productsPerPage))
  }
  return pages
}

// Documento principal
export const CatalogDocument = ({ categories, includePrices, userName, almcnt }) => (
  <Document>
    {/* Portada */}
    <CoverPage userName={userName} almcnt={almcnt} />
    
    {/* Índice */}
    <IndexPage categories={categories} />
    
    {/* Páginas de productos por categoría */}
    {categories.map((category) => {
      const productPages = paginateProducts(category.products, 15)
      
      return productPages.map((products, pageIndex) => (
        <ProductsPage
          key={`${category.id}-${pageIndex}`}
          products={products}
          includePrices={includePrices}
          categoryName={category.name}
        />
      ))
    })}
  </Document>
) 