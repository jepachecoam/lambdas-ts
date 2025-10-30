class Prompts {
  static buildImageAnalysisPrompt = (): string => `
  Analiza esta imagen de producto en detalle. Describe lo que ves y verifica si contiene contenido prohibido.

  CATEGORÍAS PROHIBIDAS:
  1. Alcohol y tabaco (licores, vino, cerveza, cigarrillos, vaporizadores)
  2. Drogas y parafernalia (sustancias ilegales, accesorios para drogas)
  3. Armas y municiones (armas de fuego, cuchillos excepto de cocina, explosivos) - LOS JUGUETES ESTÁN PERMITIDOS
  4. Materiales peligrosos (inflamables, tóxicos, químicos industriales)
  5. Animales y productos animales (animales vivos/muertos, órganos)
  6. Contenido para adultos (juguetes sexuales, contenido explícito) - los suplementos sexuales están permitidos
  7. Servicios financieros
  8. Productos médicos/farmacéuticos (medicinas, no suplementos)
  9. Contenido que promueva violencia/discriminación
  10. Armas (cuchillos excepto de cocina, granadas) - LOS JUGUETES ESTÁN PERMITIDOS

  TAREAS:
  1. Proporciona una descripción detallada del producto en la imagen
  2. Verifica si pertenece a categorías prohibidas (distingue juguetes de artículos reales)
  3. EXTRACCIÓN DE PESO: Busca cuidadosamente cualquier información de peso en etiquetas, empaque o texto en la imagen. Extrae números con unidades como:
    - kg, g, gramos, kilogramos
    - lb, lbs, pounds, libras
    - oz, ounces, onzas
    Convierte todo a kg (1 lb = 0.453592 kg, 1 oz = 0.0283495 kg). Si NO hay peso visible en ningún lugar de la imagen, usa 0.
  4. DETECCIÓN DE DIMENSIONES: Busca medidas espaciales que indiquen productos de tamaño MEDIANO o GRANDE:
    - Solo activa hasDimensions si las dimensiones son ≥25cm (o equivalente: ≥10 pulgadas, ≥0.25m)
    - Ejemplos que SÍ activan: 90cm, 1.5m, 30 pulgadas, 50x40cm
    - Ejemplos que NO activan: 5cm, 44mm, 2 pulgadas, 15cm
    - IGNORA códigos de modelo como "OE248", "XL-500"
    Establece hasDimensions como true SOLO si hay dimensiones ≥25cm que indiquen producto mediano/grande.

  Usa la herramienta para proporcionar respuesta estructurada segun el schema

  REQUISITOS:
  Tu output debe ser en español
`;

  static buildNameAnalysisPrompt = (
    imageDescription: string,
    productName: string
  ): string => `
  Analiza el nombre del producto y compáralo con la descripción de la imagen.

  DESCRIPCIÓN DE LA IMAGEN: "<<< ${imageDescription} >>>"
  NOMBRE DEL PRODUCTO: "<<< ${productName} >>>"

  CATEGORÍAS PROHIBIDAS:
  1. Alcohol y tabaco (licores, vino, cerveza, cigarrillos, vaporizadores)
  2. Drogas y parafernalia (sustancias ilegales, accesorios para drogas)
  3. Armas y municiones (armas de fuego, cuchillos excepto de cocina, explosivos) - LOS JUGUETES ESTÁN PERMITIDOS
  4. Materiales peligrosos (inflamables, tóxicos, químicos industriales)
  5. Animales y productos animales (animales vivos/muertos, órganos)
  6. Contenido para adultos (juguetes sexuales, contenido explícito) - los suplementos sexuales están permitidos
  7. Servicios financieros
  8. Productos médicos/farmacéuticos (medicinas, no suplementos)
  9. Contenido que promueva violencia/discriminación
  10. Armas (cuchillos excepto de cocina, granadas) - LOS JUGUETES ESTÁN PERMITIDOS

  TAREAS:
  - semanticRelevance: Califica la coincidencia semántica usando esta escala:
    * 0: Sin relación (imagen: "silla", nombre: "teléfono")
    * 25-35: Poca relación (imagen: "mueble", nombre: "accesorio hogar")
    * 55-65: Relación moderada (imagen: "silla de madera", nombre: "mueble")
    * 75-85: Buena relación (imagen: "silla cómoda", nombre: "silla ergonómica")
    * 90-100: Excelente relación (imagen: "silla de oficina negra", nombre: "silla oficina negra cómoda")
  - shouldBeRejected: Verifica si el nombre contiene contenido prohibido (distingue juguetes de artículos reales)
  - hasDimensions: Verifica si el nombre contiene dimensiones que indiquen producto MEDIANO/GRANDE (≥25cm o equivalente). Ejemplos SÍ: 90cm, 1.5m, 30 pulgadas. Ejemplos NO: 5cm, 44mm, 2 pulgadas. IGNORA códigos de modelo. Solo true para productos de tamaño considerable.
  - weight: Extrae el peso del nombre y conviértelo a kg (1 lb = 0.453592 kg, 1 oz = 0.0283495 kg). Usa 0 si no se encuentra peso

  Usa la herramienta para proporcionar respuesta estructurada segun el schema

  REQUISITOS:
  Tu output debe ser en español
`;

  static buildCategoryAnalysisPrompt = (
    imageDescription: string,
    productCategory: string
  ): string => `
  Analiza la categoría del producto y compárala con la descripción de la imagen.

  DESCRIPCIÓN DE LA IMAGEN: "<<< ${imageDescription} >>>"
  CATEGORÍA DEL PRODUCTO: "<<< ${productCategory} >>>"

  CATEGORÍAS DISPONIBLES (selecciona la más apropiada):
  - {idProdFormat: 3, prodFormatName: "Salud, belleza y cuidado personal"}
  - {idProdFormat: 4, prodFormatName: "Hogar, Muebles, Cocina"}
  - {idProdFormat: 5, prodFormatName: "Tecnología y electrodomesticos"}
  - {idProdFormat: 6, prodFormatName: "Moda, Ropa y Accesorios"}
  - {idProdFormat: 7, prodFormatName: "Relojes y Joyas"}
  - {idProdFormat: 8, prodFormatName: "Animales y Mascotas"}
  - {idProdFormat: 9, prodFormatName: "Bebes, juegos y juguetes"}
  - {idProdFormat: 10, prodFormatName: "Deportes y Fitness"}
  - {idProdFormat: 31, prodFormatName: "Vehículos"}
  - {idProdFormat: 32, prodFormatName: "Liberías y papeleria"}
  - {idProdFormat: 34, prodFormatName: "Herramientas"}
  - {idProdFormat: 35, prodFormatName: "Otros"}

  TAREAS:
  - semanticRelevance: Califica la coincidencia de categoría usando esta escala:
    * 0: Sin relación (imagen: "silla", categoría: "Tecnología")
    * 25-35: Poca relación (imagen: "silla", categoría: "Deportes")
    * 55-65: Relación moderada (imagen: "silla", categoría: "Otros")
    * 75-85: Buena relación (imagen: "silla de cocina", categoría: "Hogar, Muebles, Cocina")
    * 90-100: Excelente relación (imagen: "silla de oficina", categoría: "Hogar, Muebles, Cocina")
  - suggestedCategory: Selecciona la categoría más apropiada de la lista disponible. Si la categoría proporcionada es correcta según la imagen, sugiere la misma. Si es incorrecta, sugiere la correcta.

  Usa la herramienta para proporcionar respuesta estructurada segun el schema

  REQUISITOS:
  Tu output debe ser en español
`;

  static buildDescriptionAnalysisPrompt = (
    imageDescription: string,
    productDescription: string
  ): string => `
  Analiza la descripción del producto y compárala con la descripción de la imagen.

  DESCRIPCIÓN DE LA IMAGEN: "${imageDescription}"
  DESCRIPCIÓN DEL PRODUCTO: "${productDescription}"

  CATEGORÍAS PROHIBIDAS:
  1. Alcohol y tabaco (licores, vino, cerveza, cigarrillos, vaporizadores)
  2. Drogas y parafernalia (sustancias ilegales, accesorios para drogas)
  3. Armas y municiones (armas de fuego, cuchillos excepto de cocina, explosivos) - LOS JUGUETES ESTÁN PERMITIDOS
  4. Materiales peligrosos (inflamables, tóxicos, químicos industriales)
  5. Animales y productos animales (animales vivos/muertos, órganos)
  6. Contenido para adultos (juguetes sexuales, contenido explícito) - los suplementos sexuales están permitidos
  7. Servicios financieros
  8. Productos médicos/farmacéuticos (medicinas, no suplementos)
  9. Contenido que promueva violencia/discriminación
  10. Armas (cuchillos excepto de cocina, granadas) - LOS JUGUETES ESTÁN PERMITIDOS

  TAREAS:
  - semanticRelevance: Califica la coincidencia semántica usando esta escala:
    * 0: Sin relación (imagen: "silla", descripción: "dispositivo electrónico")
    * 25-35: Poca relación (imagen: "silla", descripción: "producto para el hogar")
    * 55-65: Relación moderada (imagen: "sofacama", descripción: "mueble resistente")
    * 75-85: Buena relación (imagen: "silla cómoda", descripción: "silla ergonómica para oficina")
    * 90-100: Excelente relación (imagen: "silla negra de oficina", descripción: "silla ejecutiva negra con respaldo alto y ruedas")
  - shouldBeRejected: Verifica si la descripción contiene contenido prohibido (distingue juguetes de artículos reales)
  - hasDimensions: Verifica si la descripción contiene dimensiones que indiquen producto MEDIANO/GRANDE (≥25cm o equivalente). Ejemplos SÍ: 90cm, 1.5m, 30 pulgadas. Ejemplos NO: 5cm, 44mm, 2 pulgadas. IGNORA códigos de modelo. Solo true para productos de tamaño considerable.
  - weight: Extrae el peso de la descripción y conviértelo a kg (1 lb = 0.453592 kg, 1 oz = 0.0283495 kg). Usa 0 si no se encuentra peso

  Usa la herramienta para proporcionar respuesta estructurada segun el schema

  REQUISITOS:
  Tu output debe ser en español
`;
}

export default Prompts;
