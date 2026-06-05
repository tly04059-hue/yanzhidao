<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { trackAppHide, trackAppLaunch, trackAppShow } from "@/api/tracking";

onLaunch((options) => {
  trackAppLaunch(options);
  if (import.meta.env.DEV) console.log("App Launch");
});
onShow((options) => {
  trackAppShow(options);
  if (import.meta.env.DEV) console.log("App Show");
});
onHide(() => {
  trackAppHide();
  if (import.meta.env.DEV) console.log("App Hide");
});
</script>
<style lang="scss">
/* ============================================================
   设计 Token · 对齐 6.0-实现稿-claude.html V6.0
   ============================================================ */
page {
  --c-accent: #CF7140;
  --c-accent-soft: #F1E0D3;
  --c-accent-dim: rgba(207, 113, 64, 0.08);
  --c-accent-deep: #B85F38;
  --c-accent-light: #E8A07A;
  --c-accent-dark: #A55925;
  --c-accent-ring: rgba(207, 113, 64, 0.22);
  --c-success: #5F8C6E;
  --c-success-soft: #DAE5DC;
  --c-bg: #FAF7F2;
  --c-bg-warm: #FAF6EF;
  --c-bg-tertiary: #F0E9DD;
  --c-card: #FFFFFF;
  --c-text-1: #2A251E;
  --c-text-2: #6B6258;
  --c-text-3: #8A8175;
  --c-border: #ECE5D8;
  --c-border-strong: #2C2A26;
  --c-divider: #E8E1D5;
  --c-dark-bg: #2A251E;
  --r-thumb: 6px;
  --r-card-sm: 14px;
  --r-card-md: 16px;
  --r-card: 18px;
  --r-card-lg: 20px;
  --r-card-xl: 24px;
  --r-pill: 999px;
  --sh-card: 0 2px 8px rgba(60, 50, 40, 0.04);
  --sh-card-lg: 0 4px 16px rgba(60, 50, 40, 0.06);
  --sh-cta: 0 6px 20px rgba(207, 113, 64, 0.22);
  --f-serif: "Songti SC", "STSong", "SimSun", "Noto Serif SC", "Source Han Serif SC", serif;
  --f-sans: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Source Han Sans SC", system-ui, sans-serif;
}

html,
body,
#app {
  min-height: 100%;
  background: #FAF7F2;
  color: var(--c-text-1);
  font-family: var(--f-sans);
  font-size: 14px;
  line-height: 1.55;
}

page,
uni-page-wrapper,
uni-page-body {
  min-height: 100%;
  background: #FAF7F2;
  color: var(--c-text-1);
}

page,
view,
text,
button,
input,
textarea,
picker,
scroll-view,
swiper,
navigator {
  font-family: inherit;
}
</style>
