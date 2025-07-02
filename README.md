# Custom Angular WYSIWYG Editor

A feature-rich WYSIWYG editor built with Angular, supporting:
- Rich text formatting (bold, italic, underline, lists, headings, blockquote, undo/redo)
- Table and image insertion (with base64 encoding and resizing)
- Thymeleaf variable support (with styled tokens and attribute selection)
- Live preview with JSON payload substitution

## Features

- **Toolbar**: Bold, Italic, Underline, Strikethrough, Lists, Headings, Blockquote, Undo/Redo
- **Table Insertion**: Visual grid selector, Tab navigation, auto-row creation
- **Image Insertion**: Upload, base64 encoding, drag-to-resize, alignment, and removal
- **Thymeleaf Variables**: Highlight text, convert to variable with attribute dropdown, styled tokens
- **Raw HTML View**: Pretty-printed, full HTML with `<html>` and `<body>` tags
- **JSON Preview**: Paste JSON, preview template with variables replaced by values

## Usage

1. **Start the App**
   ```bash
   ng serve
   ```
   Visit `http://localhost:4200` in your browser.

2. **Editing**
   - Use the toolbar for formatting, inserting tables/images, and Thymeleaf variables.
   - Highlight text and click the "TL" button to convert to a Thymeleaf variable. Choose the attribute and enter the variable name.
   - Insert images (base64) and resize with the handle at the bottom-right.
   - Insert tables with the grid selector and use Tab to navigate/add rows.

3. **Raw HTML**
   - Toggle code view to see and edit the raw HTML, always wrapped in `<html><body>...</body></html>`.
   - View a pretty-printed version in the "Raw HTML Output" section.

4. **JSON Preview**
   - Paste a JSON payload in the provided textarea.
   - Click "Preview" to see the template with Thymeleaf variables replaced by values from the JSON.

## Customization
- Add more toolbar buttons or features as needed.
- Extend Thymeleaf variable support for more attributes or custom logic.
- Style the editor and tokens via CSS.

## Example JSON
```json
{
  "user": {
    "name": "Alice",
    "email": "alice@example.com"
  },
  "order": {
    "id": 12345,
    "total": 99.99
  }
}
```

## License
MIT
