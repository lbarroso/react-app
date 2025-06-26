// Script para probar migración IndexedDB v6 desde consola del navegador
// Copiar y pegar en DevTools → Console

console.log('🚀 Iniciando prueba de migración IndexedDB v6...');

// Función para obtener información de la base de datos
async function testIndexedDBv6() {
  try {
    // Abrir conexión a la base de datos
    const request = indexedDB.open('PedidosDB');
    
    return new Promise((resolve, reject) => {
      request.onsuccess = function(event) {
        const db = event.target.result;
        
        console.log('📊 Database Info:');
        console.log('- Name:', db.name);
        console.log('- Version:', db.version);
        console.log('- Object Stores:', Array.from(db.objectStoreNames));
        
        // Verificar versión
        if (db.version === 6) {
          console.log('✅ Database version is correct: v6');
        } else {
          console.log('❌ Expected version 6, got:', db.version);
        }
        
        // Verificar stores esperados
        const expectedStores = [
          'productos',
          'carrito_items',
          'session_store',
          'clientes',
          'pedidos',
          'pedidos_items'
        ];
        
        console.log('\n🔍 Checking stores:');
        expectedStores.forEach(store => {
          if (db.objectStoreNames.contains(store)) {
            console.log(`✅ Store exists: ${store}`);
          } else {
            console.log(`❌ Missing store: ${store}`);
          }
        });
        
        // Verificar estructura de stores nuevos
        if (db.objectStoreNames.contains('pedidos')) {
          const tx1 = db.transaction('pedidos', 'readonly');
          const pedidosStore = tx1.objectStore('pedidos');
          
          console.log('\n📦 Pedidos store:');
          console.log('- keyPath:', pedidosStore.keyPath);
          console.log('- autoIncrement:', pedidosStore.autoIncrement);
          console.log('- indexNames:', Array.from(pedidosStore.indexNames));
        }
        
        if (db.objectStoreNames.contains('pedidos_items')) {
          const tx2 = db.transaction('pedidos_items', 'readonly');
          const itemsStore = tx2.objectStore('pedidos_items');
          
          console.log('\n📦 Pedidos_items store:');
          console.log('- keyPath:', itemsStore.keyPath);
          console.log('- autoIncrement:', itemsStore.autoIncrement);
          console.log('- indexNames:', Array.from(itemsStore.indexNames));
        }
        
        db.close();
        console.log('\n🎉 Migration test completed!');
        resolve({
          success: true,
          version: db.version,
          stores: Array.from(db.objectStoreNames)
        });
      };
      
      request.onerror = function(event) {
        console.error('❌ Error opening database:', event.target.error);
        reject(event.target.error);
      };
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

// Ejecutar el test
testIndexedDBv6().then(result => {
  console.log('\n📋 Test Result:', result);
}).catch(error => {
  console.error('❌ Test Error:', error);
});

// Función adicional para inspeccionar manualmente
window.inspectPedidosDB = function() {
  const request = indexedDB.open('PedidosDB');
  request.onsuccess = function(event) {
    const db = event.target.result;
    console.log('🔍 Manual inspection:');
    console.log('Database:', db);
    console.log('Stores:', Array.from(db.objectStoreNames));
    
    // Hacer disponible globalmente para inspección
    window.pedidosDB = db;
    console.log('💡 Database available as window.pedidosDB');
  };
};

console.log('💡 Función adicional disponible: inspectPedidosDB()'); 