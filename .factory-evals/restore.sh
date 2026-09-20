#!/usr/bin/env bash
# Rebuild the seed repositories from the committed bundles.
#
# The seeds are git repositories themselves: the validator reads their history,
# their branch names and the commits an earlier round left behind. Git cannot
# track a repository inside a repository, so each seed travels as a bundle -
# one file holding every ref and the full history - and is cloned back here.
#
# Run this after a fresh clone, or whenever a seed needs to go back to its
# pristine state after an eval run has written to it.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$here/seeds"

for bundle in "$here"/bundles/*.bundle; do
  name="$(basename "$bundle" .bundle)"
  target="$here/seeds/$name"
  rm -rf "$target"
  git clone --quiet "$bundle" "$target"
  # A clone checks out HEAD only, so every other branch would be lost with the
  # origin. Some seeds need them: a merge request needs its target branch.
  for branch in $(git -C "$target" for-each-ref --format='%(refname:lstrip=3)' 'refs/remotes/origin/*'); do
    [ "$branch" = "HEAD" ] && continue
    git -C "$target" show-ref --quiet --verify "refs/heads/$branch" || \
      git -C "$target" branch --quiet "$branch" "origin/$branch"
  done
  git -C "$target" remote remove origin
  echo "$name -> $(git -C "$target" rev-parse --abbrev-ref HEAD) @ $(git -C "$target" rev-parse --short HEAD)"
done
