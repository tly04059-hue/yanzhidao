/**
 * 兼容旧命令：实际同步逻辑已迁移到 projectOps。
 */
const { spawnSync } = require('child_process')
const path = require('path')

const scriptDir = __dirname
const miniappRoot = path.resolve(scriptDir, '..')
const projectRoot = path.resolve(miniappRoot, '..')
const syncScript = path.join(projectRoot, 'projectOps/scripts/sync-miniapp-data.py')

const result = spawnSync('python3', [syncScript], {
  cwd: projectRoot,
  stdio: 'inherit'
})

if (result.status !== 0) {
  process.exit(result.status || 1)
}
