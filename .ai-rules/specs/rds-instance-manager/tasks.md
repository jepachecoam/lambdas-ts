# Implementation Plan

- [x] 1. Configurar dependencias y estructura del proyecto


  - Agregar @aws-sdk/client-rds al package.json
  - Crear directorio src/lambdas/rds-instance-manager/
  - _Requirements: 2.1, 2.2_

- [x] 2. Implementar DTO para validación de parámetros


  - Crear dto.ts con función getParams siguiendo el patrón del repo
  - Validar campos requeridos: action y rdsArns
  - Implementar validación con missingFields array y throw de errores descriptivos
  - _Requirements: 2.2, 3.1_

- [x] 3. Implementar DAO para operaciones AWS RDS


  - Crear dao.ts con clase RDSDao
  - Inicializar cliente RDS en el constructor
  - Implementar método startRDSInstance(instanceId) con StartDBInstanceCommand
  - Implementar método stopRDSInstance(instanceId) con StopDBInstanceCommand
  - Agregar manejo básico de errores AWS con logging
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 4. Implementar Model con lógica de negocio


  - Crear model.ts con clase Model siguiendo el patrón del repo
  - Implementar constructor simple
  - Crear método manageRDSInstances(params) que coordine las operaciones
  - Implementar extracción de instanceId desde ARN usando split
  - Agregar procesamiento secuencial de instancias con for loop
  - Implementar switch para action (start/stop) llamando métodos del DAO
  - Agregar logging detallado de cada operación procesada
  - _Requirements: 1.1, 1.2, 1.4, 3.2, 3.3_

- [x] 5. Implementar Handler principal


  - Crear index.ts con handler siguiendo el patrón exacto del repo
  - Importar httpResponse, dto y Model
  - Implementar try/catch con console.error para errores
  - Llamar dto.getParams({ event }) para validar parámetros
  - Instanciar Model y llamar manageRDSInstances
  - Retornar httpResponse con statusCode 200/500 según corresponda
  - _Requirements: 2.1, 2.3, 3.4_

- [x] 6. Crear documentación completa


  - Crear README.md siguiendo el formato estándar del repo
  - Incluir Overview, Purpose, Functionality y Business Logic
  - Documentar estructura del evento con ejemplos de start y stop
  - Agregar sección Input/Output con ejemplos de eventos EventBridge
  - Incluir Dependencies, Error Handling y Usage Examples
  - Documentar IAM permissions requeridos para RDS operations
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7. Crear ejemplo de evento EventBridge



  - Crear archivo event-example.json con ejemplos de eventos
  - Incluir ejemplo para action "start" con array de ARNs
  - Incluir ejemplo para action "stop" con array de ARNs
  - Documentar formato esperado de ARNs de RDS
  - _Requirements: 4.1, 4.2, 4.3_