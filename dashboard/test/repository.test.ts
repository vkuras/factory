import { describe, expect, it } from 'vitest';
import { repositoryLabel, repositoryView, showRepository } from '../src/domain/repository.js';

// T-REPO-1: the label derivation of design §R3.
describe('repository label', () => {
  it('a single repository is shown under its last segment', () => {
    expect(repositoryLabel('github.com/vkuras/factory', ['github.com/vkuras/factory'])).toBe('factory');
  });
  it('a key that is a bare directory name is that name', () => {
    expect(repositoryLabel('factory', ['factory'])).toBe('factory');
  });
  it('two repositories with different names use their names', () => {
    const keys = ['github.com/vkuras/factory', 'github.com/vkuras/shop'];
    expect(repositoryLabel(keys[0]!, keys)).toBe('factory');
    expect(repositoryLabel(keys[1]!, keys)).toBe('shop');
  });
  it('a colliding last segment becomes owner/repo', () => {
    const keys = ['github.com/vkuras/factory', 'github.com/acme/factory'];
    expect(repositoryLabel(keys[0]!, keys)).toBe('vkuras/factory');
    expect(repositoryLabel(keys[1]!, keys)).toBe('acme/factory');
  });
  it('a colliding owner/repo becomes the full key', () => {
    const keys = ['github.com/acme/factory', 'gitlab.com/acme/factory'];
    expect(repositoryLabel(keys[0]!, keys)).toBe('github.com/acme/factory');
    expect(repositoryLabel(keys[1]!, keys)).toBe('gitlab.com/acme/factory');
  });
  it('gives the same ticket the same label every time it asks (one view per request)', () => {
    const view = repositoryView(['github.com/vkuras/factory', 'github.com/acme/factory']);
    expect(view.labelOf('github.com/vkuras/factory')).toBe(view.labelOf('github.com/vkuras/factory'));
    expect(view.show).toBe(true);
  });
});

describe('when the repository is shown (R3, D17)', () => {
  it('not while one repository has reported, for good from two on', () => {
    expect(showRepository(0)).toBe(false);
    expect(showRepository(1)).toBe(false);
    expect(showRepository(2)).toBe(true);
    expect(showRepository(5)).toBe(true);
  });
  it('a repeated key is one repository', () => {
    expect(repositoryView(['a/b/c', 'a/b/c']).show).toBe(false);
  });
});
