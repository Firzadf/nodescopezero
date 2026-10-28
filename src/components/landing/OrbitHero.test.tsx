// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OrbitHero from './OrbitHero';
import { ANCHORED_REPORTS, REGISTRY_CONTRACT } from '../../utils/siteConstants';

function mockReducedMotion(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList) as typeof window.matchMedia;
}

describe('OrbitHero', () => {
  afterEach(() => {
    cleanup();
  });
  it('renders one verify link per anchored report, from the shared anchor list', () => {
    mockReducedMotion(true);
    render(<OrbitHero />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(ANCHORED_REPORTS.length);
    ANCHORED_REPORTS.forEach((anchor, index) => {
      const href = (links[index] as HTMLAnchorElement).getAttribute('href') ?? '';
      expect(href).toContain(anchor.hash);
      expect(href).toContain(anchor.tx);
      expect(href).toContain(REGISTRY_CONTRACT);
      expect(href.startsWith('/verify?')).toBe(true);
    });
  });

  it('names the registry core with its truncated address', () => {
    mockReducedMotion(true);
    render(<OrbitHero />);
    expect(screen.getByText('Registry')).toBeTruthy();
    const truncated = `${REGISTRY_CONTRACT.slice(0, 6)}…${REGISTRY_CONTRACT.slice(-4)}`;
    expect(screen.getByText(truncated)).toBeTruthy();
  });

  it('renders and unmounts cleanly with motion allowed', () => {
    mockReducedMotion(false);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
    const { unmount } = render(<OrbitHero />);
    expect(screen.getByTestId('orbit-stage')).toBeTruthy();
    unmount();
    vi.restoreAllMocks();
  });
});
