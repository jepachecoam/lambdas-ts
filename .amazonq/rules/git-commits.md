### Instrucción

Analiza los archivos sin commit y genera 3 opciones de commit siguiendo conventional commits en inglés, ayudate de comandos de git que requieras para ver el codigo modificado y sus cambios, de esta manera generar buenas sugerencias de commits.

### Política Interna de Commits

#### 🚩 Formato Requerido

`git commit -m "tipo(alcance): descripción detallada"`

**Tipos permitidos según política interna:**

- `feat`: Nueva funcionalidad
- `fix`: Solución de bugs
- `build`: Cambios en compilación/dependencias
- `chore`: Archivos de configuración (.gitignore, eslint, vite...)
- `ci`: Cambios referentes al Continuous Integration (BuildSpect.yml)
- `docs`: Cambios de documentación (README, etc.)
- `refactor`: Refactorizaciones
- `revert`: Cambios revertidos
- `style`: Estilo de código (puntos y comas, comillas, etc.)
- `test`: Añadir tests
- `perf`: Mejora de rendimiento

#### 📋 Estructura del Commit

```
<type>(<scope>): <description>
[optional body]
[optional footer(s)]
```

**Descripción:** Mensaje descriptivo de lo que se realizó o cambió, no puede ser ambiguo o muy largo

**Body (opcional):** Ayuda a comprender mejor qué se hizo, su justificación, o tareas pendientes como checklist

**Footer (opcional):** ID de Jira o indicación de BREAKING CHANGE

### Información a Incluir

- **Tipo de cambio**: feat, fix, docs, style, refactor, test, chore, build, ci, revert, perf
- **Alcance**: módulo o área afectada
- **Descripción**: qué se cambió específicamente, no solo "updated files"
- **Impacto**: si es relevante, mencionar el beneficio o problema resuelto
- **ID de Jira**: incluir en footer si aplica

### Ejemplos de Calidad

```
git commit -m "feat(auth): implement JWT token validation for user sessions"
git commit -m "fix(api): resolve user data parsing error in registration endpoint"
git commit -m "docs(readme): add installation steps for development environment"
git commit -m "build(deps): update Webpack to Vite for improved build performance"
git commit -m "chore(config): update ESLint rules for better code quality"
git commit -m "ci(pipeline): add automated testing to BuildSpect workflow"
git commit -m "refactor(components): extract reusable button component"
git commit -m "test(auth): add unit tests for JWT validation logic"
git commit -m "perf(database): optimize user query with proper indexing"
```

### Evitar

- Descripciones vagas como "update files" o "fix bugs"
- Sin información sobre qué se cambió específicamente
- Sin contexto del impacto o propósito del cambio
- Commits sin revisar el checklist
- Mensajes como "cambio plan", "c p ptool asap"

### Casos Especiales

- **BREAKING CHANGES**: Incluir en footer y avisar al equipo
- **Cambios mínimos**: Usar rama patch desde GitHub o crear feature branch
- **Arreglos urgentes**: Usar `git revert` para cambios que rompen ambientes

### Herramientas Recomendadas

- **VSCode**: Conventional Commits extension (desactivar autocommit)
- **WebStorm**: Conventional Commit plugin
- **Terminal**: Usar comandos git para verificar cambios antes de commit
