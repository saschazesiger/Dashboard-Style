#!/usr/bin/env sh
# Copies a Dashboard-Style build (dist/) into a project directory and records
# exactly which commit it is, so the copy can be verified later.
#
#   vendor.sh <dest>                download the latest main from GitHub
#   vendor.sh <ref> <dest>          download a branch, tag or commit instead
#   vendor.sh --from <path> <dest>  copy from a local checkout
#   vendor.sh --check <dest>        verify a vendored copy (exit 1 on mismatch)
#
# <dest> receives the files of dist/ plus VERSION (version, source, commit)
# and SHA256SUMS (every file in <dest>). <dest> is replaced as a whole and
# must be missing, empty or an earlier vendored copy. Needs curl or wget,
# tar and sha256sum or shasum. Windows: scripts/vendor.ps1.
set -eu

REPO="saschazesiger/Dashboard-Style"

die() { echo "vendor.sh: $*" >&2; exit 1; }

usage() {
  sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'
  exit 2
}

sha256() {
  if command -v sha256sum >/dev/null 2>&1; then sha256sum "$@"
  elif command -v shasum >/dev/null 2>&1; then shasum -a 256 "$@"
  else die "needs sha256sum or shasum"; fi
}

# Writes "<hash>  <path>" lines for every file below the current directory
# except SHA256SUMS, sorted by path (byte order, like the build).
sums() {
  find . -type f ! -name SHA256SUMS | sed 's|^\./||' | LC_ALL=C sort | while IFS= read -r file; do
    sha256 "$file"
  done
}

# Verifies <dir>/SHA256SUMS: every listed file matches, nothing is missing,
# nothing unlisted was added (a symbolic link neither: the file listing
# cannot see it, so any link fails the check).
check_dir() {
  dir=$1
  [ -f "$dir/SHA256SUMS" ] || die "$dir/SHA256SUMS not found"
  links=$(cd "$dir" && find . -type l | sed 's|^\./||' | LC_ALL=C sort)
  if [ -n "$links" ]; then
    echo "vendor.sh: $dir contains symbolic links, which SHA256SUMS cannot cover:" >&2
    printf '%s\n' "$links" >&2
    return 1
  fi
  expected=$(cd "$dir" && tr -d '\r' < SHA256SUMS)
  actual=$(cd "$dir" && sums)
  if [ "$expected" != "$actual" ]; then
    echo "vendor.sh: $dir does not match its SHA256SUMS:" >&2
    printf '%s\n' "$expected" > "${TMPDIR:-/tmp}/ds-expected.$$"
    printf '%s\n' "$actual" > "${TMPDIR:-/tmp}/ds-actual.$$"
    diff "${TMPDIR:-/tmp}/ds-expected.$$" "${TMPDIR:-/tmp}/ds-actual.$$" >&2 || true
    rm -f "${TMPDIR:-/tmp}/ds-expected.$$" "${TMPDIR:-/tmp}/ds-actual.$$"
    return 1
  fi
}

# Whether <dir> is a copy this script wrote: VERSION starts with "version "
# and SHA256SUMS lists ds.css. Anything else is never deleted.
is_vendored() {
  [ -f "$1/VERSION" ] && [ -f "$1/SHA256SUMS" ] &&
    head -n 1 "$1/VERSION" | grep -q '^version ' &&
    tr -d '\r' < "$1/SHA256SUMS" | grep -q '^[0-9a-f]\{64\}  ds\.css$'
}

# Version from a checkout's package.json (no node needed).
version_of() {
  sed -n 's/^[[:space:]]*"version":[[:space:]]*"\([^"]*\)".*/\1/p' "$1/package.json" | head -n 1
}

install_dist() {
  src=$1 dest=$2 version=$3 source=$4 commit=$5
  [ -f "$src/dist/ds.css" ] || die "$src/dist/ds.css not found (build it with npm run build)"
  check_dir "$src/dist" || die "$src/dist does not match its own SHA256SUMS (rebuild it)"
  if [ -e "$dest" ] && { [ ! -d "$dest" ] || [ -n "$(ls -A "$dest" 2>/dev/null)" ]; } && ! is_vendored "$dest"; then
    die "$dest exists and is not a vendored copy (no VERSION, or SHA256SUMS without ds.css); refusing to replace it"
  fi
  rm -rf "$dest"
  mkdir -p "$dest"
  (cd "$src/dist" && tar cf - .) | (cd "$dest" && tar xf -)
  printf 'version %s\nsource %s\ncommit %s\n' "$version" "$source" "$commit" > "$dest/VERSION"
  list=$(cd "$dest" && sums)
  printf '%s\n' "$list" > "$dest/SHA256SUMS"
  echo "Vendored Dashboard-Style $version into $dest"
}

[ $# -ge 1 ] || usage

# Prints <url> to stdout with curl or wget; <accept> is an optional Accept header.
fetch() {
  url=$1 accept=${2:-*/*}
  if command -v curl >/dev/null 2>&1; then curl -fsSL -H "Accept: $accept" "$url"
  elif command -v wget >/dev/null 2>&1; then wget -q --header="Accept: $accept" -O - "$url"
  else die "needs curl or wget"; fi
}

case $1 in
  --check)
    [ $# -eq 2 ] || usage
    check_dir "$2" || exit 1
    echo "$2 matches its SHA256SUMS ($(sed -n 's/^version //p' "$2/VERSION" 2>/dev/null))"
    ;;
  --from)
    [ $# -eq 3 ] || usage
    src=$(cd "$2" && pwd -P) || die "no such directory: $2"
    version=$(version_of "$src")
    [ -n "$version" ] || die "no version in $src/package.json"
    commit=none
    # Only the checkout's own repository counts, not one it happens to sit in.
    # A plain copy (an unpacked archive) keeps its version, commit "none".
    top=$(git -C "$src" rev-parse --show-toplevel 2>/dev/null || true)
    if [ -n "$top" ] && [ "$(cd "$top" && pwd -P)" = "$src" ]; then
      if git -C "$src" rev-parse --verify -q HEAD >/dev/null 2>&1; then
        commit=$(git -C "$src" rev-parse HEAD)
        if [ -n "$(git -C "$src" status --porcelain 2>/dev/null)" ]; then commit="$commit-modified"; fi
      else
        version="$version-dev"
      fi
    fi
    install_dist "$src" "$3" "$version" "local" "$commit"
    ;;
  -*)
    usage
    ;;
  *)
    case $# in
      1) ref=main dest=$1 ;;
      2) ref=$1 dest=$2 ;;
      *) usage ;;
    esac
    # Resolve the ref to a commit first and download that commit, so VERSION
    # names exactly what was copied even if main moves in between.
    commit=$(fetch "https://api.github.com/repos/$REPO/commits/$ref" application/vnd.github.sha) ||
      die "cannot resolve $ref on github.com/$REPO"
    printf '%s' "$commit" | grep -q '^[0-9a-f]\{40\}$' || die "unexpected answer resolving $ref: $commit"
    work=$(mktemp -d)
    trap 'rm -rf "$work"' EXIT
    url="https://github.com/$REPO/archive/$commit.tar.gz"
    fetch "$url" > "$work/src.tar.gz" || die "download failed: $url"
    mkdir "$work/src"
    tar xzf "$work/src.tar.gz" -C "$work/src" --strip-components 1
    version=$(version_of "$work/src")
    install_dist "$work/src" "$dest" "$version" "github:$REPO@$ref" "$commit"
    ;;
esac
