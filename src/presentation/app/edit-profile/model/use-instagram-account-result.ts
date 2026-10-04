import type { InstagramConnection } from '@domain/instagram/connect/instagram-connection';
import type { InstagramConnectPhaseType } from '@presentation/base/widgets/instagram/instagram-connect-phase';

/** View model returned by {@link useInstagramAccount} for the creator card's Instagram row. */
export interface UseInstagramAccountResult {
  connection: InstagramConnection;
  phase: InstagramConnectPhaseType;
  connect: () => void;
  isDisconnectOpen: boolean;
  isDisconnecting: boolean;
  openDisconnect: () => void;
  closeDisconnect: () => void;
  confirmDisconnect: () => void;
  openAutomations: () => void;
}
