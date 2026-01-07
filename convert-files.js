// Conversion helper script
// This file contains patterns to convert TypeScript to JavaScript

/*
CONVERSION PATTERNS:

1. Remove type annotations:
   - `const name: string` → `const name`
   - `function func(param: Type): ReturnType` → `function func(param)`
   - `const Component: React.FC<Props>` → `const Component`

2. Remove interfaces:
   - Delete all `interface Name { ... }` blocks

3. Remove type assertions:
   - `data as Type` → `data`
   - `user as User` → `user`

4. Update imports:
   - Keep imports the same, but remove .ts/.tsx extensions if present
   - `import { UserRole } from '../types'` stays the same (types.js exports UserRole)

5. Error handling:
   - `catch (err: any)` → `catch (err)`

6. React components:
   - `const Component: React.FC<Props> = ({ prop }) => {}` → `const Component = ({ prop }) => {}`
   - Remove `React.FC` and type parameters

7. Remove optional type parameters:
   - `function func<T>() {}` → `function func() {}`

8. Keep all logic, just remove types!

EXAMPLE CONVERSION:

// BEFORE (TypeScript):
interface Props {
  name: string;
  age?: number;
}

const Component: React.FC<Props> = ({ name, age }) => {
  const data: string = name;
  return <div>{data}</div>;
};

// AFTER (JavaScript):
const Component = ({ name, age }) => {
  const data = name;
  return <div>{data}</div>;
};
*/

console.log('Use this as a reference for manual conversion');

