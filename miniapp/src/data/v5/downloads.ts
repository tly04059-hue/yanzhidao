import { remoteAssets } from '../remote-assets'

export type V6DownloadSubject = {
  title: string
  fileName: string
  fileSrc: string
  type: 'document' | 'image'
  fileType?: 'pdf' | 'jpg'
}

export type V6DownloadItem = {
  id: string
  title: string
  fileName: string
  previewSrc: string
  fileSrc: string
  type: 'image' | 'document'
  fileType?: 'jpg' | 'pdf' | 'docx'
  tag: string
  note: string
  subjects?: V6DownloadSubject[]
  previewMeta?: {
    eyebrow?: string
    subtitle?: string
    footer?: string
    crop?: 'top'
  }
}

export const v6DownloadsContent = {
  route: 'downloads',
  title: '资料下载',
  brandLine: '资料预览 · 保存到手机里慢慢看',
  hero: {
    // kicker: '下载专区',
    title: '2026四川党校在职研考前必背一页纸',
    // subtitle: '图片资料可直接保存到相册，文档资料可直接打开。'
  },
  // section: {
  //   title: '本页资料',
  //   meta: '1 个文件'
  // },
  hint: '首次保存图片时，请允许访问相册。文档会在手机中直接打开，可继续保存、转发或收藏。',
  items: [
    {
      id: 'sc-party-2026-one-page',
      title: '26四川党校考前必背一页纸',
      fileName: '26四川党校考前必背一页纸.jpg',
      previewSrc: remoteAssets.downloads.onePageImage,
      fileSrc: remoteAssets.downloads.onePageImage,
      type: 'image',
      fileType: 'jpg',
      tag: '',
      note: '考前复习资料，可保存到手机后查看。',
      subjects: [
        {
          title: '2026四川党校在职研究生 政治学',
          fileName: '政治学.jpg',
          fileSrc: remoteAssets.downloads.politicsJpg,
          type: 'image',
          fileType: 'jpg'
        },
        {
          title: '2026四川党校在职研究生 经济学',
          fileName: '经济学.jpg',
          fileSrc: remoteAssets.downloads.economicsJpg,
          type: 'image',
          fileType: 'jpg'
        },
        {
          title: '2026四川党校在职研究生 法学',
          fileName: '法学.jpg',
          fileSrc: remoteAssets.downloads.lawJpg,
          type: 'image',
          fileType: 'jpg'
        }
      ],
      previewMeta: {
        crop: 'top'
      }
    }
  ] as V6DownloadItem[]
} as const

export type V6DownloadsContent = typeof v6DownloadsContent
