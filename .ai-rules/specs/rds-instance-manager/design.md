# Design Document - RDS Instance Manager Lambda

## Overview

La lambda `rds-instance-manager` es una función serverless que gestiona el estado de instancias RDS (start/stop) mediante eventos programados de EventBridge. Sigue exactamente las convenciones establecidas en el repositorio con la estructura estándar: handler, dto, model y documentación.

La función recibe un evento con una acción (start/stop) y un array de ARNs de instancias RDS, procesa cada instancia y registra los resultados en los logs.

## Architecture

### High-Level Architecture

```
EventBridge (Cron) → Lambda Handler → DTO → Model → AWS RDS API
                                                   ↓
                                              CloudWatch Logs
```

### Component Flow

1. **Handler** recibe el evento y maneja errores globales
2. **DTO** extrae y valida parámetros del evento
3. **Model** contiene la lógica de negocio y coordina las operaciones
4. **DAO** maneja las operaciones directas con AWS RDS API
5. **httpResponse** retorna respuesta consistente

## Components and Interfaces

### 1. Handler (index.ts)
- **Responsabilidad**: Punto de entrada siguiendo el patrón estándar
- **Estructura**:
  ```typescript
  export const handler = async (event: unknown, _context: unknown): Promise<any> => {
    try {
      const params = dto.getParams({ event });
      const model = new Model();
      await model.manageRDSInstances(params);
      
      return httpResponse({
        statusCode: 200,
        body: "RDS instances processed successfully"
      });
    } catch (error) {
      console.error("Error:", error);
      return httpResponse({
        statusCode: 500,
        body: error
      });
    }
  };
  ```

### 2. DTO (dto.ts)
- **Responsabilidad**: Validación y extracción de parámetros siguiendo el patrón existente
- **Funciones**:
  - `getParams({ event })`: Extrae y valida parámetros del evento
  - Validación de campos requeridos con array de `missingFields`
  - Throw de errores descriptivos para campos faltantes

### 3. DAO (dao.ts)
- **Responsabilidad**: Acceso a datos y operaciones AWS RDS
- **Funciones**:
  - Inicialización del cliente RDS
  - `startRDSInstance(instanceId)`: Ejecuta comando start
  - `stopRDSInstance(instanceId)`: Ejecuta comando stop
  - Manejo de errores específicos de AWS

### 4. Model (model.ts)
- **Responsabilidad**: Lógica de negocio y coordinación
- **Funciones**:
  - Constructor simple
  - `manageRDSInstances(params)`: Método principal que coordina las operaciones
  - Procesamiento secuencial de instancias
  - Extracción de instanceId desde ARN
  - Logging de resultados

### 5. Documentation (README.md)
- **Responsabilidad**: Documentación siguiendo el formato estándar del repo
- **Contenido**:
  - Overview, Purpose, Functionality
  - Business Logic, Input/Output
  - Dependencies, Error Handling
  - Usage Examples

## Data Models

### Event Structure (EventBridge Input)
```typescript
// Evento simple siguiendo el patrón del repo
{
  "action": "start" | "stop",
  "rdsArns": ["arn:aws:rds:region:account:db:instance1", "arn:aws:rds:region:account:db:instance2"]
}
```

### DTO Parameters
```typescript
// Parámetros extraídos por dto.getParams()
{
  action: string;
  rdsArns: string[];
}
```

### Response Structure
```typescript
// Usando httpResponse estándar del repo
{
  statusCode: 200 | 500,
  body: string // JSON stringified
}
```

## Error Handling

### Error Handling Strategy (Siguiendo patrón del repo)

1. **DTO Validation**
   - Validar campos requeridos con `missingFields` array
   - Throw error con mensaje descriptivo: `Missing data in event: ${missingFields.join(", ")}`

2. **Handler Error Management**
   - Try/catch en el handler principal
   - `console.error("Error:", error)` para logging
   - Return `httpResponse({ statusCode: 500, body: error })`

3. **Model Error Handling**
   - Continue-on-error: si una instancia falla, continuar con las demás
   - Log cada operación individual
   - No throw errors, solo logging para debugging

### Error Types
- **Missing Parameters**: Campos requeridos faltantes en el evento
- **AWS RDS Errors**: Instancia no encontrada, permisos, etc.
- **Invalid ARNs**: Formato de ARN incorrecto

## Testing Strategy

### Manual Testing (Siguiendo el patrón del repo)
- **Event Logging**: Usar `console.log("Event =>>>", JSON.stringify(event))` para debugging
- **Parameter Validation**: Probar con eventos malformados para validar DTO
- **AWS Operations**: Probar con instancias RDS reales en desarrollo
- **Error Scenarios**: Probar con ARNs inválidos y permisos insuficientes

### Test Cases Básicos
1. **Happy Path**: Start/stop de instancias válidas
2. **Validation Errors**: Eventos con campos faltantes
3. **AWS Errors**: ARNs inválidos o instancias inexistentes

## Implementation Details

### Dependencies
- Agregar `@aws-sdk/client-rds` al package.json
- Usar imports estándar del repo: `import httpResponse from "../../shared/responses/http"`

### AWS SDK Configuration (en DAO)
```typescript
import { RDSClient, StartDBInstanceCommand, StopDBInstanceCommand } from "@aws-sdk/client-rds";

class RDSDao {
  private rdsClient: RDSClient;
  
  constructor() {
    this.rdsClient = new RDSClient({ region: process.env.AWS_REGION || "us-east-1" });
  }
}
```

### ARN Processing
- Extraer `DBInstanceIdentifier` del ARN usando split
- Formato: `arn:aws:rds:region:account:db:instance-name` → `instance-name`

### Logging Strategy (Siguiendo patrón del repo)
```typescript
console.log("Event =>>>", JSON.stringify(event));
console.log("params =>>>", params);
console.log(`Processing ${action} for instance: ${instanceId}`);
```

### File Structure
```
src/lambdas/rds-instance-manager/
├── index.ts     # Handler principal
├── dto.ts       # Validación de parámetros
├── dao.ts       # Acceso a datos AWS RDS
├── model.ts     # Lógica de negocio
└── README.md    # Documentación
```

### Key Implementation Points
- No usar interfaces complejas, mantener código simple
- Procesar instancias secuencialmente con for loop
- No agregar validaciones excesivas
- Seguir exactamente el patrón de error handling del repo