/// <reference types="vite/client" />

declare const __BUILD_TIME__: string

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_ANALYTICS_BASE_URL?: string
  readonly VITE_ANALYTICS_ENV?: 'development' | 'trial' | 'production'
  readonly VITE_APP_VERSION?: string
  readonly VITE_TRACKING_PLAN_VERSION?: string
  readonly VITE_ENABLE_LOCAL_ANALYTICS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}
