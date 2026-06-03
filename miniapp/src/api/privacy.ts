export const ensurePrivacyAuthorization = () =>
  new Promise<boolean>((resolve) => {
    // #ifdef MP-WEIXIN
    const wxAny = (globalThis as any).wx
    if (typeof wxAny?.requirePrivacyAuthorize === 'function') {
      wxAny.requirePrivacyAuthorize({
        success: () => resolve(true),
        fail: () => resolve(false)
      })
      return
    }
    // #endif

    resolve(true)
  })
