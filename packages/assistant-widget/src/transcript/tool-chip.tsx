import { StyleSheet, Text, View } from 'react-native';
import { ToolRunStatus } from '@live-assistant/core';
import { useWidgetStrings } from '../strings/widget-strings-context';
import { useWidgetTheme } from '../theme/widget-theme-context';
import type { ToolEntry } from './tool-entry';

export interface ToolChipProps {
  readonly entry: ToolEntry;
}

const SMALLER = 0.85;

/**
 * The default look of a tool run: a small chip while it runs and when it
 * fails. A succeeded run shows nothing by default — the assistant says what
 * it did, and a chip saying the same thing again is noise. Override with
 * `renderTool` to show every run (as action chips, say).
 */
export function ToolChip({ entry }: ToolChipProps) {
  const theme = useWidgetTheme();
  const strings = useWidgetStrings();
  if (entry.status === ToolRunStatus.Succeeded || entry.status === ToolRunStatus.Cancelled) return null;

  const failed = entry.status === ToolRunStatus.Failed;
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: failed ? theme.colors.surface : theme.colors.toolChip,
          borderColor: failed ? theme.colors.danger : theme.colors.toolChip,
          borderRadius: theme.radius,
          paddingHorizontal: theme.spacing,
          paddingVertical: theme.spacing / 4,
          marginVertical: theme.spacing / 4,
        },
      ]}
    >
      <Text style={{ color: failed ? theme.colors.danger : theme.colors.toolText, fontSize: theme.fontSize * SMALLER }}>
        {failed ? strings.toolFailed(entry.call.name) : strings.toolRunning(entry.call.name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { alignSelf: 'center', borderWidth: StyleSheet.hairlineWidth },
});
