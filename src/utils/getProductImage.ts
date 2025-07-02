// utils/getProductImage.ts
export function getProductImageSrc(imageName: string | undefined) {
    return imageName
      ? `/imagenes/${imageName}`      // uso directo del nombre+extensión
      : '/imagenes/placeholder.png';  // fallback local
  }
  