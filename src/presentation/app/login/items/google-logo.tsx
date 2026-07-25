import Svg, { Path } from 'react-native-svg';
import { iconSizes, BrandColors } from '@presentation/base/theme';

export interface GoogleLogoProps {
  size?: number;
}

/**
 * Official multicolor Google "G" mark, inlined as SVG paths so it renders
 * identically across platforms and scales crisply on the social sign-in button.
 */
export const GoogleLogo = ({ size = iconSizes.lg }: GoogleLogoProps): React.JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M21.35 11.1H12v3.16h5.35c-.5 2.55-2.66 4.4-5.35 4.4a5.66 5.66 0 1 1 0-11.32c1.45 0 2.8.55 3.83 1.46l2.34-2.34A8.96 8.96 0 0 0 12 3a9 9 0 1 0 9 9c0-.6-.05-1.2-.15-1.9z"
      fill={BrandColors.googleBlue}
    />
    <Path
      d="M3.88 7.43 6.5 9.36A5.66 5.66 0 0 1 12 7.34c1.45 0 2.8.55 3.83 1.46l2.34-2.34A8.96 8.96 0 0 0 12 3 8.99 8.99 0 0 0 3.88 7.43z"
      fill={BrandColors.googleRed}
    />
    <Path
      d="M12 21a8.96 8.96 0 0 0 6.18-2.37l-2.85-2.42A5.4 5.4 0 0 1 12 17a5.66 5.66 0 0 1-5.32-3.74l-2.66 2.05A9 9 0 0 0 12 21z"
      fill={BrandColors.googleGreen}
    />
    <Path
      d="M21.35 11.1H12v3.16h5.35a4.7 4.7 0 0 1-2.02 2.95l2.85 2.42A8.97 8.97 0 0 0 21 12c0-.6-.05-1.2-.15-1.9z"
      fill={BrandColors.googleYellow}
    />
  </Svg>
);
