1. after creating new pages or endpoints remember to edit the file at app/routes.ts
2. the current version of react router (v7) being used here does have a `json` function exported. when return things from a loader, just use a plain object. no need to wrap it in `json()`
