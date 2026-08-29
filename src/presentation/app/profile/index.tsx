import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ResponsiveContainer } from '@presentation/base/widgets/layout/responsive-container';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, controlSizes } from '@presentation/base/theme';
import { useProfile } from '@presentation/app/profile/hooks/use-profile';
import { FeedbackDialog } from '@presentation/base/widgets/dialogs/feedback-dialog';
import { t } from '@presentation/i18n';
import { ProfileIdentity } from '@presentation/app/profile/body/profile-identity';
import { ProfileStats } from '@presentation/app/profile/body/profile-stats';
import { ProfileActions } from '@presentation/app/profile/body/profile-actions';
import { ProfileSettingsSections } from '@presentation/app/profile/body/profile-settings-sections';
import { CharConstants, ValueConstants } from '@core/constants';
import { useAssistantProfileScreenActions } from '@presentation/app/profile/hooks/use-assistant-profile-screen-actions';
import { useAssistantScrollable } from '@presentation/base/hooks/assistant/actions/use-assistant-scrollable';

export const ProfileScreen = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();
  const { isWebShell } = useLayout();
  const vm = useProfile();

  useAssistantProfileScreenActions({
    displayName: vm.displayName,
    handle: vm.handle,
    bio: vm.bio,
    stats: vm.stats,
    onPickAvatar: vm.onPickAvatar,
    onEditProfile: vm.onEditProfile,
  });
  const scrollable = useAssistantScrollable();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        {...scrollable}
        contentContainerStyle={{
          paddingTop: isWebShell ? ValueConstants.zero : insets.top + spacing.sm,
          // Mobile: the root TabBar (hosted in _layout) sits below the page,
          // so only breathing room is needed; web keeps its former whitespace.
          paddingBottom: isWebShell ? controlSizes.tabBar + spacing.xxl : spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer route="profile" gutter={false}>
          <ProfileIdentity
            displayName={vm.displayName}
            handle={vm.handle}
            bio={vm.bio}
            photoUri={vm.photoUri}
            isUploading={vm.isUploading}
            onPickAvatar={vm.onPickAvatar}
            onAddBio={vm.onEditProfile}
          />

          <ProfileStats stats={vm.stats} />

          <ProfileActions onEditProfile={vm.onEditProfile} />

          <View style={styles.settingsSections}>
            <ProfileSettingsSections />
          </View>
        </ResponsiveContainer>
      </ScrollView>

      <FeedbackDialog
        severity="danger"
        visible={vm.uploadError !== null}
        title={t().errors.genericTitle}
        message={vm.uploadError ?? CharConstants.empty}
        primaryLabel={t().common.ok}
        onPrimary={vm.onDismissUploadError}
        onClose={vm.onDismissUploadError}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: ValueConstants.one },
  settingsSections: {
    marginTop: spacing.lg,
  },
});

export default ProfileScreen;
