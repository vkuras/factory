#!/usr/bin/env bash
# Build the two working copies for eval 5 from the coord-validated seed, each
# with its own bare remote, so a push in one run cannot be seen by the other.
#
# The clone leaves behind the seed's upstream tracking. Left in place it tells
# the run that the feature branch is already on the remote, which is the one
# fact this eval is about - so the tracking is cleared before the real remote
# is attached, and only main is pushed.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(cd "$here/.." && pwd)"
seed="$root/.factory-evals/seeds/coord-validated"
dest="$here/iteration-3-sonnet/eval-5-merge-request"

for run in with_skill without_skill; do
  repo="$dest/$run/repo"
  remote="$dest/$run/remote.git"
  rm -rf "$repo" "$remote"
  mkdir -p "$dest/$run"

  git init --quiet --bare -b main "$remote"
  git clone --quiet "$seed" "$repo"
  git -C "$repo" show-ref --quiet --verify refs/heads/main || \
    git -C "$repo" branch --quiet main origin/main
  git -C "$repo" remote remove origin
  for branch in $(git -C "$repo" for-each-ref --format='%(refname:lstrip=2)' refs/heads); do
    git -C "$repo" branch --quiet --unset-upstream "$branch" 2>/dev/null || true
  done

  git -C "$repo" remote add origin "$remote"
  git -C "$repo" push --quiet origin main
  git -C "$repo" checkout --quiet feature/002-ablauf-erinnerungen

  echo "$run: on $(git -C "$repo" rev-parse --abbrev-ref HEAD), upstream '$(git -C "$repo" rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null || echo none)', remote has $(git -C "$remote" for-each-ref --format='%(refname:lstrip=2)' refs/heads | tr '\n' ' ')"
done
