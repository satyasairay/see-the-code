# Additional Examples

This directory contains additional example components demonstrating various selector patterns.

## Examples

### `react-component.jsx`
A React component showcasing:
- Multiple CSS classes
- Dynamic class names with conditional logic
- ID selectors with template literals
- Data attributes (`data-testid`, `data-action`, `data-product-id`)
- Nested element selectors
- Form inputs and buttons

**Usage:**
```bash
# Generate code map for this example
node cli/generate.js --input demo/examples/react-component.jsx --output demo/examples/code-map.json
```

### `vue-component.vue`
A Vue single-file component demonstrating:
- Vue template syntax with selectors
- Dynamic attributes (`:id`, `:data-user-id`)
- Class bindings
- Event handlers with data attributes

**Note:** Vue components require a Vue parser (not yet implemented in the CLI). This example is for reference.

## Running Examples

1. Generate code map:
   ```bash
   node cli/generate.js --input demo/examples --output demo/examples/code-map.json
   ```

2. Serve the examples:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server -p 8000
   ```

3. Inject the overlay (in browser console):
   ```javascript
   window.SeeTheCodeConfig = {
     codeMapUrl: './examples/code-map.json',
     workspaceRoot: '/path/to/SeeTheCode'
   };
   const script = document.createElement('script');
   script.src = '../overlay/inject.js';
   document.head.appendChild(script);
   ```

