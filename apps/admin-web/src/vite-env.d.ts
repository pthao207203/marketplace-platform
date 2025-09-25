/// <reference types="vite/client" />

declare module '*.svg?react' {
  import * as React from 'react'
  const Component: React.ForwardRefExoticComponent<
    React.SVGProps<SVGSVGElement> & React.RefAttributes<SVGSVGElement>
  >
  export default Component
  export { Component as ReactComponent }
}
