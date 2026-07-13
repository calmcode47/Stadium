declare module 'lucide-react/dist/esm/icons/*.mjs' {
  import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react'

  export interface LucideIconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
    size?: string | number
    absoluteStrokeWidth?: boolean
  }

  const Icon: ForwardRefExoticComponent<LucideIconProps & RefAttributes<SVGSVGElement>>
  export default Icon
}
