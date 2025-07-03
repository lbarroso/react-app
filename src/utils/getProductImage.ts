// utils/getProductImage.ts
export function getProductImageSrc(imageName: string | undefined) {
    // Debug: ver qué valor recibimos
    console.log('getProductImageSrc - input:', imageName, 'type:', typeof imageName);
    
    // Si no hay imagen o es undefined/null/empty
    if (!imageName || imageName.trim() === '') {
        console.log('No hay imagen, usando placeholder.png');
        return '/imagenes/placeholder.png';
    }
    
    // Limpiar el nombre de archivo: remover espacios, caracteres extraños
    const cleanImageName = String(imageName).trim();
    
    // Verificar que no tenga caracteres raros al final
    const finalImageName = cleanImageName.replace(/[^\w\-_.]/g, '');
    
    console.log('Imagen limpia:', finalImageName);
    
    // Si después de limpiar queda vacío, usar placeholder
    if (finalImageName === '') {
        console.log('Nombre limpio vacío, usando placeholder.png');
        return '/imagenes/placeholder.png';
    }
    
    const finalSrc = `/imagenes/${finalImageName}`;
    console.log('URL final generada:', finalSrc);
    
    return finalSrc;
}
  