#!/bin/sh
# Assembles the GitHub Pages site (.github/workflows/pages.yml) from this checkout: the reference app (example/),
# the styleguide, the Motion Lab and the views page on top of dist/, laid out as in the repository, so every
# relative link works as it does from disk. The root page forwards to the reference app.
#
#   sh scripts/site.sh [dest]      dest defaults to _site (gitignored); it must not exist or be empty
#
# Preview the result over http, e.g. python3 -m http.server -d _site (from disk the pages work as well).
set -eu

root=$(cd "$(dirname "$0")/.." && pwd)
dest=${1:-_site}

if [ -e "$dest" ] && [ -n "$(ls -A "$dest" 2>/dev/null)" ]; then
  echo "site.sh: $dest exists and is not empty; remove it first" >&2
  exit 1
fi
mkdir -p "$dest"

# dist/ is what the pages load; the styleguide links to README.md, docs/ and themes/ (shown as plain text).
for path in dist example styleguide themes docs README.md LICENSE; do
  cp -R "$root/$path" "$dest/"
done

cat > "$dest/index.html" <<'HTML'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dashboard-Style</title>
<meta http-equiv="refresh" content="0; url=example/">
<link rel="canonical" href="example/">
</head>
<body>
<p><a href="example/">The reference app</a> · <a href="styleguide/index.html">Styleguide</a> ·
<a href="styleguide/motion.html">Motion Lab</a> · <a href="https://github.com/saschazesiger/Dashboard-Style">Source</a></p>
</body>
</html>
HTML

echo "site.sh: wrote $dest"
