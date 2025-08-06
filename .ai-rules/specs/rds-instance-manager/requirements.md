# Requirements Document

## Introduction

Esta lambda se encarga de gestionar el estado de instancias RDS (apagar/encender) mediante eventos programados de EventBridge. La funcionalidad principal es recibir un array de ARNs de instancias RDS y cambiar su estado según se especifique en el evento. La lambda debe seguir las mismas convenciones de código del repositorio existente y ser lo más simple posible.

## Requirements

### Requirement 1

**User Story:** Como administrador de infraestructura, quiero poder apagar instancias RDS automáticamente mediante un cronjob, para reducir costos durante horarios no productivos.

#### Acceptance Criteria

1. WHEN la lambda recibe un evento con action "stop" THEN el sistema SHALL detener todas las instancias RDS especificadas en el array de ARNs
2. WHEN la lambda recibe un evento con action "start" THEN el sistema SHALL iniciar todas las instancias RDS especificadas en el array de ARNs
3. WHEN la lambda procesa una instancia RDS THEN el sistema SHALL usar el SDK de AWS actualizado para realizar la operación
4. WHEN la lambda completa una operación THEN el sistema SHALL registrar en logs el resultado de cada instancia procesada

### Requirement 2

**User Story:** Como desarrollador, quiero que la lambda siga las mismas convenciones del repositorio, para mantener consistencia en el código.

#### Acceptance Criteria

1. WHEN se implemente la lambda THEN el sistema SHALL seguir la estructura de carpetas existente (index.ts, dto.ts, README.md)
2. WHEN se escriba el código THEN el sistema SHALL usar el mismo patrón de handler que las otras lambdas
3. WHEN se manejen errores THEN el sistema SHALL usar el mismo patrón de try/catch y logging
4. WHEN se validen parámetros THEN el sistema SHALL usar un dto.ts similar a las otras lambdas

### Requirement 3

**User Story:** Como administrador del sistema, quiero que la lambda sea simple y funcional, para facilitar el mantenimiento y reducir la complejidad.

#### Acceptance Criteria

1. WHEN se implemente la lambda THEN el sistema SHALL tener código mínimo sin validaciones excesivas
2. WHEN se procesen las instancias THEN el sistema SHALL iterar sobre el array de ARNs de forma simple
3. WHEN ocurra un error en una instancia THEN el sistema SHALL continuar procesando las demás instancias
4. WHEN se complete el procesamiento THEN el sistema SHALL retornar un resultado simple indicando el estado general

### Requirement 4

**User Story:** Como usuario del sistema, quiero documentación clara del evento que recibe la lambda, para poder configurar correctamente EventBridge.

#### Acceptance Criteria

1. WHEN se complete la implementación THEN el sistema SHALL incluir un ejemplo de evento en el README
2. WHEN se documente el evento THEN el sistema SHALL especificar la estructura exacta con action y rdsArns
3. WHEN se proporcione documentación THEN el sistema SHALL incluir ejemplos de uso para start y stop
4. WHEN se documente la lambda THEN el sistema SHALL seguir el mismo formato de README que las otras lambdas