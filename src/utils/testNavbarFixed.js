// Test para verificar que el navbar esté fijo correctamente
// Ejecutar en consola del navegador: testNavbarFixed()

window.testNavbarFixed = function() {
  console.log('🔍 Verificando navbar fijo...');
  
  const navbar = document.querySelector('.navbar');
  if (!navbar) {
    console.error('❌ No se encontró el navbar');
    return;
  }
  
  const styles = window.getComputedStyle(navbar);
  const position = styles.position;
  const top = styles.top;
  const zIndex = styles.zIndex;
  
  console.log('📊 Propiedades del navbar:');
  console.log(`   Position: ${position}`);
  console.log(`   Top: ${top}`);
  console.log(`   Z-index: ${zIndex}`);
  console.log(`   Width: ${styles.width}`);
  
  // Verificaciones
  const checks = {
    'Position es fixed': position === 'fixed',
    'Top es 0px': top === '0px',
    'Z-index es alto': parseInt(zIndex) >= 1000,
    'Width es 100%': styles.width === '100%' || navbar.offsetWidth === window.innerWidth
  };
  
  console.log('\n✅ Verificaciones:');
  Object.entries(checks).forEach(([test, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${test}`);
  });
  
  // Test de scroll
  const originalScrollY = window.scrollY;
  console.log('\n🔄 Probando comportamiento con scroll...');
  
  window.scrollTo(0, 100);
  setTimeout(() => {
    const navbarRect = navbar.getBoundingClientRect();
    const isStillAtTop = navbarRect.top <= 5; // Margen de error de 5px
    
    console.log(`   Navbar sigue en la parte superior: ${isStillAtTop ? '✅' : '❌'}`);
    console.log(`   Posición actual: ${navbarRect.top}px desde arriba`);
    
    // Restaurar scroll original
    window.scrollTo(0, originalScrollY);
    
    // Resultado final
    const allPassed = Object.values(checks).every(Boolean) && isStillAtTop;
    console.log(`\n🎯 Resultado: ${allPassed ? '✅ Navbar fijo funcionando correctamente' : '❌ Hay problemas con el navbar'}`);
    
  }, 100);
};

console.log('🛠️ Test del navbar cargado. Ejecuta testNavbarFixed() para probar.'); 