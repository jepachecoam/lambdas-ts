## ADDED Requirements

### Requirement: README communicates purpose without implementation detail

Each lambda README SHALL describe what the lambda does and why it exists in plain language. It MUST NOT contain variable names, constant names, database table or column names, JSON field names, HTTP path strings, AWS resource names or ARN patterns, internal class or function names, environment variable names, or code snippets of any kind.

#### Scenario: README contains no code or technical identifiers

- **WHEN** a reader opens any lambda README
- **THEN** they find no JSON blocks, no code fences, no variable names, no table/column names, and no internal method or class references

#### Scenario: README is specific enough to identify the lambda

- **WHEN** a reader reads the README in isolation
- **THEN** they can identify which lambda it describes from the description alone, without it being so generic it could apply to any lambda

---

### Requirement: README follows the canonical section structure

Every lambda README SHALL contain the following sections in order:

1. A top-level title matching the lambda folder name
2. A **Purpose** section with a single paragraph stating the lambda's sole responsibility
3. A **What it does** section with a single paragraph summarizing what the lambda receives, processes, and produces
4. A flow section with a descriptive title that reflects the lambda's domain (e.g. "Authorization flow", "Processing flow"), containing a numbered list of conceptual steps
5. An **Internal layers** section with a bullet per source file describing its conceptual role

An optional section describing what is emitted or enriched on success MAY appear between the flow and the internal layers sections, when relevant.

#### Scenario: README has all required sections

- **WHEN** a README is reviewed against the structure
- **THEN** it contains exactly the required sections in the specified order, with no missing sections

#### Scenario: Flow section title reflects the domain

- **WHEN** the flow section is reviewed
- **THEN** its title is domain-specific (not generic like "Flow" or "Steps"), matching the type of work the lambda performs

---

### Requirement: Purpose section is a single focused paragraph

The **Purpose** section SHALL contain exactly one paragraph. It MUST state what the lambda is (its role in the system), its single responsibility, and what it does NOT do (i.e. what is out of scope for that lambda). It MUST NOT list features or steps.

#### Scenario: Purpose is scoped to a single responsibility

- **WHEN** the Purpose section is read
- **THEN** it describes one clear responsibility and explicitly mentions what the lambda does not handle

---

### Requirement: What it does section is a single paragraph

The **What it does** section SHALL contain exactly one paragraph describing the lambda's end-to-end behavior at a conceptual level: what it receives as input, what it validates or processes, and what it produces or emits as output.

#### Scenario: What it does is not a list

- **WHEN** the section is reviewed
- **THEN** it is written as prose, not as a bullet list or numbered list

---

### Requirement: Flow section uses numbered conceptual steps

The flow section SHALL contain a numbered list where each item describes one logical step in the lambda's process. Each step MUST be written as a plain-language action or decision without naming internal functions, variables, or data structures.

#### Scenario: Each step is understandable to a non-developer

- **WHEN** each step is read by someone unfamiliar with the codebase
- **THEN** they understand what is happening at a business or system level without needing to know the implementation

#### Scenario: Flow steps are not sub-divided into sub-bullets

- **WHEN** the flow section is reviewed
- **THEN** each numbered item is a single, self-contained sentence or short phrase with no nested bullets

---

### Requirement: Internal layers section maps files to conceptual roles

The **Internal layers** section SHALL contain one bullet per source file in the lambda. Each bullet MUST use the filename as a bold label and describe the file's conceptual responsibility in one sentence. The description MUST NOT name internal types, interfaces, classes, or functions.

#### Scenario: Every source file has an entry

- **WHEN** the internal layers section is compared to the lambda's source files
- **THEN** every file has a corresponding bullet

#### Scenario: Layer descriptions are role-based, not type-based

- **WHEN** a layer description is read
- **THEN** it describes what the file is _responsible for_ (e.g. "handles all authorization logic") rather than what types it defines or what functions it exports

---

### Requirement: b2c-auth README is the canonical style reference

The `b2c-auth/README.md` SHALL be treated as the style benchmark. Any rewritten README that deviates from its tone, density, or level of abstraction SHALL be considered non-compliant and require revision.

#### Scenario: Rewritten README matches b2c-auth style density

- **WHEN** a rewritten README is placed side-by-side with b2c-auth/README.md
- **THEN** both feel like they belong to the same documentation standard — similar length per section, similar level of abstraction, no obvious style mismatch
