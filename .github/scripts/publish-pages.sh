#!/usr/bin/env bash
set -euo pipefail

dist=$(realpath "$1")
subdir="${2:-}"
branch=gh-pages
work=$(mktemp -d)
trap 'git worktree remove --force "$work" 2>/dev/null || true; rm -rf "$work"' EXIT

git fetch origin "$branch" 2>/dev/null || true
if git rev-parse --verify --quiet "origin/$branch" >/dev/null; then
  git worktree add -B "$branch" "$work" "origin/$branch" >/dev/null
else
  git worktree add --detach "$work" >/dev/null
  git -C "$work" checkout --orphan "$branch" >/dev/null 2>&1
  git -C "$work" rm -rf --quiet . 2>/dev/null || true
fi

if [ -z "$subdir" ]; then
  find "$work" -mindepth 1 -maxdepth 1 ! -name .git ! -name staging -exec rm -rf {} +
  cp -a "$dist"/. "$work"/
else
  rm -rf "${work:?}/$subdir"
  mkdir -p "$work/$subdir"
  cp -a "$dist"/. "$work/$subdir"/
fi
touch "$work/.nojekyll"

git -C "$work" add -A
if git -C "$work" diff --cached --quiet; then
  echo "Nada a publicar"
  exit 0
fi
git -C "$work" \
  -c user.name="github-actions[bot]" \
  -c user.email="41898282+github-actions[bot]@users.noreply.github.com" \
  commit -q -m "${PUBLISH_MESSAGE:-Publica ${subdir:-prod}}"
git -C "$work" push origin "$branch"
