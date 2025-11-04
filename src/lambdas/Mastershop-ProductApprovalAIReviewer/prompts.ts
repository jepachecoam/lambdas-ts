class Prompts {
  static buildImageAnalysisPrompt = (): string => `
  Analiza esta imagen de producto en detalle. Describe lo que ves y verifica si contiene contenido prohibido.

  ═══════════════════════════════════════════════════════════════════════════════
  SECCIÓN 1: VALIDACIÓN INICIAL DE LA IMAGEN
  ═══════════════════════════════════════════════════════════════════════════════

  ANTES DE ANALIZAR, verifica si la imagen es válida para análisis de producto:

  MARCA COMO isBlacklisted = true SI LA IMAGEN:
  - si la imagen representa algo intangile, como un dibujo, software, servicio, concepto abstracto. Es obligatorio que sea producto fisico.
  - Si hay dos o mas productos no relacionados y no se puede identificar un producto principal claro
  - Es completamente negra, blanca o de un solo color sin contenido identificable
  - Muestra únicamente cielo, nubes, paisajes o fondos sin producto visible
  - Es borrosa, desenfoca el producto o de tan baja calidad que no se puede identificar nada
  - Muestra únicamente texto sin producto visible
  - Muestra únicamente partes de un producto sin poder identificar qué es
  - Contiene elementos abstractos o no relacionados con productos comerciales

  REGLA CRÍTICA: Si NO puedes identificar claramente QUÉ PRODUCTO es, entonces isBlacklisted = true

  ═══════════════════════════════════════════════════════════════════════════════
  SECCIÓN 2: CATEGORÍAS PROHIBIDAS Y CRITERIOS DE DISTINCIÓN
  ═══════════════════════════════════════════════════════════════════════════════

  Si la imagen SÍ contiene un producto identificable, verifica las siguientes categorías:

  1. ALCOHOL Y TABACO
     PROHIBIDO: Licores, vino, cerveza, cigarrillos, vaporizadores, cigarros, tabaco
     Identifica por: Botellas con etiquetas de alcohol, cajas de cigarrillos, dispositivos de vapeo

  2. DROGAS Y PARAFERNALIA
     PROHIBIDO: Sustancias ilegales, pipas para drogas, accesorios para consumo de drogas
     Identifica por: Parafernalia reconocible, pipas de vidrio, accesorios de consumo

  3. ARMAS Y MUNICIONES
     PROHIBIDO: Armas de fuego, municiones, explosivos, cuchillos que NO sean de cocina, navajas, espadas reales, granadas
     PERMITIDO: Cuchillos de cocina, juguetes de armas
     
     CRITERIOS PARA DISTINGUIR CUCHILLOS DE COCINA (PERMITIDOS) vs ARMAS BLANCAS (PROHIBIDAS):
     - Cuchillos de cocina PERMITIDOS: Presentados en contexto culinario, con mango ergonómico de cocina, 
       hoja de acero inoxidable típica de cocina, empaque que indica uso culinario, set de cuchillos de chef,
       cuchillos para pan, cuchillos de carnicero, cuchillos santoku, cuchillos peladores
     - Armas blancas PROHIBIDAS: Cuchillos tácticos, navajas automáticas, cuchillos de combate, 
       cuchillos con diseño militar, machetes (excepto herramientas agrícolas claras), 
       dagas, puñales, cuchillos con nudilleras, cuchillos de supervivencia tipo militar, manoplas.
     
     CRITERIOS PARA DISTINGUIR JUGUETES (PERMITIDOS) vs ARMAS REALES (PROHIBIDAS):
     - Juguetes PERMITIDOS: Colores brillantes no realistas (naranja, verde neón, azul brillante),
       materiales claramente plásticos, tamaño reducido o desproporcionado, empaque infantil,
       marcas de juguetes visibles, punta naranja característica de juguetes
     - Armas reales PROHIBIDAS: Colores realistas (negro, gris metálico, camuflaje), 
       materiales metálicos, proporciones reales, acabados profesionales

  4. MATERIALES PELIGROSOS
     PROHIBIDO: Sustancias inflamables, tóxicos, químicos industriales peligrosos, ácidos, venenos
     PERMITIDO: Productos de limpieza domésticos normales, herramientas del hogar
     Identifica por: Símbolos de peligro, etiquetas de advertencia química, contenedores industriales

  5. ANIMALES Y PRODUCTOS ANIMALES
     PROHIBIDO: Animales vivos, animales muertos, órganos animales, pieles sin procesar
     PERMITIDO: Productos para mascotas (alimento, juguetes, accesorios), productos de cuero procesado
     Identifica por: Presencia de animales reales, partes anatómicas visibles

  6. CONTENIDO PARA ADULTOS
     PROHIBIDO: Juguetes sexuales, contenido explícito, productos eróticos
     PERMITIDO: Suplementos sexuales (pastillas, cápsulas, polvos nutricionales)
     
     CRITERIOS PARA DISTINGUIR:
     - Suplementos PERMITIDOS: Frascos de pastillas, cápsulas, polvos, presentación farmacéutica,
       etiquetas nutricionales, formato de suplemento dietético
     - Productos adultos PROHIBIDOS: Dispositivos, juguetes, accesorios íntimos, lencería explícita

  7. SERVICIOS FINANCIEROS
     PROHIBIDO: Tarjetas de crédito/débito, servicios bancarios, seguros, inversiones
     Identifica por: Tarjetas bancarias, documentos financieros, logos de bancos

  8. PRODUCTOS MÉDICOS/FARMACÉUTICOS
     PROHIBIDO: Medicamentos con receta, fármacos, inyecciones, dispositivos médicos regulados
     PERMITIDO: Suplementos nutricionales, vitaminas, productos de bienestar
     
     CRITERIOS PARA DISTINGUIR:
     - Suplementos PERMITIDOS: Etiquetas que dicen "suplemento", "vitamina", "complemento alimenticio",
       sin indicaciones médicas específicas, venta libre, formato nutricional
     - Medicamentos PROHIBIDOS: Etiquetas con "medicamento", "fármaco", indicaciones médicas específicas,
       "venta con receta", jeringas, ampollas inyectables, dispositivos médicos

  9. CONTENIDO QUE PROMUEVA VIOLENCIA/DISCRIMINACIÓN
     PROHIBIDO: Símbolos de odio, contenido que promueva violencia, discriminación racial/religiosa
     Identifica por: Símbolos reconocibles de odio, mensajes violentos o discriminatorios

  10. ELEMENTOS DEL HOGAR Y HERRAMIENTAS
      PERMITIDO: Todos los productos normales del hogar, muebles, decoración, herramientas de trabajo,
      utensilios de cocina, electrodomésticos, productos de limpieza domésticos

  ═══════════════════════════════════════════════════════════════════════════════
  SECCIÓN 3: TAREAS DE ANÁLISIS
  ═══════════════════════════════════════════════════════════════════════════════

  Realiza las siguientes tareas en orden:

  ───────────────────────────────────────────────────────────────────────────────
  TAREA 1: DESCRIPCIÓN DEL PRODUCTO (Campo: description)
  ───────────────────────────────────────────────────────────────────────────────

  Proporciona una descripción detallada del producto visible en la imagen.

  REGLAS PARA LA DESCRIPCIÓN:
  - Si hay MÚLTIPLES elementos en la imagen, describe ÚNICAMENTE el producto principal, por ejemplo si son varias fotos del mismo producto de diferente color o angulo, describe el producto en si
  - El producto principal es el objeto comercial más prominente, centrado o enfocado
  - IGNORA elementos de fondo como: parques, mesas, paredes, pisos, decoración ambiental
  - Si NO puedes identificar un producto claro marca isBlacklisted = true

  INCLUYE EN LA DESCRIPCIÓN:
  - Tipo de producto específico (ej: "silla de oficina", "botella de agua", "cuchillo de chef")
  - Características visuales principales: color, material aparente, forma
  - Marca visible (si aplica)
  - Estado aparente: nuevo, empacado, sin empacar
  - Contexto relevante que ayude a identificar el uso del producto

  EJEMPLOS:
  - Imagen: Pelota de fútbol en un parque → Descripción: "Pelota de fútbol de color blanco y negro, tamaño estándar"
  - Imagen: Cuchillo sobre una tabla de cocina → Descripción: "Cuchillo de chef de acero inoxidable con mango negro, hoja de aproximadamente 20cm"
  - Imagen: Botella en una mesa con flores → Descripción: "Botella de agua de plástico transparente con tapa azul, capacidad aproximada 500ml"

  ───────────────────────────────────────────────────────────────────────────────
  TAREA 2: VERIFICACIÓN DE CONTENIDO PROHIBIDO (Campo: isBlacklisted)
  ───────────────────────────────────────────────────────────────────────────────

  Determina si el producto debe ser rechazado (isBlacklisted = true o false).

  ASIGNA isBlacklisted = true SI:
  - La imagen NO contiene un producto claramente identificable (ver SECCIÓN 1)
  - El producto pertenece a alguna categoría PROHIBIDA (ver SECCIÓN 2)
  - Tienes dudas razonables sobre si el producto es permitido o prohibido
  - El producto podría interpretarse como prohibido sin contexto adicional claro

  ASIGNA isBlacklisted = false SI:
  - El producto es claramente identificable Y
  - NO pertenece a ninguna categoría prohibida Y
  - Es claramente un producto permitido (hogar, cocina, herramientas, juguetes legítimos, etc.)

  CASOS ESPECIALES:
  - Juguetes de armas: Verifica colores, materiales y empaque (ver criterios en SECCIÓN 2)
  - Cuchillos: Distingue claramente entre cuchillos de cocina (permitidos) y armas blancas (prohibidas)
  - Suplementos: Distingue entre suplementos nutricionales (permitidos) y medicamentos (prohibidos)

  ───────────────────────────────────────────────────────────────────────────────
  TAREA 3: EXTRACCIÓN DE PESO (Campo: weightKg)
  ───────────────────────────────────────────────────────────────────────────────

  Busca información de peso visible en la imagen: etiquetas, empaque, texto impreso.

  UNIDADES A BUSCAR:
  - Kilogramos: kg, kilogramos, kilos
  - Gramos: g, gr, gramos
  - Libras: lb, lbs, pounds, libras
  - Onzas: oz, ounces, onzas

  CONVERSIONES A APLICAR:
  - 1 kg = 1 kg (sin conversión)
  - 1 g = 0.001 kg
  - 1 lb = 0.453592 kg
  - 1 oz = 0.0283495 kg

  REGLAS:
  - Extrae el peso NETO del producto si está visible
  - Si hay múltiples pesos (neto, bruto, por unidad), prioriza el peso neto
  - Convierte SIEMPRE a kilogramos (kg)
  - Si NO hay peso visible en NINGÚN lugar de la imagen, asigna 0
  - IGNORA números que no estén asociados a unidades de peso

  EJEMPLOS:
  - "500g" → weightKg = 0.5
  - "2.5 kg" → weightKg = 2.5
  - "1 lb" → weightKg = 0.453592
  - "16 oz" → weightKg = 0.453592
  - Sin peso visible → weightKg = 0

  ───────────────────────────────────────────────────────────────────────────────
  TAREA 4: DETECCIÓN DE DIMENSIONES (Campo: hasDimensions)
  ───────────────────────────────────────────────────────────────────────────────

  Busca medidas espaciales visibles en la imagen que indiquen un producto de tamaño MEDIANO o GRANDE.

  UMBRAL DE ACTIVACIÓN: ≥25cm (o equivalente en otras unidades)

  UNIDADES A BUSCAR:
  - Centímetros: cm, centímetros
  - Metros: m, metros
  - Pulgadas: in, ", pulgadas, inches
  - Pies: ft, ', pies, feet

  EQUIVALENCIAS:
  - 25 cm = 0.25 m = 10 pulgadas = 0.83 pies

  ASIGNA hasDimensions = true SI:
  - Encuentras dimensiones ≥25cm en CUALQUIER medida (largo, ancho, alto, diámetro)
  - Ejemplos que SÍ activan: "90cm", "1.5m", "30 pulgadas", "50x40cm", "2 pies"

  ASIGNA hasDimensions = false SI:
  - Las dimensiones son <25cm en TODAS las medidas
  - Ejemplos que NO activan: "5cm", "44mm", "2 pulgadas", "15cm", "0.1m"
  - No hay dimensiones visibles

  CATEGORÍAS QUE AUTOMÁTICAMENTE REQUIEREN hasDimensions = true:
  Si identificas un producto dentro de estas categorías, marca hasDimensions = true independientemente de las dimensiones visibles:
  - Productos que indiquen múltiples unidades: pack, combo, paca, set (ej: "camisa x3", "pantalón x2", "pack de 5", "combo familiar", "set completo")
  - Productos de categoría Agro (Fumigadora, esparcidora de semillas, rollo de alambre, pico, pala, etc) que por su naturaleza son grandes
  - Productos de Ferretería, Herramientas
  - Productos de Mobiliarios de casa u oficina
  - Productos en Combo, Pack, Paca
  - Productos de Camping, Neveras, Camas
  - Productos de Gimnasio
  - Productos Electrodomésticos (Cabinas de sonido, computadores completos (escritorio), monitores de 24, etc)

  REGLAS IMPORTANTES:
  - IGNORA códigos de modelo que parezcan medidas: "OE248", "XL-500", "M-350"
  - IGNORA tallas de ropa: "XL", "L", "M", "S" (no son dimensiones espaciales)
  - Si hay múltiples dimensiones (ej: 30x10x5cm), considera la dimensión MAYOR

  EJEMPLOS:
  - "Dimensiones: 90 x 60 x 40 cm" → hasDimensions = true (90cm ≥ 25cm)
  - "Largo: 1.5 metros" → hasDimensions = true (1.5m = 150cm ≥ 25cm)
  - "Tamaño: 15cm" → hasDimensions = false (15cm < 25cm)
  - "Modelo: XL-500" → hasDimensions = false (código de modelo, no dimensión real)
  - Sin dimensiones pero visualmente es una silla grande → hasDimensions = true

  ═══════════════════════════════════════════════════════════════════════════════
  SECCIÓN 4: FORMATO DE RESPUESTA
  ═══════════════════════════════════════════════════════════════════════════════

  Usa la herramienta para proporcionar respuesta estructurada según el schema con los siguientes campos:

  - description: string (descripción detallada del producto o "Producto no identificable")
  - isBlacklisted: boolean (true si es prohibido o no identificable, false si es permitido)
  - weightKg: number (peso en kilogramos, 0 si no hay peso visible)
  - hasDimensions: boolean (true si tiene dimensiones ≥25cm, false en caso contrario)

  ═══════════════════════════════════════════════════════════════════════════════
  REQUISITOS FINALES
  ═══════════════════════════════════════════════════════════════════════════════

  - Tu output DEBE ser en español
  - Sé preciso y objetivo en tu análisis
  - En caso de duda sobre si un producto es prohibido, marca isBlacklisted = true (principio de precaución)
  - Prioriza la seguridad: es mejor rechazar un producto dudoso que aprobar uno prohibido
`;

  static buildNameAnalysisPrompt = (
    imageDescription: string,
    productName: string
  ): string => `
  ═══════════════════════════════════════════════════════════════════════════════
  ANÁLISIS DE NOMBRE DE PRODUCTO
  ═══════════════════════════════════════════════════════════════════════════════

  Analiza el nombre del producto y compáralo con la descripción de la imagen para determinar coherencia semántica y validar que se trate de un producto físico permitido.

  DESCRIPCIÓN DE LA IMAGEN: "${imageDescription}"
  NOMBRE DEL PRODUCTO: "${productName}"

  ═══════════════════════════════════════════════════════════════════════════════
  SECCIÓN 1: VALIDACIÓN DE PRODUCTO FÍSICO
  ═══════════════════════════════════════════════════════════════════════════════

  REQUISITO FUNDAMENTAL: El nombre debe referirse a un producto físico y tangible

  PRODUCTOS FÍSICOS PERMITIDOS:
  - Objetos tangibles que se pueden tocar, sostener o manipular
  - Productos manufacturados con presencia física
  - Artículos que ocupan espacio físico real
  - Bienes materiales que se pueden enviar/transportar

  PRODUCTOS NO FÍSICOS PROHIBIDOS:
  - Servicios (consultoría, reparaciones, instalaciones, cursos)
  - Productos digitales (software, apps, música, videos, ebooks)
  - Suscripciones (streaming, membresías, planes)
  - Servicios financieros (seguros, préstamos, inversiones)
  - Servicios profesionales (legal, médico, educativo)
  - Garantías extendidas o servicios de soporte
  - Licencias de software o contenido digital

  EJEMPLOS DE RECHAZO POR NO SER FÍSICO:
  - "Curso online programación" → shouldBeRejected = true
  - "Servicio limpieza" → shouldBeRejected = true
  - "App móvil fitness" → shouldBeRejected = true
  - "Suscripción Netflix" → shouldBeRejected = true
  - "Consultoría empresarial" → shouldBeRejected = true

  ═══════════════════════════════════════════════════════════════════════════════
  SECCIÓN 2: CATEGORÍAS PROHIBIDAS (PRODUCTOS FÍSICOS)
  ═══════════════════════════════════════════════════════════════════════════════

  PRODUCTOS FÍSICOS PROHIBIDOS:
  1. Alcohol y tabaco (licores, vino, cerveza, cigarrillos, vaporizadores)
  2. Drogas y parafernalia (sustancias ilegales, accesorios para drogas)
  3. Armas reales (armas de fuego, cuchillos excepto cocina, explosivos)
     - EXCEPCIÓN: Juguetes de armas están PERMITIDOS
  4. Materiales peligrosos (inflamables, tóxicos, químicos industriales)
  5. Animales y productos animales (animales vivos/muertos, órganos)
  6. Contenido para adultos (juguetes sexuales, material explícito)
     - EXCEPCIÓN: Suplementos sexuales están PERMITIDOS
  7. Productos médicos/farmacéuticos (medicinas prescritas)
     - EXCEPCIÓN: Suplementos nutricionales están PERMITIDOS
  8. Contenido que promueva violencia/discriminación

  ═══════════════════════════════════════════════════════════════════════════════
  SECCIÓN 3: ANÁLISIS SEMÁNTICO
  ═══════════════════════════════════════════════════════════════════════════════

  ESCALA DE RELEVANCIA SEMÁNTICA (0-100):

  PUNTUACIÓN 0: Sin relación
  - Imagen: "silla de oficina", Nombre: "smartphone Samsung"
  - Productos completamente diferentes

  PUNTUACIÓN 25-35: Poca relación
  - Imagen: "silla", Nombre: "accesorio hogar"
  - Categoría general coincide pero producto específico no

  PUNTUACIÓN 55-65: Relación moderada
  - Imagen: "silla de madera", Nombre: "mueble resistente"
  - Nombre genérico que podría aplicar al producto

  PUNTUACIÓN 75-85: Buena relación
  - Imagen: "silla cómoda", Nombre: "silla ergonómica oficina"
  - Nombre específico que coincide con características principales

  PUNTUACIÓN 90-100: Excelente relación
  - Imagen: "silla ejecutiva negra con ruedas", Nombre: "silla oficina negra cómoda ejecutiva"
  - Nombre detallado que coincide perfectamente

  ═══════════════════════════════════════════════════════════════════════════════
  SECCIÓN 4: ANÁLISIS DE DIMENSIONES
  ═══════════════════════════════════════════════════════════════════════════════

  Busca en el nombre dimensiones que indiquen un producto de tamaño MEDIANO o GRANDE.

  UMBRAL DE ACTIVACIÓN: ≥25cm (o equivalente en otras unidades)

  UNIDADES A BUSCAR:
  - Centímetros: cm, centímetros
  - Metros: m, metros
  - Pulgadas: in, ", pulgadas, inches
  - Pies: ft, ', pies, feet

  EQUIVALENCIAS:
  - 25 cm = 0.25 m = 10 pulgadas = 0.83 pies

  ASIGNA hasDimensions = true SI:
  - Encuentras dimensiones ≥25cm en CUALQUIER medida (largo, ancho, alto, diámetro)
  - Ejemplos que SÍ activan: "90cm", "1.5m", "30 pulgadas", "50x40cm", "2 pies"

  ASIGNA hasDimensions = false SI:
  - Las dimensiones son <25cm en TODAS las medidas
  - Ejemplos que NO activan: "5cm", "44mm", "2 pulgadas", "15cm", "0.1m"
  - No hay dimensiones en el nombre

  CATEGORÍAS QUE AUTOMÁTICAMENTE REQUIEREN hasDimensions = true:
  Si identificas un producto dentro de estas categorías, marca hasDimensions = true independientemente de las dimensiones visibles:
  - Productos que indiquen múltiples unidades: pack, combo, paca, set (ej: "camisa x3", "pantalón x2", "pack de 5", "combo familiar", "set completo")
  - Productos de categoría Agro (Fumigadora, esparcidora de semillas, rollo de alambre, pico, pala, etc) que por su naturaleza son grandes
  - Productos de Ferretería, Herramientas
  - Productos de Mobiliarios de casa u oficina
  - Productos en Combo, Pack, Paca
  - Productos de Camping, Neveras, Camas
  - Productos de Gimnasio
  - Productos Electrodomésticos (Cabinas de sonido, computadores completos (escritorio), monitores de 24´´, etc)

  REGLAS IMPORTANTES:
  - IGNORA códigos de modelo que parezcan medidas: "OE248", "XL-500", "M-350"
  - IGNORA tallas de ropa: "XL", "L", "M", "S" (no son dimensiones espaciales)
  - Si hay múltiples dimensiones (ej: 30x10x5cm), considera la dimensión MAYOR

  ═══════════════════════════════════════════════════════════════════════════════
  SECCIÓN 5: ANÁLISIS DE PESO
  ═══════════════════════════════════════════════════════════════════════════════

  Extrae el peso del nombre y conviértelo a kilogramos.

  CONVERSIONES:
  - 1 libra (lb) = 0.453592 kg
  - 1 onza (oz) = 0.0283495 kg
  - 1 gramo (g) = 0.001 kg
  - 1 tonelada = 1000 kg

  REGLAS:
  - Si no se encuentra peso específico, asigna 0
  - Busca patrones como: "2.5 kg", "5 libras", "800g", "3 lb"
  - IGNORA pesos que sean parte de códigos de modelo

  ═══════════════════════════════════════════════════════════════════════════════
  SECCIÓN 6: FORMATO DE RESPUESTA
  ═══════════════════════════════════════════════════════════════════════════════

  Usa la herramienta para proporcionar respuesta estructurada según el schema con los siguientes campos:

  - semanticRelevance: number (0-100, coincidencia entre imagen y nombre)
  - shouldBeRejected: boolean (true si no es físico, es prohibido o no identificable)
  - hasDimensions: boolean (true si tiene dimensiones ≥25cm, false en caso contrario)
  - weight: number (peso en kilogramos, 0 si no hay peso visible)

  ═══════════════════════════════════════════════════════════════════════════════
  REQUISITOS FINALES
  ═══════════════════════════════════════════════════════════════════════════════

  - Tu output DEBE ser en español
  - Sé preciso y objetivo en tu análisis
  - PRIORIDAD MÁXIMA: Rechaza cualquier producto que no sea físico/tangible
  - En caso de duda sobre si un producto es prohibido, marca shouldBeRejected = true
  - Prioriza la seguridad: es mejor rechazar un producto dudoso que aprobar uno prohibido
  - Distingue claramente entre juguetes (permitidos) y artículos reales peligrosos
`;

  static buildDescriptionAnalysisPrompt = (
    imageDescription: string,
    productDescription: string
  ): string => `
  ═══════════════════════════════════════════════════════════════════════════════
  ANÁLISIS DE DESCRIPCIÓN DE PRODUCTO
  ═══════════════════════════════════════════════════════════════════════════════

  Analiza la descripción del producto y compárala con la descripción de la imagen para determinar coherencia semántica y validar que se trate de un producto físico permitido.

  DESCRIPCIÓN DE LA IMAGEN: "${imageDescription}"
  DESCRIPCIÓN DEL PRODUCTO: "${productDescription}"

  ═══════════════════════════════════════════════════════════════════════════════
  SECCIÓN 1: VALIDACIÓN DE PRODUCTO FÍSICO
  ═══════════════════════════════════════════════════════════════════════════════

  REQUISITO FUNDAMENTAL: El producto DEBE ser físico y tangible

  PRODUCTOS FÍSICOS PERMITIDOS:
  - Objetos tangibles que se pueden tocar, sostener o manipular
  - Productos manufacturados con presencia física
  - Artículos que ocupan espacio físico real
  - Bienes materiales que se pueden enviar/transportar

  PRODUCTOS NO FÍSICOS PROHIBIDOS:
  - Servicios (consultoría, reparaciones, instalaciones, cursos)
  - Productos digitales (software, apps, música, videos, ebooks)
  - Suscripciones (streaming, membresías, planes)
  - Servicios financieros (seguros, préstamos, inversiones)
  - Servicios profesionales (legal, médico, educativo)
  - Garantías extendidas o servicios de soporte
  - Licencias de software o contenido digital

  EJEMPLOS DE RECHAZO POR NO SER FÍSICO:
  - "Curso online de programación" → shouldBeRejected = true
  - "Servicio de limpieza doméstica" → shouldBeRejected = true
  - "App móvil para fitness" → shouldBeRejected = true
  - "Suscripción Netflix" → shouldBeRejected = true
  - "Consultoría empresarial" → shouldBeRejected = true

  ═══════════════════════════════════════════════════════════════════════════════
  SECCIÓN 2: CATEGORÍAS PROHIBIDAS (PRODUCTOS FÍSICOS)
  ═══════════════════════════════════════════════════════════════════════════════

  PRODUCTOS FÍSICOS PROHIBIDOS:
  1. Alcohol y tabaco (licores, vino, cerveza, cigarrillos, vaporizadores)
  2. Drogas y parafernalia (sustancias ilegales, accesorios para drogas)
  3. Armas reales (armas de fuego, cuchillos excepto cocina, explosivos)
     - EXCEPCIÓN: Juguetes de armas están PERMITIDOS
  4. Materiales peligrosos (inflamables, tóxicos, químicos industriales)
  5. Animales y productos animales (animales vivos/muertos, órganos)
  6. Contenido para adultos (juguetes sexuales, material explícito)
     - EXCEPCIÓN: Suplementos sexuales están PERMITIDOS
  7. Productos médicos/farmacéuticos (medicinas prescritas)
     - EXCEPCIÓN: Suplementos nutricionales están PERMITIDOS
  8. Contenido que promueva violencia/discriminación

  ═══════════════════════════════════════════════════════════════════════════════
  SECCIÓN 3: ANÁLISIS SEMÁNTICO
  ═══════════════════════════════════════════════════════════════════════════════

  ESCALA DE RELEVANCIA SEMÁNTICA (0-100):

  PUNTUACIÓN 0: Sin relación
  - Imagen: "silla de oficina", Descripción: "smartphone último modelo"
  - Productos completamente diferentes

  PUNTUACIÓN 25-35: Poca relación
  - Imagen: "silla", Descripción: "producto para el hogar"
  - Categoría general coincide pero producto específico no

  PUNTUACIÓN 55-65: Relación moderada
  - Imagen: "sofá cama", Descripción: "mueble resistente y funcional"
  - Descripción genérica que podría aplicar al producto

  PUNTUACIÓN 75-85: Buena relación
  - Imagen: "silla ergonómica", Descripción: "silla de oficina cómoda"
  - Descripción específica que coincide con características principales

  PUNTUACIÓN 90-100: Excelente relación
  - Imagen: "silla ejecutiva negra con ruedas", Descripción: "silla ejecutiva negra con respaldo alto, brazos acolchados y base con ruedas"
  - Descripción detallada que coincide perfectamente

  ═══════════════════════════════════════════════════════════════════════════════
  SECCIÓN 4: ANÁLISIS DE DIMENSIONES
  ═══════════════════════════════════════════════════════════════════════════════

  Busca en la descripción dimensiones que indiquen un producto de tamaño MEDIANO o GRANDE.

  UMBRAL DE ACTIVACIÓN: ≥25cm (o equivalente en otras unidades)

  UNIDADES A BUSCAR:
  - Centímetros: cm, centímetros
  - Metros: m, metros
  - Pulgadas: in, ", pulgadas, inches
  - Pies: ft, ', pies, feet

  EQUIVALENCIAS:
  - 25 cm = 0.25 m = 10 pulgadas = 0.83 pies

  ASIGNA hasDimensions = true SI:
  - Encuentras dimensiones ≥25cm en CUALQUIER medida (largo, ancho, alto, diámetro)
  - Ejemplos que SÍ activan: "90cm", "1.5m", "30 pulgadas", "50x40cm", "2 pies"

  ASIGNA hasDimensions = false SI:
  - Las dimensiones son <25cm en TODAS las medidas
  - Ejemplos que NO activan: "5cm", "44mm", "2 pulgadas", "15cm", "0.1m"
  - No hay dimensiones en la descripción

  CATEGORÍAS QUE AUTOMÁTICAMENTE REQUIEREN hasDimensions = true:
  Si identificas un producto dentro de estas categorías, marca hasDimensions = true independientemente de las dimensiones visibles:
  - Productos que indiquen múltiples unidades: pack, combo, paca, set (ej: "camisa x3", "pantalón x2", "pack de 5", "combo familiar", "set completo")
  - Productos de categoría Agro (Fumigadora, esparcidora de semillas, rollo de alambre, pico, pala, etc) que por su naturaleza son grandes
  - Productos de Ferretería, Herramientas
  - Productos de Mobiliarios de casa u oficina
  - Productos en Combo, Pack, Paca
  - Productos de Camping, Neveras, Camas
  - Productos de Gimnasio
  - Productos Electrodomésticos (Cabinas de sonido, computadores completos (escritorio), monitores de 24´´, etc)

  REGLAS IMPORTANTES:
  - IGNORA códigos de modelo que parezcan medidas: "OE248", "XL-500", "M-350"
  - IGNORA tallas de ropa: "XL", "L", "M", "S" (no son dimensiones espaciales)
  - Si hay múltiples dimensiones (ej: 30x10x5cm), considera la dimensión MAYOR

  ═══════════════════════════════════════════════════════════════════════════════
  SECCIÓN 5: ANÁLISIS DE PESO
  ═══════════════════════════════════════════════════════════════════════════════

  Extrae el peso de la descripción y conviértelo a kilogramos.

  CONVERSIONES:
  - 1 libra (lb) = 0.453592 kg
  - 1 onza (oz) = 0.0283495 kg
  - 1 gramo (g) = 0.001 kg
  - 1 tonelada = 1000 kg

  REGLAS:
  - Si no se encuentra peso específico, asigna 0
  - Busca patrones como: "2.5 kg", "5 libras", "800g", "3 lb"
  - IGNORA pesos que sean parte de códigos de modelo

  ═══════════════════════════════════════════════════════════════════════════════
  SECCIÓN 6: FORMATO DE RESPUESTA
  ═══════════════════════════════════════════════════════════════════════════════

  Usa la herramienta para proporcionar respuesta estructurada según el schema con los siguientes campos:

  - semanticRelevance: number (0-100, coincidencia entre imagen y descripción)
  - shouldBeRejected: boolean (true si no es físico, es prohibido o no identificable)
  - hasDimensions: boolean (true si tiene dimensiones ≥25cm, false en caso contrario)
  - weight: number (peso en kilogramos, 0 si no hay peso visible)

  ═══════════════════════════════════════════════════════════════════════════════
  REQUISITOS FINALES
  ═══════════════════════════════════════════════════════════════════════════════

  - Tu output DEBE ser en español
  - Sé preciso y objetivo en tu análisis
  - PRIORIDAD MÁXIMA: Rechaza cualquier producto que no sea físico/tangible
  - En caso de duda sobre si un producto es prohibido, marca shouldBeRejected = true
  - Prioriza la seguridad: es mejor rechazar un producto dudoso que aprobar uno prohibido
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
}

export default Prompts;
