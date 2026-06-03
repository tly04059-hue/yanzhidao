export type V5RouteKey =
  | 'home'
  | 'downloads'
  | 'understand'
  | 'path'
  | 'test-entry'
  | 'test-quiz'
  | 'loading'
  | 'result'
  | 'zk-lib'
  | 'school-detail'
  | 'cases'
  | 'prep'
  | 'prep-dx'
  | 'prep-gz'
  | 'zexiao'
  | 'estimate'
  | 'map'
  | 'pass-rate'
  | 'wechat'
  | 'about'
  | 'data-source'
  | 'usage'

export type V5NavigationTarget = {
  label: string
  route: V5RouteKey
}

export type V5MetricCard = {
  value: string
  label: string
  note: string
  route: V5RouteKey
}

export type V5EntryCard = {
  title: string
  description: string
  action: string
  route: V5RouteKey
}

export type V5SectionHeader = {
  title: string
  meta?: string
}
