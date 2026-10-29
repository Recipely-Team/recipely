import type { StoreApi } from 'zustand/vanilla';
import { createStore } from 'zustand/vanilla';
import type { LaunchCampaignStore } from '@application/campaigns/launch-campaign-store-contract';
import { LaunchCampaignStatus } from '@application/campaigns/launch-campaign-status';
import type { PickLaunchCampaignUseCase } from '@application/campaigns/pick-launch-campaign-use-case';
import type { RefreshLaunchCampaignsUseCase } from '@application/campaigns/refresh-launch-campaigns-use-case';
import type { DismissLaunchCampaignUseCase } from '@application/campaigns/dismiss-launch-campaign-use-case';

interface LaunchCampaignStoreDeps {
  pickLaunchCampaign: PickLaunchCampaignUseCase;
  refreshLaunchCampaigns: RefreshLaunchCampaignsUseCase;
  dismissLaunchCampaign: DismissLaunchCampaignUseCase;
}

/**
 * Holds the one launch campaign this app start may show.
 *
 * @remarks
 * - **Never on the startup path.** The pick reads the device cache only; the network refresh
 *   runs after it and only feeds the NEXT launch, so a slow or offline backend changes nothing now.
 * - **Once per process.** Returning to the foreground is not a launch; a second `prepare` is a no-op.
 * - **Seen is remembered on dismissal**, whatever the way out, so a dialog never comes back; a
 *   splash shows on every launch while its window is open (`CampaignLineup`).
 */
export const configureLaunchCampaignStore = (deps: LaunchCampaignStoreDeps): StoreApi<LaunchCampaignStore> => {
  let isPrepared = false;

  return createStore<LaunchCampaignStore>((set, get) => ({
    state: { status: LaunchCampaignStatus.None },
    prepare: async () => {
      if (isPrepared) return;
      isPrepared = true;
      const picked = await deps.pickLaunchCampaign.execute();
      if (picked.ok && picked.value !== null) set({ state: { status: LaunchCampaignStatus.Ready, campaign: picked.value } });
      await deps.refreshLaunchCampaigns.execute();
    },
    dismiss: async () => {
      const { state } = get();
      if (state.status !== LaunchCampaignStatus.Ready) return;
      set({ state: { status: LaunchCampaignStatus.None } });
      await deps.dismissLaunchCampaign.execute(state.campaign.id);
    },
  }));
};
