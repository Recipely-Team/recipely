import { ThemeVariant } from '@presentation/base/theme/context/theme-variant';
import { BreakpointType } from '@presentation/base/responsive/breakpoint-type';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import { ThemedTextVariant } from '@presentation/base/widgets/text/themed-text-variant';
import { NotifKind } from '@presentation/app/notifications/model/notif-kind';
import { AuthField } from '@presentation/app/login/model/auth-field';
import { SocialProvider } from '@presentation/app/login/model/social-provider';
import { NotificationFilter } from '@presentation/app/notifications/model/notification-filter';
import { TaxonomyPickerKind } from '@presentation/app/create-recipe/model/taxonomy-picker-kind';

/**
 * These were plain string unions that components compared against literals, so
 * the vocabulary existed in the type and nowhere a value could point at. Now
 * that they are const objects, the one thing the compiler still cannot catch is
 * two members sharing a value — the union collapses and two distinct cases
 * become one at runtime while reading as separate names at every call site.
 */
describe.each([
  ['ThemeVariant', ThemeVariant],
  ['BreakpointType', BreakpointType],
  ['SeverityType', SeverityType],
  ['ThemedTextVariant', ThemedTextVariant],
  ['NotifKind', NotifKind],
  ['AuthField', AuthField],
  ['SocialProvider', SocialProvider],
  ['NotificationFilter', NotificationFilter],
  ['TaxonomyPickerKind', TaxonomyPickerKind],
])('%s', (_name, vocabulary) => {
  it('has no two members sharing a value', () => {
    const values = Object.values(vocabulary);

    expect(new Set(values).size).toBe(values.length);
  });

  it('has no blank member', () => {
    expect(Object.values(vocabulary).filter((v) => v.trim().length === 0)).toEqual([]);
  });
});
