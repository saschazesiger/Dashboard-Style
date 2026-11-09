# React for the browser tests

A pinned, dev-only copy of React 18 for `test/browser/react.spec.js`, which mounts the React adapter (`dist/react/`)
under `StrictMode`. It is not an npm dependency and never ships: `dist/react/` imports `react` as a peer the project
brings.

| File | What |
|---|---|
| `react.development.js` | `react@18.3.1`, `umd/react.development.js`, unchanged |
| `react-dom.development.js` | `react-dom@18.3.1`, `umd/react-dom.development.js`, unchanged |
| `LICENSE` | the MIT licence of both packages (the same file in each), unchanged |
| `react.js`, `react-dom-client.js` | ours: the bare specifiers `react` and `react-dom/client` as ES modules over the UMD globals (the fixture's import map) |

The development builds are the ones that run `StrictMode`'s double effects, which the specs rely on.

## Where the files come from

`npm pack react@18.3.1 react-dom@18.3.1` from the npm registry, in an empty folder. The tarballs match the registry's
published integrity (`npm view <package>@18.3.1 dist.integrity`, checked again with
`openssl dgst -sha512 -binary <tgz> | base64`):

| Tarball | sha512 (registry `dist.integrity`) |
|---|---|
| `react-18.3.1.tgz` | `wS+hAgJShR0KhEvPJArfuPVN1+Hz1t0Y6n5jLrGQbkb4urgPE/0Rve+1kMB1v/oWgHgm4WIcV+i7F2pTVj+2iQ==` |
| `react-dom-18.3.1.tgz` | `5m4nQKp+rZRb09LNH59GM4BxTh9251/ylbKIbpe7TpGxfJ+9kv6BLkLBXIjjspbgbnIBNqlI23tRnTWT0snUIw==` |

The copied files, as committed:

| File | sha256 |
|---|---|
| `react.development.js` | `28348fef6cb0ed8b2ceeb22deaf824428fd13875d84c73d38f77dd216fc24e7f` |
| `react-dom.development.js` | `f9044a5e9c39db8bb1a204dff924e526ec0a621e695bb69de1035811be8709e4` |

`test/react.test.js` checks these sums, so a changed copy fails. To move to another version, repeat the steps with
it and update both tables and the test.
