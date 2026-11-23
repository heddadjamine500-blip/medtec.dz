import React from 'react';
import logoColored from '../assets/logo.svg';
import logoMonochrome from '../assets/logo-monochrome.svg';

export type MedicalLogoProps = {
  /**
   * Size in pixels (both width and height). If omitted, defaults to 150px.
   */
  size?: number;
  /**
   * If true, renders the monochrome (single‑color) version of the logo.
   * Useful for dark backgrounds.
   */
  monochrome?: boolean;
  /**
   * Additional Tailwind / CSS classes applied to the root <img> element.
   */
  className?: string;
};

/**
 * Re‑usable component that renders the MEDTEC brand logo.
 * It loads the SVG asset generated for the project and respects the
 * `size` and `monochrome` props. The component is deliberately simple –
 * the animation is handled by a separate `AnimatedLogo` component.
 */
export const MedicalLogo: React.FC<MedicalLogoProps> = ({
  size = 150,
  monochrome = false,
  className = '',
}) => {
  const src = monochrome ? logoMonochrome : logoColored;
  // Ensure the image is square; Tailwind utility `object-contain` keeps aspect ratio.
  return (
    <img
      src={src}
      alt="MEDTEC logo"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
};

export default MedicalLogo;
