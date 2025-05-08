import js from "@eslint/js";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,jsx,ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "unused-imports": unusedImports,
      "simple-import-sort": simpleImportSort
    },
    rules: {
      "keyword-spacing": ["error", { before: true, after: true }], // Enforces consistent spacing before and after keywords.
      // ❌ Incorrect: No space before/after the keyword.
      // if(x){ return true; }

      // ✅ Correct: Spaces before and after keywords.
      // if (x) { return true; }

      "simple-import-sort/imports": "error", // Enforces sorting of import statements for better readability and maintainability.
      // ❌ Incorrect: Imports are not sorted.
      // import z from "moduleZ";
      // import a from "moduleA";

      // ✅ Correct: Imports are sorted alphabetically.
      // import a from "moduleA";
      // import z from "moduleZ";

      "simple-import-sort/exports": "error", // Enforces sorting of export statements to keep the code organized.
      // ❌ Incorrect: Unsorted exports.
      // export { b, a, c };

      // ✅ Correct: Sorted exports.
      // export { a, b, c };

      // "no-console": "warn", // Disallows the use of `console.log` and other console methods.
      // ❌ Incorrect: Using console.log().
      // console.log("Debugging...");

      // ✅ Correct: Use a proper logging library or remove debugging statements.
      // logger.info("Debugging...");

      "prefer-const": "error", // Requires `const` instead of `let` if a variable is never reassigned.
      // ❌ Incorrect: Using `let` for a variable that never changes.
      // let name = "John";

      // ✅ Correct: Using `const` for immutable values.
      // const name = "John";

      "no-unused-vars": "off", // Disables the rule that warns about declared variables that are not used.
      // ❌ Incorrect: Unused variable declared.
      // let unusedVar = 42;

      // ✅ Correct: All declared variables are used.
      // let usedVar = 42;
      // console.log(usedVar);

      "unused-imports/no-unused-vars": [
        "error",
        {
          vars: "all", // Warns about all unused variables.
          varsIgnorePattern: "^_", // Ignores unused variables that start with an underscore (`_`).
          args: "after-used", // Warns about function arguments only if they are unused and appear after used arguments.
          argsIgnorePattern: "^_", // Ignores unused function arguments that start with an underscore (`_`).
          caughtErrorsIgnorePattern: "^_" // Ignores unused error parameters in catch clauses if they start with an underscore (`_`).
        }
      ],

      // indent: ["error", 2], // Enforces consistent indentation of 2 spaces.
      // ❌ Incorrect: Inconsistent indentation (4 spaces).
      // function test() {
      //     return true;
      // }

      // ✅ Correct: 2-space indentation.
      // function test() {
      //   return true;
      // }

      quotes: ["error", "double", { avoidEscape: true }], // Requires double quotes for strings, but allows single quotes if escaping is needed.
      // ❌ Incorrect: Using single quotes when double quotes should be used.
      // let message = 'Hello';

      // ✅ Correct: Using double quotes.
      // let message = "Hello";

      // ✅ Correct: Using single quotes only to avoid escaping.
      // let message = 'Don\'t worry!';

      // "space-before-function-paren": ["error", "never"], // Requires a space before function parentheses.
      // ❌ Incorrect: Space before parentheses.
      // function myFunc () { return true; }

      // ✅ Correct: No space before parentheses.
      // function myFunc() { return true; }

      eqeqeq: ["error", "always", { null: "ignore" }], // Requires strict equality (`===` and `!==`) except when comparing with `null`.
      // ❌ Incorrect: Using `==` instead of `===`.
      // if (x == 10) { doSomething(); }

      // ✅ Correct: Using `===` for strict comparison.
      // if (x === 10) { doSomething(); }

      // ✅ Correct: `==` is allowed only when comparing with `null`.
      // if (x == null) { handleNull(); }

      "space-infix-ops": "error", // Ensures spaces around operators for readability.
      // ❌ Incorrect: Missing spaces around operators.
      // let x=a+b;

      // ✅ Correct: Spaces around operators.
      // let x = a + b;

      "comma-spacing": ["error", { after: true }], // Requires a space after commas but not before them.
      // ❌ Incorrect: No space after commas.
      // let arr = [1,2,3];

      // ✅ Correct: Space after commas.
      // let arr = [1, 2, 3];

      "brace-style": ["error", "1tbs", { allowSingleLine: true }], // Enforces "one true brace style" (1TBS), keeping `{` on the same line.
      // ❌ Incorrect: `{` is on a new line.
      // if (x)
      // {
      //   return y;
      // }

      // ✅ Correct: `{` stays on the same line.
      // if (x) {
      //   return y;
      // }

      // ✅ Correct: Single-line braces are allowed.
      // if (x) { return y; }

      curly: ["error", "multi-line"], // Requires curly braces for multi-line control statements.
      // ❌ Incorrect: No curly braces for multi-line statement.
      // if (x)
      //   doSomething();

      // ✅ Correct: Curly braces used for multi-line statement.
      // if (x) {
      //   doSomething();
      // }

      // ✅ Correct: No curly braces needed for a single-line statement.
      // if (x) doSomething();

      "handle-callback-err": "error", // Enforces handling of the `err` parameter in callbacks.
      // ❌ Incorrect: Ignoring the `err` parameter.
      // function callback(err, data) { console.log(data); }

      // ✅ Correct: Handling the `err` parameter.
      // function callback(err, data) {
      //   if (err) {
      //     console.error(err);
      //   }
      //   console.log(data);
      // }

      "no-undef": "error", // Disallows the use of undeclared variables unless specified in a `/* global */` comment.
      // ❌ Incorrect: Using an undeclared variable.
      // console.log(myVar);

      // ✅ Correct: Declaring the variable before using it.
      // let myVar = 10;
      // console.log(myVar);

      "no-multiple-empty-lines": "error", // Disallows multiple consecutive empty lines for cleaner code.
      // ❌ Incorrect: Too many empty lines.
      // let a = 10;

      // let b = 20;

      // ✅ Correct: A single empty line is fine.
      // let a = 10;

      // let b = 20;

      // "operator-linebreak": ["error", "after"], // Enforces line breaks after operators in multi-line expressions. Example:
      // ✅ `let result = condition ? value1 : value2;`
      // ❌ `let result = condition
      // ? value1 : value2;`

      "one-var": ["error", "never"], // Disallows multiple variable declarations in a single statement. Example:
      // ✅ `let a = 1;\nlet b = 2;`
      // ❌ `let a = 1, b = 2;`

      "no-cond-assign": ["error", "except-parens"], // Disallows assignment inside conditional expressions unless wrapped in parentheses. Example:
      // ✅ `if ((x = y)) {}`
      // ❌ `if (x = y) {}`

      "block-spacing": "error",
      // Space inside single-line blocks.
      // ❌ Incorrect: `function test() {return true;}`
      // ✅ Correct: `function test() { return true; }`

      camelcase: "error", // Enforces camelCase for variable and function names. Example:
      // ✅ `let myVariable = 10;`
      // ❌ `let my_variable = 10;`

      "comma-dangle": ["error", "never"], // Disallows trailing commas in objects and arrays. Example:
      // ✅ `let obj = { key: "value" };`
      // ❌ `let obj = { key: "value", };`

      "comma-style": ["error", "last"], // Enforces commas at the end of the current line, not the beginning of the next. Example:
      // ✅ `let items = [1, 2, 3];`
      // ❌ `let items = [1
      // , 2
      // , 3];`

      "dot-location": ["error", "property"], // Requires dots in property access to be on the same line as the property. Example:
      // ✅ `obj.property`
      // ❌ `obj
      // .property`

      "eol-last": "error", // Enforces a newline at the end of files. Helps with version control consistency.

      "func-call-spacing": ["error", "never"], // Disallows spaces between function names and parentheses. Example:
      // ✅ `myFunction();`
      // ❌ `myFunction ();`

      "key-spacing": ["error", { afterColon: true }], // Enforces spacing after colons in key-value pairs. Example:
      // ✅ `{ key: "value" }`
      // ❌ `{ key:"value" }`

      "new-cap": ["error", { capIsNew: false, newIsCap: true }],
      // ✅ `let instance = new MyClass();`
      // ❌ `let instance = new myClass();`

      "new-parens": "error", // Requires parentheses when invoking a constructor without arguments. Example:
      // ✅ `let instance = new MyClass();`
      // ❌ `let instance = new MyClass;`

      "accessor-pairs": "error", // Requires objects with a setter to also have a getter. Example:
      // ✅ `let obj = { get value() { return this._value; }, set value(v) { this._value = v; } };`
      // ❌ `let obj = { set value(v) { this._value = v; } };`

      "constructor-super": "error", // Requires `super()` in derived class constructors before accessing `this`. Example:
      // ✅ `class Child extends Parent { constructor() { super(); } }`
      // ❌ `class Child extends Parent { constructor() { this.value = 10; } }`

      "no-array-constructor": "error", // Disallows `new Array()` in favor of array literals. Example:
      // ✅ `let arr = [1, 2, 3];`
      // ❌ `let arr = new Array(1, 2, 3);`

      "no-caller": "error", // Disallows `arguments.callee` and `arguments.caller` (deprecated features).
      // ❌ Incorrect: Using `arguments.callee`, which is deprecated and not allowed in strict mode.
      // function example() {
      //   console.log(arguments.callee);
      // }

      // ❌ Incorrect: Using `arguments.caller`, which is also deprecated.
      // function example() {
      //   console.log(arguments.caller);
      // }

      // ✅ Correct: Use a named function instead of `arguments.callee`.
      // function example() {
      //   console.log(example);
      // }

      // ✅ Correct: Pass the function explicitly if recursion is needed.
      // function factorial(n) {
      //   return n <= 1 ? 1 : n * factorial(n - 1);
      // }

      "no-class-assign": "error", // Disallows reassigning class declarations. Example:
      // ✅ `class MyClass {} let instance = new MyClass();`
      // ❌ `class MyClass {} MyClass = {};`

      "no-const-assign": "error", // Disallows reassigning `const` variables. Example:
      // ✅ `const a = 5;`
      // ❌ `const a = 5; a = 10;`

      "no-constant-condition": "error", // Disallows conditions that are always true or false, except in loops.
      // ❌ Incorrect: The condition is always true, making the `if` statement redundant.
      // if (true) {
      //   doSomething();
      // }

      // ✅ Correct: Use a dynamic condition based on a variable.
      // if (x > 10) {
      //   doSomething();
      // }

      // ✅ Correct in a loop: While loops with `true` are allowed if they contain a breaking condition.
      // while (true) {
      //   if (shouldStop) break;
      // }

      "no-control-regex": "error", // Disallows control characters in regular expressions to prevent errors.
      // ❌ Incorrect: The regex contains a control character, which is not valid.
      // let regex = /\x1f/;

      // ✅ Correct: Use a valid regular expression pattern.
      // let regex = /\d+/; // Matches one or more digits

      "no-debugger": "error", // Disallow `debugger`.
      // ❌ Incorrect: Using `debugger` will halt script execution and should not be in production code.
      // debugger;

      // ✅ Correct: Use `console.log()` for debugging instead.
      // console.log("Debugging message");

      "no-delete-var": "error", // Disallow the `delete` operator on variables.
      // ❌ Incorrect: Deleting a variable is not allowed.
      // let x = 10;
      // delete x;

      // ✅ Correct: Use `null` or `undefined` instead of `delete`.
      // let x = 10;
      // x = null;

      "no-dupe-args": "error", // Disallow duplicate arguments in function definitions.
      // ❌ Incorrect: Duplicate parameter names cause unexpected behavior.
      // function sum(a, a) { return a + a; }

      // ✅ Correct: Ensure all parameters have unique names.
      // function sum(a, b) { return a + b; }

      "no-dupe-class-members": "error", // Disallow duplicate names in class members.
      // ❌ Incorrect: Methods with the same name will cause errors.
      // class MyClass {
      //   method() {}
      //   method() {}
      // }

      // ✅ Correct: Use unique method names.
      // class MyClass {
      //   methodOne() {}
      //   methodTwo() {}
      // }

      "no-dupe-keys": "error", // Disallow duplicate keys in object literals.
      // ❌ Incorrect: Duplicate keys will override each other, leading to unexpected results.
      // let obj = { key: "value1", key: "value2" };

      // ✅ Correct: Ensure all keys are unique.
      // let obj = { key1: "value1", key2: "value2" };

      "no-duplicate-case": "error", // Disallow duplicate cases in `switch` statements.
      // ❌ Incorrect: The same case appears multiple times.
      // switch (x) {
      //   case 1: break;
      //   case 1: break;
      // }

      // ✅ Correct: Ensure each case value is unique.
      // switch (x) {
      //   case 1: break;
      //   case 2: break;
      // }

      "no-duplicate-imports": "error", // Enforce a single `import` statement per module.
      // ❌ Incorrect: Importing the same module multiple times.
      // import { a } from "module";
      // import { b } from "module";

      // ✅ Correct: Combine imports into a single statement.
      // import { a, b } from "module";

      "no-empty-character-class": "error", // Disallow empty character classes in regular expressions.
      // ❌ Incorrect: Empty character classes do not match anything.
      // let regex = /[]/;

      // ✅ Correct: Define at least one valid character in the character class.
      // let regex = /[a-z]/;

      "no-empty-pattern": "error", // Disallow empty destructuring patterns.
      // ❌ Incorrect: Empty destructuring has no effect.
      // let {} = obj;

      // ✅ Correct: Use destructuring only when extracting properties.
      // let { key } = obj;

      "no-eval": "error", // Disallow `eval()` due to security risks.
      // ❌ Incorrect: `eval()` executes arbitrary code and is unsafe.
      // eval("alert('Unsafe!')");

      // ✅ Correct: Use safer alternatives, such as JSON parsing.
      // JSON.parse('{"key": "value"}');

      "no-ex-assign": "error", // Disallow reassigning exceptions in `catch` blocks.
      // ❌ Incorrect: Reassigning the exception variable loses the original error.
      // try {
      //   throw new Error("error");
      // } catch (e) {
      //   e = "another error";
      // }

      // ✅ Correct: Always use the exception object as-is.
      // try {
      //   throw new Error("error");
      // } catch (e) {
      //   console.error(e.message);
      // }

      "no-extend-native": "error", // Disallow extending native objects.
      // ❌ Incorrect: Extending native objects can lead to unexpected behavior.
      // Object.prototype.newMethod = function() {};

      // ✅ Correct: Use class-based extensions instead.
      // class CustomObject {
      //   newMethod() {
      //     // Custom method inside a class
      //   }
      // }

      "no-extra-bind": "error", // Disallow unnecessary use of `.bind()`.
      // ❌ Incorrect: `.bind(this)` is unnecessary when not needed.
      // let fn = function() { return this; }.bind(this);

      // ✅ Correct: Use the function directly without `.bind()`.
      // let fn = function() { return this; };

      "no-extra-boolean-cast": "error", // Disallow unnecessary boolean casts.
      // ❌ Incorrect: `!!x` is redundant.
      // if (!!x) { console.log(x); }

      // ✅ Correct: Use `if (x)` directly.
      // if (x) { console.log(x); }

      // "no-extra-parens": "error", // Disallow unnecessary parentheses around expressions.
      // ❌ Incorrect: Extra parentheses are not needed.
      // let result = (a + b);

      // ✅ Correct: Remove unnecessary parentheses.
      // let result = a + b;

      "no-fallthrough": "error", // Require `break` to prevent fallthrough in `switch` cases.
      // ❌ Incorrect: Fallthrough occurs when `break` is missing.
      // switch (x) {
      //   case 1:
      //     console.log(1);
      //   case 2: // Falls through to next case
      //     console.log(2);
      // }

      // ✅ Correct: Add `break` to prevent fallthrough.
      // switch (x) {
      //   case 1:
      //     console.log(1);
      //     break;
      //   case 2:
      //     console.log(2);
      //     break;
      // }

      "no-floating-decimal": "error", // Disallow leading decimal points in numeric values.
      // ❌ Incorrect: A leading decimal can be confusing.
      // let num = .5;

      // ✅ Correct: Always include a leading zero.
      // let num = 0.5;

      "no-func-assign": "error", // Disallow reassigning function declarations.
      // ❌ Incorrect: Reassigning a function declaration is not allowed.
      // function myFunc() {}
      // myFunc = 10;

      // ✅ Correct: Assign a function to a variable instead.
      // let myFunc = function() {};

      "no-global-assign": "error", // Disallow reassignment of global read-only variables.
      // ❌ Incorrect: Modifying global read-only properties is not allowed.
      // Math.PI = 3;

      // ✅ Correct: Use a separate variable if needed.
      // const myPi = Math.PI;

      "no-implied-eval": "error", // Disallow implied `eval()`.
      // ❌ Incorrect: String execution is dangerous.
      // setTimeout("console.log('Implied eval')", 1000);

      // ✅ Correct: Use arrow functions instead.
      // setTimeout(() => console.log("Safe"), 1000);

      "arrow-parens": ["error", "always"], // Require parentheses around arrow function arguments.
      // ❌ Incorrect: Missing parentheses.
      // const greet = name => `Hola ${name}`;

      // ✅ Correct: Parentheses are always required.
      // const greet = (name) => `Hola ${name}`;

      "no-inner-declarations": "error", // Disallow function declarations inside nested blocks.
      // ❌ Incorrect: Function declarations inside blocks can cause issues.
      // if (x) {
      //   function myFunc() {}
      // }

      // ✅ Correct: Use function expressions instead.
      // if (x) {
      //   let myFunc = function() {};
      // }

      "no-invalid-regexp": "error", // Disallow invalid regular expression strings.
      // ❌ Incorrect: An incomplete regex pattern causes errors.
      // let regex = new RegExp("[");

      // ✅ Correct: Ensure valid regex syntax.
      // let regex = new RegExp("[a-z]");

      "no-irregular-whitespace": "error", // Disallow irregular whitespace characters.

      "no-iterator": "error", // Disallow the use of `__iterator__`.
      // ❌ Incorrect:
      // obj.__iterator__ = function() {};

      // ✅ Correct:
      // Use standard iteration methods like `for...of` or `.forEach()`.

      "no-label-var": "error", // Disallow labels that share a name with a variable.
      // ❌ Incorrect:
      // var test = 10;
      // test: while (true) { break test; }

      // ✅ Correct:
      // var test = 10;
      // while (true) { break; }

      "no-labels": "error", // Disallow labeled statements.
      // ❌ Incorrect:
      // label: while (true) { break label; }

      // ✅ Correct:
      // while (true) { break; }

      "no-lone-blocks": "error", // Disallow unnecessary blocks.
      // ❌ Incorrect:
      // { console.log("Unnecessary block"); }

      // ✅ Correct:
      // console.log("No unnecessary block");

      "no-mixed-spaces-and-tabs": "error", // Disallow mixed spaces and tabs for indentation.
      // ❌ Incorrect:
      // let x = 5;  // Uses both spaces and tabs

      // ✅ Correct:
      // let x = 5; // Uses only spaces or only tabs

      "no-multi-spaces": "error", // Disallow multiple spaces except for indentation.
      // ❌ Incorrect:
      // let x =  5;

      // ✅ Correct:
      // let x = 5;

      "no-multi-str": "error", // Disallow multiline strings using `\`.
      // ❌ Incorrect:
      // let str = "Line 1 \
      // Line 2";

      // ✅ Correct:
      // let str = "Line 1\nLine 2";

      "no-new": "error", // Disallow `new` without assigning the object.
      // ❌ Incorrect:
      // new Object();

      // ✅ Correct:
      // let obj = new Object();

      "no-new-func": "error", // Disallow the `Function` constructor.
      // ❌ Incorrect:
      // let fn = new Function("return 5");

      // ✅ Correct:
      // let fn = () => 5;

      "no-new-object": "error", // Disallow the `Object` constructor.
      // ❌ Incorrect:
      // let obj = new Object();

      // ✅ Correct:
      // let obj = {};

      "no-new-require": "error", // Disallow `new require()`.
      // ❌ Incorrect:
      // let module = new require("fs");

      // ✅ Correct:
      // let module = require("fs");

      "no-new-symbol": "error", // Disallow the `Symbol` constructor.
      // ❌ Incorrect:
      // let sym = new Symbol();

      // ✅ Correct:
      // let sym = Symbol();

      "no-new-wrappers": "error", // Disallow instantiating primitive wrappers.
      // ❌ Incorrect:
      // let str = new String("hello");

      // ✅ Correct:
      // let str = "hello";

      "no-obj-calls": "error", // Disallow calling global object properties as functions.
      // ❌ Incorrect:
      // Math();

      // ✅ Correct:
      // let result = Math.random();

      "no-octal": "error", // Disallow octal literals.
      // ❌ Incorrect:
      // let num = 071;

      // ✅ Correct:
      // let num = 57;

      "no-octal-escape": "error", // Disallow octal escape sequences in strings.
      // ❌ Incorrect:
      // let str = "Hello \251";

      // ✅ Correct:
      // let str = "Hello \u00A9";

      "no-path-concat": "error", // Disallow concatenating `__dirname` and `__filename`.
      // ❌ Incorrect:
      // let path = __dirname + "/file.js";

      // ✅ Correct:
      // const path = require("path");
      // let filePath = path.join(__dirname, "file.js");

      "no-proto": "error", // Disallow the use of `__proto__`. Use `Object.getPrototypeOf` instead.
      // ❌ Incorrect:
      // obj.__proto__ = otherObj;

      // ✅ Correct:
      // Object.setPrototypeOf(obj, otherObj);

      "no-redeclare": "error", // Disallow redeclaring variables.
      // ❌ Incorrect:
      // let x = 5;
      // let x = 10;

      // ✅ Correct:
      // let x = 5;
      // x = 10;

      "no-regex-spaces": "error", // Disallow multiple spaces in regex patterns.
      // ❌ Incorrect:
      // let regex = /foo    bar/;

      // ✅ Correct:
      // let regex = /foo {1,}bar/;

      "no-return-assign": "error", // Wrap assignments inside `return` with parentheses.
      // ❌ return a = b + c;
      // ✅ return (a = b + c);

      "no-self-assign": "error", // Disallow self-assignment.
      // ❌ Incorrect:
      // x = x;

      // ✅ Correct:
      // let a = 5;
      // let b = a;

      "no-self-compare": "error", // Disallow self-comparison.
      // ❌ Incorrect:
      // if (x === x) { console.log("Always true"); }

      // ✅ Correct:
      // if (x === y) { console.log("Valid comparison"); }

      "no-sequences": "error", // Disallow the comma operator.
      // ❌ Incorrect:
      // let x = (1, 2, 3);

      // ✅ Correct:
      // let x = 3;

      "no-shadow-restricted-names": "error", // Disallow shadowing of restricted names.
      // ❌ Incorrect:
      // let undefined = "value";
      // let NaN = 42;

      // ✅ Correct:
      // let value = "something";

      "no-sparse-arrays": "error", // Disallow sparse arrays.
      // ❌ Incorrect:
      // let arr = [1, , 3];

      // ✅ Correct:
      // let arr = [1, 2, 3];

      "no-tabs": "error", // Disallow the use of tabs.
      // ❌ Incorrect (contains tabs):
      // function test() {↹console.log("Hello"); }

      // ✅ Correct (uses spaces instead of tabs):
      // function test() {  console.log("Hello"); }

      "no-template-curly-in-string": "error", // Disallow template placeholders in regular strings.
      // ❌ Incorrect:
      // let str = "Hello, ${name}!";

      // ✅ Correct:
      // let str = `Hello, ${name}!`;

      "no-this-before-super": "error", // Call `super()` before using `this` in classes.
      // ❌ Incorrect:
      // class MyClass extends Parent {
      //   constructor() {
      //     this.value = 10; // Cannot use 'this' before 'super'
      //     super();
      //   }
      // }

      // ✅ Correct:
      // class MyClass extends Parent {
      //   constructor() {
      //     super();
      //     this.value = 10;
      //   }
      // }

      "no-throw-literal": "error", // Only throw `Error` objects.
      // ❌ Incorrect:
      // throw "Something went wrong";
      // throw 404;

      // ✅ Correct:
      // throw new Error("Something went wrong");

      "no-trailing-spaces": "error", // Disallow trailing spaces at the end of lines.
      // ❌ Incorrect:
      // let x = 5;    // <-- extra spaces here

      // ✅ Correct:
      // let x = 5;

      "no-undef-init": "error", // Disallow initializing variables with `undefined`.
      // ❌ Incorrect:
      // let a = undefined;

      // ✅ Correct:
      // let a;

      "no-unmodified-loop-condition": "error", // Prevent unmodified loop conditions.
      // ❌ Incorrect:
      // let i = 0;
      // while (i < 10) { // Condition never updates
      //   console.log(i);
      // }

      // ✅ Correct:
      // let j = 0;
      // while (j < 10) {
      //   console.log(j);
      //   j++; // Condition is updated
      // }

      "no-unneeded-ternary": "error", // Disallow unnecessary ternary operators.
      // ❌ Incorrect:
      // let isAvailable = condition ? true : false;

      // ✅ Correct:
      // let isAvailable = Boolean(condition);

      "no-unreachable": "error", // Disallow unreachable code.
      // ❌ Incorrect:
      // function test() {
      //   return;
      //   console.log("This will never run");
      // }

      // ✅ Correct:
      // function test() {
      //   console.log("This will run");
      //   return;
      // }

      "no-unsafe-finally": "error", // Disallow control flow statements in `finally` blocks.
      // ❌ Incorrect:
      // try {
      //   throw new Error("Error");
      // } finally {
      //   return 42; // Return inside `finally` can override the error
      // }

      // ✅ Correct:
      // try {
      //   throw new Error("Error");
      // } finally {
      //   console.log("Cleanup code here");
      // }

      "no-unsafe-negation": "error", // Disallow negating left operand of relational operators.
      // ❌ Incorrect:
      // if (!key in obj) {
      //   console.log("Incorrect negation");
      // }

      // ✅ Correct:
      // if (!(key in obj)) {
      //   console.log("Correct negation");
      // }

      "no-useless-call": "error", // Disallow unnecessary use of `.call()` and `.apply()`.
      // ❌ Incorrect:
      // function greet() {
      //   console.log(this.name);
      // }
      // greet.call();

      // ✅ Correct:
      // function greet() {
      //   console.log(this.name);
      // }
      // greet();

      "no-useless-computed-key": "error", // Disallow unnecessary computed keys in objects.
      // ❌ Incorrect:
      // let obj = { ["key"]: "value" };

      // ✅ Correct:
      // let obj = { key: "value" };

      "no-useless-constructor": "error", // Disallow unnecessary constructors.
      // ❌ Incorrect:
      // class Example {
      //   constructor() {}
      // }

      // ✅ Correct:
      // class Example {}

      // "no-useless-escape": "error", // Disallow unnecessary escape characters.
      // ❌ Incorrect:
      // let str = "Hello, \"world\"!";

      // ✅ Correct:
      // let str = 'Hello, "world"!';

      "no-useless-rename": "error", // Disallow renaming imports, exports, and destructured assignments unnecessarily.
      // ❌ Incorrect:
      // import { myFunc as myFunc } from "module";

      // ✅ Correct:
      // import { myFunc } from "module";

      "no-whitespace-before-property": "error", // Disallow whitespace before property names.
      // ❌ Incorrect:
      // let obj = {};
      // console.log(obj .prop);

      // ✅ Correct:
      // let obj = {};
      // console.log(obj.prop);

      "no-with": "error", // Disallow `with` statements.
      // ❌ Incorrect:
      // with (obj) {
      //   console.log(prop);
      // }

      // ✅ Correct:
      // console.log(obj.prop);

      // "object-property-newline": "error", // Enforce consistent line breaks between object properties.
      // ❌ Incorrect:
      // let obj = { a: 1, b: 2, c: 3 };

      // ✅ Correct:
      // let obj = {
      //   a: 1,
      //   b: 2,
      //   c: 3
      // };

      "padded-blocks": ["error", "never"], // Disallow padding inside blocks.
      // ❌ Incorrect:
      // function test() {
      //
      //   console.log("Hello");
      //
      // }

      // ✅ Correct:
      // function test() {
      //   console.log("Hello");
      // }

      "rest-spread-spacing": ["error", "never"], // Disallow spaces between spread/rest operators and their expressions.
      // ❌ Incorrect:
      // let arr = [... numbers];

      // ✅ Correct:
      // let arr = [...numbers];

      "semi-spacing": ["error", { before: false, after: true }], // Enforce spacing around semicolons.
      // ❌ Incorrect:
      // let a = 1 ;console.log(a);

      // ✅ Correct:
      // let a = 1; console.log(a);

      "space-before-blocks": "error", // Require a space before blocks.
      // ❌ Incorrect:
      // if (true){
      //   console.log("Hello");
      // }

      // ✅ Correct:
      // if (true) {
      //   console.log("Hello");
      // }

      "space-in-parens": ["error", "never"], // Disallow spaces inside parentheses.
      // ❌ Incorrect:
      // function test( a, b ) {
      //   return ( a + b );
      // }

      // ✅ Correct:
      // function test(a, b) {
      //   return (a + b);
      // }

      "space-unary-ops": "error", // Enforce spacing around unary operators.
      // ❌ Incorrect:
      // let a = - 1;
      // let b = ! 1;

      // ✅ Correct:
      // let a = -1;
      // let b = !1;

      "spaced-comment": ["error", "always"], // Require a space after comment markers.
      // ❌ Incorrect:
      // //No space here
      // /*Another bad example*/

      // ✅ Correct:
      // // Correct comment
      // /* Properly spaced comment */

      "object-curly-spacing": ["error", "always"], // Enforce consistent spacing inside object literals.
      // ❌ Incorrect:
      // let obj = {a: 1,b: 2,c: 3 };

      // ✅ Correct:
      // let obj = { a: 1, b: 2, c: 3 };

      "template-curly-spacing": ["error", "never"], // Disallow spaces inside template literals.
      // ❌ Incorrect:
      // let str = `Hello, ${ name }!`;

      // ✅ Correct:
      // let str = `Hello, ${name}!`;

      "use-isnan": "error", // Require `isNaN()` when checking for `NaN`.
      // ❌ Incorrect:
      // if (x === NaN) {
      //   console.log("Not a number");
      // }

      // ✅ Correct:
      // if (isNaN(x)) {
      //   console.log("Not a number");
      // }

      "valid-typeof": "error", // Require valid string literals when using `typeof`.
      // ❌ Incorrect:
      // if (typeof x === "undefined") {
      //   console.log("Wrong type check");
      // }

      // ✅ Correct:
      // if (typeof x === "undefined") {
      //   console.log("Correct type check");
      // }

      "wrap-iife": ["error", "any"], // Require parentheses around IIFEs.
      // ❌ Incorrect:
      // function() { console.log("Hello"); }();

      // ✅ Correct:
      // (function() { console.log("Hello"); })();

      "yield-star-spacing": ["error", { before: true, after: false }], // Enforce spacing around `yield*`.
      // ❌ Incorrect:
      // function* generator() {
      //   yield * value;
      // }

      // ✅ Correct:
      // function* generator() {
      //   yield* value;
      // }

      yoda: ["error", "never"], // Disallow Yoda conditions.
      // ❌ Incorrect:
      // if (42 === x) {
      //   console.log("Yoda condition");
      // }

      // ✅ Correct:
      // if (x === 42) {
      //   console.log("Normal condition");
      // }

      semi: ["error", "always"], // Disallow semicolons.
      // ❌ Incorrect:
      // let a = 1

      // ✅ Correct:
      // let a = 1;

      "no-unexpected-multiline": "error" // Prevent unexpected multiline expressions.
      // ❌ Incorrect:
      // let a = b
      // (1 + 1).toString()

      // ✅ Correct:
      // let a = b;
      // (1 + 1).toString();
    },
    settings: {
      "import/resolver": {
        node: {
          extensions: [".js", ".mjs", ".jsx", ".ts", ".tsx"]
        }
      }
    }
  }
];
