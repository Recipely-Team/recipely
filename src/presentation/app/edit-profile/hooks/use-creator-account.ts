import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { StoreStatus } from '@application/store/store-status';
import type { Failure } from '@core/failure';
import { CharConstants } from '@core/constants';
import { CreatorHandle } from '@domain/creators/creator-handle';
import { CreatorPlatform, type CreatorPlatformType } from '@domain/creators/creator-platform';
import { useStores } from '@presentation/bootstrap/use-stores';
import { failureKeyMessage, failureToastMessage } from '@presentation/base/errors/failure-lookups';
import { showErrorToast } from '@presentation/base/feedback/show-toast';
import { CreatorAccountStep } from '@presentation/app/edit-profile/model/creator-account-step';
import type { CreatorAccountView } from '@presentation/app/edit-profile/model/creator-account-view';
import type { UseCreatorAccountResult } from '@presentation/app/edit-profile/model/use-creator-account-result';

/**
 * Orchestrates Edit Profile's creator section over the signed-in user's claim.
 *
 * @remarks
 * - **The claim decides the face.** No claim is the form; a pending, approved
 *   or refused claim is its card — until Change or Edit and resend opens the
 *   form on it, prefilled.
 * - **Re-reads the claim on every focus**, so an admin's decision shows the
 *   next time the user opens this page, without signing in again — but not
 *   while a send or remove is in flight; the auth store drops a refresh that
 *   one overtook.
 * - **One action at a time**, guarded by a ref: `isBusy` is render state and
 *   a second tap in the same frame still sees `false`.
 * - **Sends the handle normalised** (`CreatorHandle.normalize`: no `@`, lower
 *   case), and a refusal is shown under the field in the words its key has.
 */
export const useCreatorAccount = (): UseCreatorAccountResult => {
  const { authStore } = useStores();
  const claim = authStore((s) => (s.state.status === StoreStatus.Authenticated ? s.state.session.user.creatorClaim : null));
  const requestCreatorTag = authStore((s) => s.requestCreatorTag);
  const removeCreatorTag = authStore((s) => s.removeCreatorTag);
  const refreshCreatorClaim = authStore((s) => s.refreshCreatorClaim);

  const [isEditing, setEditing] = useState(false);
  const [platform, setPlatform] = useState<CreatorPlatformType>(CreatorPlatform.Instagram);
  const [handle, setHandle] = useState<string>(CharConstants.empty);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setBusy] = useState(false);
  // The guard itself: render state lags a second tap in the same frame.
  const busyRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!busyRef.current) void refreshCreatorClaim();
    }, [refreshCreatorClaim]),
  );

  const run = async (action: () => Promise<Failure | null>, onFailure: (failure: Failure) => void): Promise<boolean> => {
    busyRef.current = true;
    setBusy(true);
    try {
      const failure = await action();
      if (failure !== null) onFailure(failure);
      return failure === null;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const view: CreatorAccountView =
    claim === null || isEditing
      ? { step: CreatorAccountStep.Form, platform, handle, error, canCancel: claim !== null }
      : claim.isPending
        ? { step: CreatorAccountStep.Pending, tag: claim.tag }
        : claim.isApproved
          ? { step: CreatorAccountStep.Approved, tag: claim.tag }
          : { step: CreatorAccountStep.Rejected, tag: claim.tag };

  return {
    view,
    isBusy,
    onPickPlatform: (next) => {
      setPlatform(next);
      setError(null);
    },
    onChangeHandle: (value) => {
      setHandle(value);
      setError(null);
    },
    onSubmit: () => {
      if (busyRef.current) return;
      const input = { platform, handle: CreatorHandle.normalize(handle) };
      void run(
        () => requestCreatorTag(input),
        (failure) => setError(failureKeyMessage(failure) ?? failureToastMessage(failure)),
      ).then((sent) => {
        if (sent) setEditing(false);
      });
    },
    onEdit: () => {
      if (claim === null) return;
      setPlatform(claim.tag.platform);
      setHandle(claim.tag.handle);
      setError(null);
      setEditing(true);
    },
    onCancelEdit: () => {
      setEditing(false);
      setError(null);
    },
    onRemove: () => {
      if (busyRef.current) return;
      void run(removeCreatorTag, (failure) => void showErrorToast(failure));
    },
  };
};
