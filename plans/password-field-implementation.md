# Password Field Implementation for API Key

## Overview
Currently, the API key setting in [`scripts/settings.js`](../scripts/settings.js:47) is displayed as a plain text input field. This plan outlines how to convert it to a password field to hide sensitive API key information.

## Current Implementation
The API key setting is registered at lines 47-54 in [`scripts/settings.js`](../scripts/settings.js:47):

```javascript
game.settings.register(MODULE_ID, 'apiKey', {
  name: 'PF2E_FAKE_ID.Settings.ApiKey.Name',
  hint: 'PF2E_FAKE_ID.Settings.ApiKey.Hint',
  scope: 'world',
  config: true,
  type: String,
  default: '',
});
```

This renders as a standard text input in the settings UI, exposing the API key as visible text.

## Solution Architecture

### Key Foundry VTT APIs
Based on the provided documentation:

1. **SettingConfig.input**: A custom form field input property that accepts a `CustomFormInput` function
2. **CustomFormInput**: A function with signature `(field, config) => HTMLElement | HTMLCollection`
3. **FormInputConfig**: Configuration object passed to the custom input function containing:
   - `name`: Form element name
   - `value`: Current value
   - `disabled`, `readonly`, `required`: Boolean flags
   - `placeholder`: Placeholder text
   - `dataset`, `aria`: Additional attributes
   - `classes`: CSS classes to apply

### Implementation Approach

Add a custom `input` property to the API key setting registration that:

1. Creates an HTML password input element using `document.createElement('input')`
2. Sets the input type to `'password'`
3. Applies all standard attributes from the config object (name, value, placeholder, etc.)
4. Returns the configured input element

## Technical Details

### Custom Input Function Structure

```javascript
input: (field, config) => {
  // Create password input element
  const input = document.createElement('input');
  input.type = 'password';
  
  // Apply standard form configuration
  input.name = config.name;
  input.value = config.value ?? '';
  
  // Apply optional attributes
  if (config.placeholder) input.placeholder = config.placeholder;
  if (config.disabled) input.disabled = true;
  if (config.readonly) input.readOnly = true;
  if (config.required) input.required = true;
  if (config.autofocus) input.autofocus = true;
  
  // Apply CSS classes
  if (config.classes) input.className = config.classes;
  
  // Apply dataset attributes
  if (config.dataset) {
    Object.entries(config.dataset).forEach(([key, value]) => {
      input.dataset[key] = value;
    });
  }
  
  // Apply ARIA attributes
  if (config.aria) {
    Object.entries(config.aria).forEach(([key, value]) => {
      input.setAttribute(`aria-${key}`, value);
    });
  }
  
  return input;
}
```

### Integration Point

The custom input function will be added to the existing `apiKey` setting registration:

```javascript
game.settings.register(MODULE_ID, 'apiKey', {
  name: 'PF2E_FAKE_ID.Settings.ApiKey.Name',
  hint: 'PF2E_FAKE_ID.Settings.ApiKey.Hint',
  scope: 'world',
  config: true,
  type: String,
  default: '',
  input: (field, config) => { /* custom password input */ }
});
```

## Benefits

1. **Security**: API keys are masked with bullets/asterisks instead of plain text
2. **User Experience**: Standard password field behavior (paste still works, can be revealed with browser tools if needed)
3. **Consistency**: Matches user expectations for sensitive credential fields
4. **Minimal Changes**: Only requires modification to the single setting registration

## Implementation Steps

1. ✅ Analyze current implementation
2. ✅ Review Foundry VTT documentation for custom inputs
3. ⏳ Add custom input function to [`apiKey`](../scripts/settings.js:47) setting registration
4. ⏳ Test in Foundry VTT to verify:
   - Password field renders correctly
   - Value is properly saved and retrieved
   - Field appears in settings with proper masking
   - Copy/paste functionality works as expected

## Testing Considerations

- Verify existing API keys still work after the change
- Confirm the password field appears correctly in the Module Settings UI
- Test that the value is properly persisted to the world settings
- Ensure the masked input doesn't break any existing functionality
- Check that the field integrates properly with Foundry's form validation

## Alternative Approach Considered

**Using a DataField with StringField**: Could use `new foundry.fields.StringField()` as the type, but this doesn't provide password masking by itself. The custom input approach is more direct and appropriate for this use case.

## Compatibility

- **Foundry VTT Version**: This implementation uses the `input` property available in V13+ based on the documentation
- **No Breaking Changes**: Existing stored API keys will continue to work
- **Backwards Compatible**: The setting storage format (plain string) remains unchanged
