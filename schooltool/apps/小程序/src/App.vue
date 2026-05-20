<script>
export default {
  onLaunch() {
    console.log('研知道小程序启动')
  }
}
</script>

<style>
:root {
  --yz-bg: #f3efe6;
  --yz-paper: #fffdf8;
  --yz-ink: #1d2a38;
  --yz-muted: #6a7280;
  --yz-primary: #1f3f63;
  --yz-accent: #b14d32;
  --yz-gold: #c49b54;
}

/* H5端：限制最大宽度并居中，模拟手机体验 */
/* #ifdef H5 */
uni-app {
  max-width: 430px;
  margin: 0 auto;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  min-height: 100vh;
  position: relative;
}

uni-tabbar {
  max-width: 430px !important;
  margin: 0 auto !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
}
/* #endif */

/* 小程序端：全屏显示 */
/* #ifdef MP-WEIXIN */
uni-app {
  width: 100%;
  min-height: 100vh;
}
/* #endif */

body {
  background:
    radial-gradient(circle at top left, rgba(196, 155, 84, 0.18), transparent 34%),
    linear-gradient(180deg, #ece5d9 0%, #f4efe8 48%, #ebe4d7 100%);
}

page {
  background-color: var(--yz-bg);
  font-family: 'PingFang SC', 'Noto Serif SC', 'Microsoft YaHei', sans-serif;
  color: var(--yz-ink);
  font-size: 16px;
  line-height: 1.6;
}
</style>
