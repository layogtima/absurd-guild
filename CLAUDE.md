1. after creating new pages or endpoints remember to edit the file at app/routes.ts
2. the current version of react router (v7) being used here does have a `json` function exported. when return things from a loader, just use a plain object. no need to wrap it in `json()`

## Progressive Enhancement Patterns

### UI State Management
- Use URL params instead of React state: `searchParams.get("edit") === "true"`
- Benefits: bookmarkable, works without JS, browser navigation

### Form Patterns
- **Links** for UI state (show/hide): `<Link to="?edit=true">Edit</Link>`
- **POST forms** for data mutations only
- Actions handle data changes, not UI state

### Messages
- Success/error via URL: `redirect("/page?success=Updated")`
- Add dismiss links: `<Link to="/page">✕</Link>`

### HTTP Methods
- **GET**: data retrieval, UI state, navigation
- **POST**: create/update/delete data

### Quick Example
```tsx
// Component
const editing = searchParams.get("edit") === "true";
const success = searchParams.get("success");

return (
  <div>
    {success && <div>{success} <Link to="/page">✕</Link></div>}

    {editing ? (
      <Link to="/page">Cancel</Link>
    ) : (
      <Link to="?edit=true">Edit</Link>
    )}

    {editing && (
      <Form method="post">
        <input type="hidden" name="_action" value="update" />
        <input name="field" defaultValue={data.field} />
        <button type="submit">Save</button>
      </Form>
    )}
  </div>
);

// Action
export async function action({ request }) {
  const formData = await request.formData();
  const action = formData.get("_action");

  if (action === "update") {
    await updateData(formData);
    return redirect("/page?success=Updated");
  }

  return { error: "Invalid action" };
}
```
