import { CampaignLineup } from '@domain/campaigns/campaign-lineup';
import type { LaunchCampaign } from '@domain/campaigns/launch-campaign';

const NOW = Date.parse('2027-02-10T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

const campaign = (id: string, overrides: Partial<LaunchCampaign> = {}): LaunchCampaign => ({
  id,
  variant: 'splash',
  art: 'crescent',
  colorStart: '#0B1437',
  colorEnd: '#3730A3',
  imageUrl: null,
  title: `Campaign ${id}`,
  body: '',
  ctaLabel: null,
  ctaLink: null,
  startsAtMs: NOW - DAY,
  endsAtMs: NOW + DAY,
  priority: 0,
  ...overrides,
});

describe('CampaignLineup', () => {
  it('shows nothing when the device holds no campaign', () => {
    expect(CampaignLineup.of([]).pickAt(NOW, new Set())).toBeNull();
  });

  it('skips a campaign that has not opened yet or has already closed', () => {
    const lineup = CampaignLineup.of([
      campaign('tomorrow', { startsAtMs: NOW + DAY, endsAtMs: NOW + 2 * DAY }),
      campaign('yesterday', { startsAtMs: NOW - 2 * DAY, endsAtMs: NOW }),
    ]);
    expect(lineup.pickAt(NOW, new Set())).toBeNull();
  });

  it('never shows a dialog this device has already seen', () => {
    expect(CampaignLineup.of([campaign('a', { variant: 'dialog' })]).pickAt(NOW, new Set(['a']))).toBeNull();
  });

  // Reported: the splash showed once and never again, so it was easy to miss entirely.
  it('shows a splash on every launch while its window is open, seen or not', () => {
    expect(CampaignLineup.of([campaign('a')]).pickAt(NOW, new Set(['a']))?.id).toBe('a');
    expect(CampaignLineup.of([campaign('a', { endsAtMs: NOW })]).pickAt(NOW, new Set())).toBeNull();
  });

  it('shows one at a time: highest priority, then the one that opened first', () => {
    const lineup = CampaignLineup.of([
      campaign('late', { variant: 'dialog', startsAtMs: NOW - DAY / 2 }),
      campaign('early', { variant: 'dialog', startsAtMs: NOW - DAY }),
      campaign('urgent', { variant: 'dialog', priority: 3, startsAtMs: NOW - DAY / 4 }),
    ]);
    expect(lineup.pickAt(NOW, new Set())?.id).toBe('urgent');
    expect(lineup.pickAt(NOW, new Set(['urgent']))?.id).toBe('early');
  });
});
