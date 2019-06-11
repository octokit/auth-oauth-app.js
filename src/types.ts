import { request } from '@octokit/request'

export type StrategyOptions = {
  clientId: number,
  clientSecret: string,
  request?: typeof request
}

type AuthCodeOptions =  {
  code: string,
  redirectUrl?: string,
  state?: string
}

export type AuthOptions = AuthCodeOptions | { url: string }
