// 注意：tabs 配置需与 src/data/tabbar.ts 保持同步
Component({
  data: {
    selected: '/pages/index/index',
    tabs: [
      {
        path: '/pages/index/index',
        text: '首页',
        icon: '/static/tab-home.png',
        activeIcon: '/static/tab-home-active.png'
      },
      {
        path: '/pages/learn/index',
        text: '了解',
        icon: '/static/tab-learn.png',
        activeIcon: '/static/tab-learn-active.png'
      },
      {
        path: '/pages/test/index',
        text: '测一测',
        icon: '/static/tab-test.png',
        activeIcon: '/static/tab-test-active.png'
      }
    ]
  },

  methods: {
    switchTab(e) {
      const path = e.currentTarget.dataset.path
      wx.switchTab({ url: path })
    },

    updateSelected(path) {
      if (this.data.tabs.some(t => t.path === path)) {
        this.setData({ selected: path })
      }
    }
  }
})
