declare module 'mirador' {
  export interface MiradorConfig {
    id: string
    windows?: Array<{
      manifestId: string
      thumbnailNavigationPosition?: string
    }>
    window?: any
    workspace?: any
    workspaceControlPanel?: any
    thumbnailNavigation?: any
  }

  export interface MiradorInstance {
    store: any
  }

  export default class Mirador {
    static viewer(config: MiradorConfig): MiradorInstance
  }
}
