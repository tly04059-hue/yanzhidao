import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  define: {
    __BUILD_TIME__: JSON.stringify(
      new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })
    ),
  },
});
